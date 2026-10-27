import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('test-results/visual-audit');
fs.mkdirSync(dir, { recursive: true });
const reports = [];
for (const folder of fs.readdirSync(dir, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  for (const file of fs.readdirSync(path.join(dir, folder.name))) {
    if (!file.endsWith('.json')) continue;
    try { reports.push(JSON.parse(fs.readFileSync(path.join(dir, folder.name, file), 'utf8'))); }
    catch (error) { console.error('Falha ao ler relatório:', file, error); }
  }
}
reports.sort((a, b) => a.viewport.width - b.viewport.width || a.section.localeCompare(b.section));
const problems = reports.flatMap((r) => r.issues.map((issue) => ({
  viewport: r.viewport.width + 'x' + r.viewport.height,
  page: r.section, ...issue,
})));
const summary = {
  generated_at: new Date().toISOString(),
  total_pages: reports.length,
  screenshots: reports.reduce((total, r) => total + r.screenshots.length, 0),
  total_issues: problems.length,
  problems,
  pages: reports
};
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
const lines = [
  '# Auditoria visual automática — Image Gallery', '',
  '- Páginas/resoluções verificadas: **' + reports.length + '**',
  '- Capturas de tela: **' + summary.screenshots + '**',
  '- Erros de JavaScript, rede ou layout: **' + problems.length + '**', '',
  '| Resolução | Página | Capturas | Problemas |',
  '| --- | --- | ---: | ---: |',
];
for (const r of reports) {
  lines.push('| ' + r.viewport.width + '×' + r.viewport.height + ' | ' + r.section +
    ' | ' + r.screenshots.length + ' | ' + r.issues.length + ' |');
}
if (problems.length) {
  lines.push('', '## Problemas', '');
  for (const p of problems) lines.push('- ' + p.viewport + ' / ' + p.page + ': ' + JSON.stringify(p));
}
lines.push('', '## Capturas', '');
for (const r of reports) for (const screenshot of r.screenshots) lines.push('- [' + screenshot + '](' + screenshot + ')');
fs.writeFileSync(path.join(dir, 'SUMMARY.md'), lines.join('\n') + '\n');
const escaped = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const tiles = reports.flatMap((r) => r.screenshots.map((screen) =>
  '<article><a href="' + escaped(screen) + '"><img loading="lazy" src="' + escaped(screen) +
  '" alt="Captura ' + escaped(screen) + '"></a><p>' + escaped(screen) + '</p></article>'));
fs.writeFileSync(path.join(dir, 'index.html'), '<!DOCTYPE html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Image Gallery — Auditoria visual</title><style>body{font:16px system-ui;background:#0c1525;color:#eef;padding:2rem}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem}article{background:#1a2a41;border-radius:1rem;padding:1rem;min-width:0}img{width:100%;height:240px;object-fit:contain;background:#050914}p{overflow-wrap:anywhere;font-size:.8rem}a{color:#b9c7ff}</style><h1>Capturas automáticas — Image Gallery</h1><p>' +
  summary.screenshots + ' capturas · ' + problems.length + ' problemas</p><main>' +
  tiles.join('') + '</main></html>');
console.log(lines.join('\n'));
