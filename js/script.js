/** Image Gallery — dependency-free, accessible client application. */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'image-gallery-selection-v2';
const FAVORITES_KEY = 'image-gallery-favorites-v2';
const demo = location.hostname.endsWith('.github.io') || new URLSearchParams(location.search).get('demo') === '1';

let photos = [];
let selected = new Set();
let favorites = new Set();
let activeFilter = 'all';
let searchText = '';
let activeIndex = 0;
let toastTimeout;

function readStored(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}
function store() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Private browsing or disabled storage: all controls still work in memory.
  }
}
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('is-visible'), 3200);
}
function feedback(message, kind = '') {
  const element = $('#formFeedback');
  element.textContent = message;
  element.className = 'form-feedback' + (kind ? ' is-' + kind : '');
}
function visiblePhotos() {
  return photos.filter((photo) => {
    const matchFilter = activeFilter === 'all' ||
      (activeFilter === 'selected' && selected.has(photo.id)) ||
      (activeFilter === 'favorites' && favorites.has(photo.id));
    const matchSearch = !searchText || (photo.title + ' ' + photo.alt).toLocaleLowerCase('pt-BR').includes(searchText);
    return matchFilter && matchSearch;
  });
}
function updateSummary() {
  const count = selected.size;
  const shown = visiblePhotos();
  const filtered = activeFilter !== 'all' || searchText.length > 0;
  const allShownSelected = shown.length > 0 && shown.every((photo) => selected.has(photo.id));

  $('#selectedCount').textContent = count === 1 ? '1 foto selecionada' : count + ' fotos selecionadas';
  $('#tabCount').textContent = String(count);
  // Keep the selection controls below the gallery, and hide them when unused.
  $('#selectionBar').hidden = count === 0;
  $('#gallerySummary').textContent = filtered
    ? shown.length + ' de ' + photos.length + ' fotografias exibidas'
    : photos.length === 1 ? '1 fotografia disponível' : photos.length + ' fotografias disponíveis';

  const hint = $('#fieldHint');
  hint.textContent = count === 0
    ? 'Escolha pelo menos uma fotografia para continuar.'
    : (count === 1 ? '1 fotografia pronta' : count + ' fotografias prontas') +
      (demo ? ' para baixar em CSV.' : ' para registrar.');
  hint.classList.toggle('has-selection', count > 0);

  $('#selectAll').disabled = shown.length === 0 || allShownSelected;
  $('#selectAll').textContent = allShownSelected ? 'Visíveis selecionadas' : 'Selecionar visíveis';
  $('#clearAll').disabled = count === 0;
  $('#shareButton').disabled = count === 0;
  $('#exportButton').disabled = count === 0;
}
function toggleSelection(id, value) {
  if (value) selected.add(id);
  else selected.delete(id);
  store();
  renderGallery();
  if ($('#lightbox').open) updateLightbox();
  feedback('');
}
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  store();
  renderGallery();
  if ($('#lightbox').open) updateLightbox();
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function renderCard(photo) {
  const card = element('article', 'photo-card' + (selected.has(photo.id) ? ' is-selected' : ''));
  card.dataset.cardId = photo.id;
  const preview = element('button', 'photo-preview');
  preview.type = 'button';
  preview.setAttribute('aria-label', 'Ampliar ' + photo.title);
  preview.title = photo.alt;
  preview.dataset.focus = photo.id + '-preview';
  const img = element('img');
  img.src = photo.src;
  img.alt = photo.alt;
  img.loading = photos.length <= 12 ? 'eager' : 'lazy';
  img.decoding = 'async';
  img.width = 480;
  img.height = 360;
  preview.append(img);
  preview.addEventListener('click', () => openLightbox(photos.findIndex((item) => item.id === photo.id)));
  const top = element('div', 'card-top');
  const checkLabel = element('label', 'select-toggle');
  const check = element('input');
  check.type = 'checkbox';
  check.checked = selected.has(photo.id);
  check.setAttribute('aria-label', 'Selecionar ' + photo.title);
  check.dataset.focus = photo.id + '-check';
  check.addEventListener('change', () => toggleSelection(photo.id, check.checked));
  checkLabel.append(check, document.createTextNode('Selecionar'));
  const favorite = element('button', 'favorite-toggle', favorites.has(photo.id) ? '♥' : '♡');
  favorite.type = 'button';
  favorite.setAttribute('aria-label', (favorites.has(photo.id) ? 'Remover ' : 'Adicionar ') + photo.title + (favorites.has(photo.id) ? ' das favoritas' : ' às favoritas'));
  favorite.setAttribute('aria-pressed', String(favorites.has(photo.id)));
  favorite.dataset.focus = photo.id + '-favorite';
  favorite.addEventListener('click', () => toggleFavorite(photo.id));
  top.append(checkLabel, favorite);
  const info = element('div', 'photo-info');
  const title = element('strong', '', photo.title);
  const state = element('span', '', selected.has(photo.id) ? 'Selecionada' : 'Disponível');
  info.append(title, state);
  card.append(preview, top, info);
  return card;
}
function renderGallery() {
  const focused = document.activeElement?.dataset?.focus;
  const container = $('#gallery');
  const items = visiblePhotos();
  const fragment = document.createDocumentFragment();
  items.forEach((photo) => fragment.append(renderCard(photo)));
  container.replaceChildren(fragment);
  container.setAttribute('aria-busy', 'false');
  $('#emptyState').hidden = items.length > 0;
  updateSummary();
  if (focused) {
    const matching = [...container.querySelectorAll('[data-focus]')].find((node) => node.dataset.focus === focused);
    if (matching) matching.focus({ preventScroll: true });
    else if (activeFilter !== 'all') $('[data-filter="' + activeFilter + '"]').focus({ preventScroll: true });
  }
}
function openLightbox(index) {
  if (index < 0 || index >= photos.length) return;
  activeIndex = index;
  updateLightbox();
  $('#lightbox').showModal();
  $('#lightboxClose').focus();
}
function updateLightbox() {
  if (!photos.length) return;
  const photo = photos[activeIndex];
  $('#lightboxImage').src = photo.src;
  $('#lightboxImage').alt = photo.alt;
  $('#lightboxCaption').textContent = photo.title;
  $('#lightboxPosition').textContent = (activeIndex + 1) + ' de ' + photos.length;
  $('#lightboxSelected').checked = selected.has(photo.id);
  const favored = favorites.has(photo.id);
  $('#lightboxFavorite').textContent = favored ? '♥ Favorita' : '♡ Favoritar';
  $('#lightboxFavorite').setAttribute('aria-pressed', String(favored));
}
function moveLightbox(delta) {
  activeIndex = (activeIndex + delta + photos.length) % photos.length;
  updateLightbox();
}
function csvEscape(value) {
  const text = String(value);
  // Prevent spreadsheet formula execution when a user supplies a CSV name.
  const safe = /^\s*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
function exportCSV(name = '') {
  if (!selected.size) return toast('Selecione uma fotografia para exportar.');
  const rows = name
    ? [['nome', 'id', 'fotografia'], ...photos.filter((photo) => selected.has(photo.id)).map((p) => [name, p.id, p.title])]
    : [['id', 'fotografia'], ...photos.filter((photo) => selected.has(photo.id)).map((p) => [p.id, p.title])];
  const csv = '\uFEFF' + rows.map((row) => row.map(csvEscape).join(';')).join('\r\n') + '\r\n';
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = element('a');
  link.href = url;
  link.download = 'image-gallery-selecao.csv';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('CSV da seleção preparado.');
}
async function shareSelection() {
  if (!selected.size) return;
  const url = new URL(location.href);
  // Share only photo IDs: do not carry campaign parameters or unrelated URL data.
  url.search = '';
  url.searchParams.set('selecionadas', photos.filter((photo) => selected.has(photo.id)).map((photo) => photo.id).join(','));
  url.hash = '';
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url.href);
    toast('Link com a seleção copiado!');
  } catch {
    toast('Não foi possível copiar. Use Exportar CSV.');
  }
}
async function submitSelection(event) {
  event.preventDefault();
  if (!selected.size) {
    feedback('Escolha pelo menos uma fotografia.', 'error');
    $('#galeria').scrollIntoView({ behavior: 'auto' });
    return;
  }
  const input = $('#nome');
  if (!input.reportValidity()) return;
  if (demo) {
    exportCSV(input.value.trim());
    feedback('Seleção concluída e exportada para este dispositivo. Nenhum dado foi enviado a um servidor.', 'success');
    toast('Sua seleção local foi concluída!');
    return;
  }
  const button = $('#sendButton');
  const form = new FormData();
  form.append('nome', input.value.trim());
  photos.filter((p) => selected.has(p.id)).forEach((photo) => form.append('selected[]', photo.id));
  button.disabled = true;
  button.textContent = 'Enviando…';
  feedback('Registrando sua seleção…');
  try {
    const response = await fetch('./save.php', {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Não foi possível registrar a seleção.');
    feedback('Seleção registrada! Protocolo: ' + payload.id, 'success');
    toast('Seleção enviada com sucesso!');
  } catch (error) {
    feedback(error instanceof Error ? error.message : 'Erro ao enviar. Tente novamente.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Enviar seleção ↗';
  }
}
async function loadCatalog() {
  $('#gallery').setAttribute('aria-busy', 'true');
  $('#gallerySummary').textContent = 'Carregando coleção…';
  try {
    const response = await fetch('./images.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Não foi possível carregar a coleção.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Catálogo inválido.');
    const seen = new Set();
    photos = data.filter((p) => p && typeof p.id === 'string' && /^foto-\d+$/.test(p.id) &&
      typeof p.title === 'string' && typeof p.alt === 'string' &&
      typeof p.src === 'string' && /^\.\/img\/[0-9]+\.jpg$/.test(p.src) &&
      !seen.has(p.id) && seen.add(p.id));
    const valid = new Set(photos.map((p) => p.id));
    const shared = new URLSearchParams(location.search).get('selecionadas');
    selected = new Set((shared !== null ? shared.split(',') : readStored(STORAGE_KEY)).filter((id) => valid.has(id)));
    favorites = new Set(readStored(FAVORITES_KEY).filter((id) => valid.has(id)));
    store();
    renderGallery();
  } catch (error) {
    photos = [];
    renderGallery();
    $('#gallerySummary').textContent = 'Falha ao carregar a coleção';
    $('#emptyState').querySelector('h3').textContent = 'Não foi possível carregar as imagens';
    $('#emptyState').querySelector('p').textContent = 'Verifique sua conexão e tente novamente.';
  }
}
function setup() {
  $('#year').textContent = String(new Date().getFullYear());
  $('#demoNote').hidden = !demo;
  if (demo) {
    $('#demoNote').textContent = 'Modo GitHub Pages: sua seleção funciona neste navegador. Ao concluir, um arquivo CSV será baixado; não há envio a servidor.';
    $('#sendButton').textContent = 'Concluir e baixar seleção ↗';
    $('#sendTitle').textContent = 'Pronto para concluir?';
    $('.details-copy > p').textContent = 'Confira suas escolhas, informe seu nome e baixe um arquivo CSV com sua seleção, sem precisar de servidor.';
    $('.privacy-note').textContent = 'Nenhuma informação é enviada a um servidor. Apenas as fotos selecionadas ficam salvas neste navegador.';
  }
  $$('.tab').forEach((button) => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    $$('.tab').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    renderGallery();
  }));
  $('#search').addEventListener('input', (event) => {
    searchText = event.target.value.trim().toLocaleLowerCase('pt-BR');
    renderGallery();
  });
  $('#resetFilters').addEventListener('click', () => {
    searchText = '';
    $('#search').value = '';
    $('[data-filter="all"]').click();
    if (!photos.length) loadCatalog();
  });
  $('#selectAll').addEventListener('click', () => {
    visiblePhotos().forEach((photo) => selected.add(photo.id));
    store();
    renderGallery();
    toast('Fotografias visíveis selecionadas.');
  });
  $('#clearAll').addEventListener('click', () => {
    selected.clear();
    store();
    renderGallery();
    feedback('');
    toast('Seleção limpa.');
  });
  $('#exportButton').addEventListener('click', () => exportCSV());
  $('#shareButton').addEventListener('click', shareSelection);
  $('#sendForm').addEventListener('submit', submitSelection);
  $('#lightboxClose').addEventListener('click', () => $('#lightbox').close());
  $('#lightboxPrev').addEventListener('click', () => moveLightbox(-1));
  $('#lightboxNext').addEventListener('click', () => moveLightbox(1));
  $('#lightboxSelected').addEventListener('change', (event) => toggleSelection(photos[activeIndex].id, event.target.checked));
  $('#lightboxFavorite').addEventListener('click', () => toggleFavorite(photos[activeIndex].id));
  $('#lightbox').addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); moveLightbox(1); }
  });
  $('#lightbox').addEventListener('click', (event) => {
    if (event.target === $('#lightbox')) $('#lightbox').close();
  });
  loadCatalog();
}
setup();
