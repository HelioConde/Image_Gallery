import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.locator('.photo-card')).toHaveCount(9);
});
test('galeria carrega 9 fotografias e cabe na largura da tela', async ({ page }, testInfo) => {
  await expect(page.locator('#selectedCount')).toHaveText('0 fotos selecionadas');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect.poll(async () => page.locator('.photo-preview img').evaluateAll(
    (images) => images.every((img) => img.complete && img.naturalWidth > 0)
  )).toBe(true);
  // Screenshot tools do not always rasterize offscreen images even after download.
  // Visit the full viewport range once to check the painted mobile/desktop experience.
  await page.evaluate(async () => {
    const tick = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const distance = Math.max(250, Math.round(innerHeight * 0.7));
    for (let y = 0; y < document.documentElement.scrollHeight; y += distance) {
      scrollTo(0, y);
      await tick();
    }
    scrollTo(0, 0);
    await tick();
  });
  fs.mkdirSync('test-results/screenshots', { recursive: true });
  await page.screenshot({ path: 'test-results/screenshots/' + testInfo.project.name + '-gallery.png', fullPage: true });
});
test('aviso do GitHub Pages aparece somente no rodapé, após o formulário', async ({ page }) => {
  const note = page.locator('#demoNote');
  await expect(note).toBeVisible();
  await expect(note).toHaveText('Modo GitHub Pages: sua seleção funciona neste navegador. Ao concluir, um arquivo CSV será baixado; não há envio a servidor.');
  await expect(page.locator('.intro #demoNote')).toHaveCount(0);
  const position = await page.evaluate(() => {
    const note = document.querySelector('#demoNote');
    const footer = document.querySelector('footer');
    const form = document.querySelector('#enviar');
    const intro = document.querySelector('.intro');
    const absoluteTop = (element) => element.getBoundingClientRect().top + window.scrollY;
    return {
      inFooter: footer.contains(note),
      afterForm: absoluteTop(note) > absoluteTop(form) + form.offsetHeight,
      afterIntro: absoluteTop(note) > absoluteTop(intro) + intro.offsetHeight,
      hiddenBeforeFooter: document.querySelector('.intro #demoNote') === null,
    };
  });
  expect(position.inFooter).toBe(true);
  expect(position.afterForm).toBe(true);
  expect(position.afterIntro).toBe(true);
  expect(position.hiddenBeforeFooter).toBe(true);
});
test('busca mostra quantidade filtrada e formulário acompanha a seleção', async ({ page }) => {
  const hint = page.locator('#fieldHint');
  await expect(hint).toContainText('Escolha pelo menos uma');
  await page.locator('#search').fill('Fotografia 03');
  await expect(page.locator('.photo-card')).toHaveCount(1);
  await expect(page.locator('#gallerySummary')).toHaveText('1 de 9 fotografias exibidas');
  await page.locator('.select-toggle input').first().check();
  await expect(hint).toHaveText('1 fotografia pronta para baixar em CSV.');
  await expect(page.locator('#selectAll')).toBeDisabled();
  await expect(page.locator('#selectAll')).toHaveText('Visíveis selecionadas');
  await page.locator('#clearAll').click();
  await expect(hint).toContainText('Escolha pelo menos uma');
});

test('barra de seleção nunca cobre as fotos e desaparece quando vazia', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 650 });
  const bar = page.locator('#selectionBar');
  await expect(bar).toBeHidden();
  await page.locator('.select-toggle input').first().check();
  await expect(bar).toBeVisible();
  await expect(bar.locator('#selectedCount')).toHaveText('1 foto selecionada');
  const positions = await page.evaluate(() => {
    const dock = document.querySelector('#selectionBar');
    const gallery = document.querySelector('#gallery');
    const lastCard = gallery.lastElementChild;
    const rectangle = dock.getBoundingClientRect();
    return {
      dockPosition: getComputedStyle(dock).position,
      dockTop: rectangle.top + scrollY,
      lastCardBottom: lastCard.getBoundingClientRect().bottom + scrollY,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      afterGallery: gallery.compareDocumentPosition(dock) & Node.DOCUMENT_POSITION_FOLLOWING,
    };
  });
  expect(positions.dockPosition).not.toBe('fixed');
  expect(positions.dockPosition).not.toBe('sticky');
  expect(positions.dockTop).toBeGreaterThanOrEqual(positions.lastCardBottom - 1);
  expect(positions.horizontalOverflow).toBe(false);
  expect(positions.afterGallery).toBeTruthy();
  await page.locator('#clearAll').click();
  await expect(bar).toBeHidden();
});
test('1366px desktop distribui as nove fotos em apenas duas linhas', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 650 });
  const rows = await page.locator('.photo-card').evaluateAll((cards) =>
    new Set(cards.map((card) => Math.round(card.offsetTop))).size);
  expect(rows).toBe(2);
});

test('seleciona, filtra e limpa as imagens sem perder consistência', async ({ page }) => {
  await page.locator('.select-toggle input').first().check();
  await expect(page.locator('#selectedCount')).toHaveText('1 foto selecionada');
  await page.locator('[data-filter="selected"]').click();
  await expect(page.locator('.photo-card')).toHaveCount(1);
  await page.locator('#clearAll').click();
  await expect(page.locator('.photo-card')).toHaveCount(0);
  await expect(page.locator('#emptyState')).toBeVisible();
  await page.locator('#resetFilters').click();
  await expect(page.locator('.photo-card')).toHaveCount(9);
});
test('favorita e pesquisa fotografias', async ({ page }) => {
  await page.locator('.favorite-toggle').first().click();
  await page.locator('[data-filter="favorites"]').click();
  await expect(page.locator('.photo-card')).toHaveCount(1);
  await page.locator('[data-filter="all"]').click();
  await page.locator('#search').fill('Fotografia 03');
  await expect(page.locator('.photo-card')).toHaveCount(1);
  await expect(page.locator('.photo-card')).toContainText('Fotografia 03');
});
test('modal abre com teclado, permite avançar e fecha com Escape', async ({ page }) => {
  await page.locator('.photo-preview').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#lightbox')).toBeVisible();
  await expect(page.locator('#lightboxPosition')).toHaveText('1 de 9');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightboxPosition')).toHaveText('2 de 9');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).not.toBeVisible();
});
test('exportação CSV inclui IDs e não inclui dados pessoais', async ({ page }) => {
  await page.locator('.select-toggle input').first().check();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportButton').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('image-gallery-selecao.csv');
  const stream = await download.createReadStream();
  const parts = [];
  for await (const chunk of stream) parts.push(chunk);
  const csv = Buffer.concat(parts).toString('utf8');
  expect(csv).toContain('foto-0');
  expect(csv).not.toContain('nome');
});
test('GitHub Pages conclui seleção localmente e entrega CSV com nome', async ({ page }) => {
  await page.locator('.select-toggle input').first().check();
  await page.locator('#nome').fill('Pessoa Teste');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#sendButton').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('image-gallery-selecao.csv');
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString('utf8')).toContain('Pessoa Teste');
  await expect(page.locator('#formFeedback')).toContainText('concluída e exportada');
});
test('respeita preferência por movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page.locator('.photo-card').first().evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(duration).toContain('1e-05s');
});
