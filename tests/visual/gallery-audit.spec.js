import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve('test-results/visual-audit');
const widths = [
  { width: 320, height: 720, label: 'mobile-pequeno' },
  { width: 375, height: 812, label: 'mobile' },
  { width: 390, height: 844, label: 'mobile-moderno' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1024, height: 768, label: 'tablet-paisagem' },
  { width: 1280, height: 800, label: 'notebook' },
  { width: 1440, height: 900, label: 'desktop' },
  { width: 1600, height: 900, label: 'desktop-wide' },
  { width: 1920, height: 1080, label: 'full-hd' },
];

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push({ type: 'javascript', message: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ type: 'console', message: message.text() });
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? '';
    if (!/ERR_ABORTED/i.test(failure)) {
      errors.push({ type: 'network', url: request.url(), message: failure });
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === new URL(page.url()).origin) {
      errors.push({ type: 'http', url: response.url(), status: response.status() });
    }
  });
  return errors;
}

async function scrollThroughPage(page) {
  await page.evaluate(async () => {
    const paint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const step = Math.max(220, Math.floor(innerHeight * 0.65));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await paint();
    }
    scrollTo(0, 0);
    await paint();
  });
}

async function getLayout(page) {
  return page.evaluate(() => {
    const issues = [];
    const margin = 3;
    const bodyWidth = document.documentElement.scrollWidth;
    if (bodyWidth > innerWidth + margin) issues.push({
      type: 'horizontal-overflow', selector: 'html',
      scrollWidth: bodyWidth, viewportWidth: innerWidth
    });
    const candidates = document.querySelectorAll(
      'header, main, footer, .selection-bar, .tabs, .search, .gallery-grid, .photo-card, .details, .send-form, .legacy-result'
    );
    for (const item of candidates) {
      const style = getComputedStyle(item);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = item.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.left < -margin || rect.right > innerWidth + margin) {
        issues.push({
          type: 'out-of-viewport', selector: item.className || item.tagName.toLowerCase(),
          left: Math.round(rect.left), right: Math.round(rect.right), viewportWidth: innerWidth
        });
      }
    }
    for (const item of document.querySelectorAll('.tab, .selection-actions .button, .toolbar-actions .button')) {
      if (item.scrollWidth > item.clientWidth + margin) issues.push({
        type: 'clipped-control-text', selector: item.className,
        text: item.textContent.trim(), scrollWidth: item.scrollWidth, clientWidth: item.clientWidth
      });
    }
    const badImages = [...document.querySelectorAll('img')].filter(
      (img) => !img.complete || img.naturalWidth === 0
    ).map((img) => ({ type: 'broken-image', src: img.getAttribute('src') }));
    issues.push(...badImages);
    return {
      issues,
      totalImages: document.images.length,
      checkedControls: document.querySelectorAll('button, input, a').length,
      documentHeight: document.documentElement.scrollHeight,
      scrollWidth: bodyWidth,
      viewportWidth: innerWidth,
    };
  });
}

async function audit(page, data, section, filename) {
  const fileDir = path.join(OUTPUT, data.label);
  fs.mkdirSync(fileDir, { recursive: true });
  const failures = watchErrors(page);
  let metrics = null;
  const screenshots = [];
  try {
    const target = section === 'inicio' ? '/?demo=1' : '/enviado.html';
    await page.goto(target, { waitUntil: 'load' });
    if (section === 'inicio') {
      await expect(page.locator('.photo-card')).toHaveCount(9);
      await expect.poll(async () => page.locator('.photo-preview img').evaluateAll(
        (images) => images.every((img) => img.complete && img.naturalWidth > 0)
      )).toBe(true);
    }
    await scrollThroughPage(page);
    metrics = await getLayout(page);
    const image = path.join(fileDir, filename + '.png');
    await page.screenshot({ path: image, fullPage: true, animations: 'disabled' });
    screenshots.push(path.relative(OUTPUT, image).replaceAll(path.sep, '/'));

    if (section === 'inicio' && (data.width === 390 || data.width === 1440)) {
      await page.locator('.select-toggle input').first().check();
      const selected = path.join(fileDir, 'inicio-selecionada.png');
      await page.screenshot({ path: selected, fullPage: true, animations: 'disabled' });
      screenshots.push(path.relative(OUTPUT, selected).replaceAll(path.sep, '/'));

      await page.locator('.photo-preview').first().click();
      await expect(page.locator('#lightbox')).toBeVisible();
      await expect.poll(async () => page.locator('#lightboxImage').evaluate(
        (img) => img.complete && img.naturalWidth > 0
      )).toBe(true);
      const modal = path.join(fileDir, 'visualizador.png');
      await page.screenshot({ path: modal, fullPage: true, animations: 'disabled' });
      screenshots.push(path.relative(OUTPUT, modal).replaceAll(path.sep, '/'));
      const box = await page.locator('#lightbox').boundingBox();
      if (!box || box.x < -3 || box.x + box.width > data.width + 3) {
        metrics.issues.push({ type: 'clipped-modal', box });
      }
    }
  } catch (error) {
    failures.push({ type: 'audit-exception', message: String(error) });
    try {
      const diagnostic = path.join(fileDir, filename + '-erro.png');
      await page.screenshot({ path: diagnostic, fullPage: true });
      screenshots.push(path.relative(OUTPUT, diagnostic).replaceAll(path.sep, '/'));
    } catch { /* Page may have crashed; still emit JSON. */ }
  }
  const report = {
    viewport: data, section, address: page.url(), date: new Date().toISOString(),
    screenshots, metrics,
    issues: [...failures, ...(metrics?.issues || [])],
  };
  fs.writeFileSync(path.join(fileDir, filename + '.json'), JSON.stringify(report, null, 2));
  expect(report.issues, JSON.stringify(report, null, 2)).toEqual([]);
}

for (const size of widths) {
  test('fotografar e auditar início em ' + size.width + '×' + size.height, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await audit(page, size, 'inicio', 'inicio');
  });
  test('fotografar e auditar página auxiliar em ' + size.width + '×' + size.height, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await audit(page, size, 'auxiliar', 'enviado');
  });
}
