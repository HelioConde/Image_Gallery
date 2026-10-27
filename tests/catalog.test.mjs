import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const images = JSON.parse(fs.readFileSync(path.join(root, 'images.json'), 'utf8'));

test('catálogo contém 9 imagens e IDs únicos', () => {
  assert.equal(images.length, 9);
  assert.equal(new Set(images.map((p) => p.id)).size, images.length);
});
test('todos os itens usam caminhos de mídia locais e possuem imagem existente', () => {
  for (const photo of images) {
    assert.match(photo.id, /^foto-\d+$/);
    assert.match(photo.src, /^\.\/img\/\d+\.jpg$/);
    assert.ok(photo.title && photo.alt);
    assert.ok(fs.statSync(path.join(root, photo.src)).size > 0, photo.src);
  }
});
test('interface tem controles semânticos e carregamento modular', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<dialog id="lightbox"/);
  assert.match(html, /<main\b/);
  assert.match(html, /type="module"/);
  assert.doesNotMatch(html, /onmouseup\s*=|onclick\s*=/i);
});
test('há suporte a movimento reduzido e controles de foco', () => {
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
});
test('PHP não deve usar caminho criado a partir do nome submetido', () => {
  const php = fs.readFileSync(path.join(root, 'save.php'), 'utf8');
  assert.match(php, /GALLERY_STORAGE_DIR/);
  assert.match(php, /random_bytes\(16\)/);
  assert.doesNotMatch(php, /\$nome\s*\.\s*['"]\.txt/);
});
