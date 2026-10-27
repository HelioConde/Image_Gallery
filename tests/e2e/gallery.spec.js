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
  fs.mkdirSync('test-results/screenshots', { recursive: true });
  await page.screenshot({ path: 'test-results/screenshots/' + testInfo.project.name + '-gallery.png', fullPage: true });
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
test('envio na versão demo explica ausência de PHP', async ({ page }) => {
  await page.locator('.select-toggle input').first().check();
  await page.locator('#nome').fill('Pessoa Teste');
  await page.locator('#sendButton').click();
  await expect(page.locator('#formFeedback')).toContainText('GitHub Pages');
});
test('respeita preferência por movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page.locator('.photo-card').first().evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(duration).toContain('1e-05s');
});
