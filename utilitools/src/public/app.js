const previousSections = {
  '#costos': '/calculadora/', '#perfiles': '/perfiles/', '#materiales': '/perfiles/#materiales',
  '#tecnicas': '/guias/', '#diagnostico': '/guias/#diagnostico', '#impresoras': '/perfiles/#impresoras',
  '#privacidad': '/herramientas/#privacidad', '#acerca': '/herramientas/#acerca'
};
const previousSection = previousSections[location.hash];
if (previousSection) location.replace(previousSection);

const models = [
  ['Flexi Turtle', 'Cults3D', 'gratis', ['STL'], 'https://cults3d.com/en/3d-model/gadget/flexi-turtle', 'Tortuga articulada · Juguetes'],
  ['Gridfinity Baseplate Lite', 'Printables', 'gratis', ['STL'], 'https://www.printables.com/model/478930-gridfinity-baseplate-quick-print-lite-version-less', 'Base modular · Organización'],
  ['Maceta Arquitectónica Clásica', 'Cults3D', 'pago', ['STL'], 'https://cults3d.com/es/modelo-3d/casa/maceta-arquitectonica-clasica-stl', 'Maceta con columnas · Decoración'],
  ['Soporte para pinzas Honeycomb', 'Printables', 'gratis', ['3MF'], 'https://www.printables.com/model/597461-honeycomb-storage-wall-hcw-tweezers-holder/files', 'Panel de herramientas · Taller'],
  ['Chocolate Truffle Dragon Clicker', 'Cults3D', 'pago', ['STL'], 'https://cults3d.com/en/3d-model/game/chocolate-truffle-dragon-clicker', 'Dragón clicker · Juguetes'],
  ['3DBenchy', 'Thingiverse', 'gratis', ['STL'], 'https://www.thingiverse.com/thing:763622', 'Barco de calibración · Pruebas de impresión'],
  ['Ajedrez clásico', 'Cults3D', 'gratis', ['STL', '3MF', 'OBJ'], 'https://cults3d.com/en/3d-model/game/classic-chess-set-printable-3d-print-model', 'Piezas de ajedrez · Chess set'],
  ['Maceta con autorriego', 'Shapekit', 'gratis', ['STL'], 'https://shapekit.cc/self-watering-planter', 'Maceta con depósito · Self-watering planter'],
  ['Cable Clip', 'Printables', 'gratis', ['STL'], 'https://www.printables.com/model/35858-cable-clip', 'Sujetacables · Organización'],
  ['Llavero Perú', 'Cults3D', 'gratis', ['STL'], 'https://cults3d.com/es/modelo-3d/joyas/llavero-peru-3dmini3d', 'Llavero · Keychain'],
  ['Soporte Gridfinity para 3DBenchy', 'Printables', 'gratis', ['STL'], 'https://www.printables.com/model/369592-gridfinity-3d-benchy-stand', 'Soporte para barco · Organización']
];

const repositories = [
  ['MakerWorld', 'makerworld.com'], ['Printables', 'printables.com'], ['Thingiverse', 'thingiverse.com'],
  ['Cults3D', 'cults3d.com'], ['MyMiniFactory', 'myminifactory.com'], ['Thangs', 'thangs.com'],
  ['Creality Cloud', 'crealitycloud.com'], ['Pinshape', 'pinshape.com'], ['Yeggi', 'yeggi.com'],
  ['STLFinder', 'stlfinder.com'], ['Shapekit', 'shapekit.cc']
];

const q = document.querySelector('#q');
const format = document.querySelector('#format');
const source = document.querySelector('#source');
const modelList = document.querySelector('#models');
const directory = document.querySelector('#directories');
const count = document.querySelector('#count');
const search = document.querySelector('#search');
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const synonyms = { maceta: 'planter', dragon: 'dragon', llavero: 'keychain', tortuga: 'turtle', ajedrez: 'chess', soporte: 'holder', gratis: 'gratis', free: 'gratis', paid: 'pago', m3f: '3mf' };

const translatedTerms = {"porta celular": "phone stand", "portacelular": "phone stand", "soporte para celular": "phone stand", "soporte celular": "phone stand", "soporte para telefono": "phone stand", "soporte de celular": "phone stand", "organizador de cajon": "drawer organizer", "repuesto": "replacement", "juguete": "toy", "juguetes": "toys", "decoracion": "decor", "florero": "vase", "figura": "figurine", "miniatura": "miniature", "articulado": "articulated", "soportes": "holders", "macetas": "planters", "llaveros": "keychains"};
function translate(term) {
  const normalized=normalize(term);
  return translatedTerms[normalized] ?? normalized.split(/\s+/).map(word=>synonyms[word] ?? translatedTerms[word] ?? word).join(" ");
}

for (const name of [...new Set(models.map(model => model[1]))].sort()) {
  source.add(new Option(name, name));
}

function externalSearch(domain, query, extension, price) {
  if (!query && !extension && !price) return 'https://' + domain;
  const priceTerms = { gratis: '(free OR gratis)', pago: '(paid OR purchase OR comprar)' };
  const terms = ['site:' + domain, query, extension, priceTerms[price]].filter(Boolean);
  return 'https://www.google.com/search?' + new URLSearchParams({ q: terms.join(' ') });
}

const liveStatus = document.querySelector('#live-status');
let liveResults = [];
let activeRequest;
let waiting = false;
let topMode = false;
let page = 1;
let pageStart = [1];
const queryParams=new URLSearchParams(location.search);
q.value=(queryParams.get("q") ?? "").slice(0,100);
let searchExhausted = false;
let hasNext = false;
const licenseFilter = document.querySelector('#license');
const favoritesOnly = document.querySelector('#favorites-only');
let favorites = [];
try { const saved=JSON.parse(localStorage.getItem('utilitools-favorites') || '[]'); if(Array.isArray(saved)) favorites=saved.filter(x=>x && typeof x.url==='string' && x.url.startsWith('https://') && Array.isArray(x.formats)); } catch {}
function saveFavorite(model) {
  const exists=favorites.some(x=>x.url===model.url);
  if(!exists) window.utilitoolsTrack?.("model_saved");
  favorites=exists?favorites.filter(x=>x.url!==model.url):[...favorites,model];
  try { localStorage.setItem('utilitools-favorites',JSON.stringify(favorites)); document.querySelector('#saved-status').textContent=exists?'Modelo quitado de favoritos.':'Modelo guardado en este navegador.'; }
  catch { document.querySelector('#saved-status').textContent='El navegador no permite guardar favoritos. Se conservarán durante esta sesión.'; }
  render();
}

const licenseBadges = { commercial: 'Uso comercial', personal: 'No comercial', unknown: 'Licencia a revisar' };

function card(model) {
  const article = document.createElement('article');
  article.className = 'card';
  const media = document.createElement('a');
  media.className = 'card-media open-model'; media.href = model.url; media.target = '_blank'; media.rel = 'noopener noreferrer';
  media.setAttribute('aria-label', 'Ver ' + model.title + ' en ' + model.repo);
  const placeholder = document.createElement('span');
  placeholder.className = 'card-placeholder'; placeholder.textContent = model.image ? 'Cargando vista previa…' : 'Sin vista previa · ver en la fuente ↗';
  media.append(placeholder);
  if (model.image) {
    const image = document.createElement('img');
    image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
    image.width = 640; image.height = 480;
    image.addEventListener('load', () => { image.classList.add('ready'); placeholder.hidden = true; });
    image.addEventListener('error', () => { image.remove(); placeholder.textContent = 'Sin vista previa · ver en la fuente ↗'; });
    let previewUrl = model.image;
    if (previewUrl.startsWith('https://media.printables.com/') && !previewUrl.includes('/thumbs/')) {
      previewUrl = previewUrl.replace(/\/([^/]+)\.(jpg|jpeg|png|webp)$/i, (_, name, ext) => '/thumbs/inside/640x480/' + ext.toLowerCase() + '/' + name + '.webp');
    }
    image.src = previewUrl;
    media.append(image);
  }
  const selected = favorites.some(x => x.url === model.url);
  const favorite = document.createElement('button');
  favorite.type = 'button'; favorite.className = 'fav' + (selected ? ' on' : '');
  favorite.textContent = selected ? '♥' : '♡';
  favorite.setAttribute('aria-pressed', String(selected));
  favorite.setAttribute('aria-label', (selected ? 'Quitar de favoritos ' : 'Guardar en favoritos ') + model.title);
  favorite.title = selected ? 'Quitar de favoritos' : 'Guardar en favoritos';
  favorite.addEventListener('click', () => saveFavorite(model));

  const details = document.createElement('div');
  details.className = 'details';
  const top = document.createElement('div'); top.className = 'card-top';
  const repo = document.createElement('span'); repo.textContent = model.repo;
  const badge = document.createElement('span'); badge.className = 'price ' + model.type; badge.textContent = model.type === 'gratis' ? 'GRATIS' : 'PAGO';
  top.append(repo, badge);
  const title = document.createElement('h3'); title.textContent = model.title;
  details.append(top, title);
  if (model.keywords) { const p = document.createElement('p'); p.textContent = model.keywords; details.append(p); }
  if (topMode === 'paid' && model.keywords) {
    const reason = document.createElement('p');
    reason.textContent = 'Elegido como ejemplo de ' + (model.title.includes('Maceta') ? 'decoración para el hogar' : 'juguete con mecanismo clicker') + '.';
    details.append(reason);
  }
  const meta = document.createElement('div'); meta.className = 'card-meta';
  if (Number.isFinite(model.downloads)) { const d = document.createElement('span'); d.className = 'downloads'; d.textContent = new Intl.NumberFormat('es-AR').format(model.downloads) + ' descargas'; meta.append(d); }
  const status = model.licenseStatus ?? 'unknown';
  const lic = document.createElement('span'); lic.className = 'lic ' + status; lic.textContent = licenseBadges[status] ?? licenseBadges.unknown;
  if (model.licenseName) lic.title = model.licenseName;
  meta.append(lic);
  const formats = document.createElement('div'); formats.className = 'formats';
  for (const format of model.formats) { const f = document.createElement('span'); f.textContent = format; formats.append(f); }
  if (model.formats.length) meta.append(formats);
  details.append(meta);
  if (model.note) { const note = document.createElement('p'); note.className = 'model-note'; note.textContent = 'Nota: ' + model.note; details.append(note); }

  const bottom = document.createElement('div'); bottom.className = 'card-bottom';
  const open = document.createElement('a');
  open.className = 'open-model'; open.href = model.url; open.target = '_blank'; open.rel = 'noopener noreferrer';
  open.textContent = 'Ver ficha ↗'; open.setAttribute('aria-label', 'Ver ' + model.title + ' en ' + model.repo);
  const menu = document.createElement('details'); menu.className = 'more-menu';
  const summary = document.createElement('summary'); summary.textContent = '⋯'; summary.setAttribute('aria-label', 'Más acciones para ' + model.title); summary.title = 'Más acciones';
  const actions = document.createElement('div'); actions.className = 'model-actions';
  const calculator = document.createElement('a');
  calculator.href = 'https://calculadora.utilitools.com.ar/?' + new URLSearchParams({ modelo: model.title, ficha: model.url }) + '#costos';
  calculator.textContent = 'Calcular costo';
  const collect = document.createElement('button'); collect.type = 'button'; collect.textContent = 'Guardar en colección';
  collect.addEventListener('click', () => { menu.open = false; openCollectionEditor(model); });
  actions.append(calculator, collect);
  const collection = activeCollection();
  if (collection && !sharedView && favoritesOnly.checked) {
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Quitar de la colección';
    remove.addEventListener('click', () => {
      collection.entries = collection.entries.filter(entry => entry.url !== model.url);
      saveCollections(); render();
    });
    actions.append(remove);
  }
  if (model.licenseName) { const ln = document.createElement('p'); ln.className = 'license'; ln.textContent = 'Licencia: ' + model.licenseName; actions.append(ln); }
  menu.append(summary, actions);
  bottom.append(open, menu);
  details.append(bottom);
  article.append(media, favorite, details);
  return article;
}

// Cierra los menús "⋯" abiertos al tocar fuera de ellos.
document.addEventListener('click', event => {
  for (const open of document.querySelectorAll('.more-menu[open]')) if (!open.contains(event.target)) open.open = false;
});

const catalog = models.map(([title, repo, type, formats, url, keywords], index) => ({
  title, repo, type, formats, url, keywords, image: '/api/thumbnail/' + index
}));

function render() {
  const price = document.querySelector('input[name=p]:checked').value;
  const words = normalize(q.value).split(/\s+/).filter(Boolean);
  const matches = topMode === true || page > 1 ? [] : catalog.filter(model => {
    const field = normalize([model.title, model.repo, model.type, model.formats.join(' '), model.keywords].join(' '));
    return words.every(word => field.includes(word) || (synonyms[word] && field.includes(synonyms[word])));
  });
  const modelKey = model => model.repo === 'Printables' ? model.url.match(/printables\.com\/model\/(\d+)/)?.[1] : new URL(model.url).pathname.split('/').at(-1);
  const ids = new Set(liveResults.map(modelKey));
  const unique = matches.filter(model => !ids.has(modelKey(model)));
  const candidates = favoritesOnly.checked ? (activeCollection()?.entries ?? favorites) : [...liveResults, ...unique];
  const filtered = candidates.filter(model =>
    (!licenseFilter.value || (model.licenseStatus ?? "unknown") === licenseFilter.value) &&
    (!price || model.type === price) && (!format.value || model.formats.includes(format.value)) &&
    (!source.value || model.repo === source.value));
  if(favoritesOnly.checked) page=Math.min(page,Math.max(1,Math.ceil(filtered.length/24)));
  const displayed=favoritesOnly.checked?filtered.slice((page-1)*24,page*24):filtered;
  modelList.replaceChildren(...displayed.map(card));
  document.querySelector('#previous').disabled=page===1 || waiting;
  document.querySelector('#next').disabled=waiting || (favoritesOnly.checked ? page*24>=filtered.length : !hasNext);
  document.querySelector('#page-status').textContent='Página '+page;


  directory.replaceChildren(...repositories.map(([name, domain]) => {
    const anchor = document.createElement('a');
    anchor.href = externalSearch(domain, q.value.trim(), format.value, price);
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = name;
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    anchor.append(arrow);
    return anchor;
  }));

  count.textContent = filtered.length + (filtered.length === 1 ? ' modelo' : ' modelos');
  document.querySelector('#empty').hidden = waiting || Boolean(filtered.length);
}

async function searchLive() {
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  const term = q.value.trim();
  if(favoritesOnly.checked){waiting=false;liveStatus.hidden=true;render();return;}
  liveResults = [];
  hasNext=false;
  searchExhausted=false;
  waiting = false;
  liveStatus.hidden = true;
  const price = document.querySelector('input[name=p]:checked').value;
  if (topMode==='paid' || price==='pago' || (source.value && source.value!=='Printables') || (!term && !topMode && !format.value && !licenseFilter.value && !source.value && !price)) {
    render();
    return;
  }
  waiting = true;
  liveStatus.textContent = 'Buscando modelos…';
  liveStatus.hidden = false;
  render();

  try {
    const limit = format.value || licenseFilter.value ? 4 : 1;
    const start = pageStart[page-1] ?? 1;
    for(let offset=start; offset<start+limit; offset++) {
      const params=new URLSearchParams({
        q:translate(term), price, source:source.value,
        top:topMode===true || !term ? '1' : '', page:String(offset),
        format:format.value, license:licenseFilter.value
      });
      const response=await fetch('/api/search?'+params,{signal:controller.signal});
      if(!response.ok) throw new Error('Search unavailable');
      const payload=await response.json();
      if(activeRequest!==controller) return;
      if(payload.unavailable.length) throw new Error('Source unavailable');
      liveResults=payload.models;
      hasNext=Boolean(payload.hasNext);
      pageStart[page]=offset+1;
      if(liveResults.length || !hasNext) break;
    }
    searchExhausted=!hasNext && !liveResults.length;
    window.utilitoolsTrack?.('search_completed',{result:liveResults.length?'found':hasNext?'more':'empty'});
    liveStatus.hidden=Boolean(liveResults.length) || !hasNext;
    if(!liveStatus.hidden) liveStatus.textContent='Todavía quedan resultados por revisar. Usá Siguiente para continuar con estos filtros.';
  } catch {
    if (activeRequest !== controller) return;
    window.utilitoolsTrack?.('search_completed',{result:'error'});
    liveStatus.textContent = 'La búsqueda en línea no respondió. Se muestran las coincidencias del catálogo.';
  } finally {
    if (activeRequest === controller) {
      waiting = false;
      render();
    }
  }
}

let debounce;
function runSearch(resetPage=true) {
  if(resetPage) {page=1;pageStart=[1];}
  clearTimeout(debounce);
  searchLive();
}
search.addEventListener('submit', event => {
  event.preventDefault();
  runSearch();
  document.querySelector('#catalogo').scrollIntoView();
});
q.addEventListener('input', () => {
  clearTimeout(debounce);
  activeRequest?.abort();
  activeRequest = null;
  liveResults = [];
  waiting = Boolean(q.value.trim());
  liveStatus.hidden = true;
  render();
  topMode=false;page=1;pageStart=[1];searchExhausted=false;
  debounce = setTimeout(searchLive, 700);
});
document.querySelector('.filters').addEventListener('change', event=>{
  if (['format','license','source'].includes(event.target.id) || event.target.name==='p') {
    window.utilitoolsTrack?.('filter_changed',{format:format.value||'all',license:licenseFilter.value||'all',
      price:document.querySelector('input[name=p]:checked').value||'all'});
  }
  runSearch();
});
document.querySelector('#reset').addEventListener('click', () => {
  topMode=false;
  search.reset();
  source.value = format.value = licenseFilter.value = '';
  favoritesOnly.checked=false;
  sharedView=false; updateCollections('');
  document.querySelector('input[name=p]').checked = true;
  runSearch();
});
document.querySelectorAll('[data-query]').forEach(button => {
  button.addEventListener('click', () => {
    topMode=false; favoritesOnly.checked=false;
    source.value=format.value=licenseFilter.value='';
    document.querySelector('input[name=p]').checked=true;
    q.value = button.dataset.query;
    search.requestSubmit();
  });
});
const collectionKey = 'utilitools-collections-v1';
const collectionSelect = document.querySelector('#collection');
const collections = readCollections(localStorageValue(collectionKey));
const shared = readCollections(new URLSearchParams(location.hash.slice(1)).get('coleccion'))[0];
let sharedView = Boolean(shared);
if (shared) favoritesOnly.checked = true;

function localStorageValue(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function readCollections(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0,30).filter(item => item && typeof item.name === 'string' && Array.isArray(item.entries)).map(item => ({
      name: item.name.slice(0,60),
      entries: item.entries.slice(0,50).filter(entry => entry && typeof entry.title === 'string' &&
        typeof entry.url === 'string' && /^https:\/\/(?:www\.printables\.com|cults3d\.com|www\.thingiverse\.com|shapekit\.cc)\//.test(entry.url)).map(entry => ({
        title:entry.title.slice(0,200), url:entry.url, repo:String(entry.repo ?? '').slice(0,50),
        type:entry.type === 'pago' ? 'pago' : 'gratis',
        formats:Array.isArray(entry.formats) ? entry.formats.filter(f=>['STL','3MF','OBJ','STEP'].includes(f)) : [],
        image:typeof entry.image === 'string' && /^(https:\/\/(media\.printables\.com|images\.cults3d\.com)\/|\/api\/thumbnail\/\d+$)/.test(entry.image) ? entry.image : '',
        licenseStatus:['personal','commercial'].includes(entry.licenseStatus) ? entry.licenseStatus : 'unknown',
        licenseName:String(entry.licenseName ?? '').slice(0,150),
        note:String(entry.note ?? '').slice(0,300)
      }))
    }));
  } catch { return []; }
}

function saveCollections() {
  try { localStorage.setItem(collectionKey,JSON.stringify(collections)); return true; }
  catch { document.querySelector('#collection-status').textContent='El navegador solo permite conservar esta colección durante la sesión.'; return false; }
}

function updateCollections(value=collectionSelect.value) {
  collectionSelect.replaceChildren(new Option('Todos los favoritos',''));
  collections.forEach((collection,index)=>collectionSelect.add(new Option(collection.name,String(index))));
  if(sharedView) collectionSelect.add(new Option(shared.name,'shared'));
  collectionSelect.value = sharedView ? 'shared' : value === 'shared' ? '' : value;
  document.querySelector('#share-collection').disabled = !activeCollection();
  document.querySelector('#delete-collection').disabled = !activeCollection() || sharedView;
}

function activeCollection() {
  if(sharedView && collectionSelect.value==='shared') return shared;
  return collectionSelect.value === '' ? null : collections[Number(collectionSelect.value)];
}

function openCollectionEditor(model) {
  const dialog=document.querySelector('#collection-editor');
  const select=dialog.querySelector('select');
  select.replaceChildren(new Option('Crear una colección',''));
  collections.forEach((collection,index)=>select.add(new Option(collection.name,String(index))));
  const current=collections.indexOf(activeCollection());
  if(current>=0) select.value=String(current);
  const name=dialog.querySelector('[name=name]');
  const note=dialog.querySelector('[name=note]');
  const sync=()=>{
    name.required=select.value==='';
    name.parentElement.hidden=!name.required;
    note.value=collections[Number(select.value)]?.entries.find(entry=>entry.url===model.url)?.note ?? '';
    if(!select.value) note.value='';
  };
  name.value=''; sync(); select.onchange=sync;
  dialog.querySelector('form').onsubmit=event=>{
    event.preventDefault();
    if(event.submitter?.value==='cancel') {dialog.close();return;}
    const label=name.value.trim();
    let index=select.value === '' ? collections.findIndex(item=>item.name.toLowerCase()===label.toLowerCase()) : Number(select.value);
    if(index<0) {
      if(!label || collections.length>=30) {dialog.querySelector('output').textContent='Ingresá un nombre válido. Podés tener hasta 30 colecciones.';return;}
      index=collections.push({name:label,entries:[]})-1;
      window.utilitoolsTrack?.('collection_created');
    }
    const entries=collections[index].entries;
    const position=entries.findIndex(entry=>entry.url===model.url);
    if(position<0 && entries.length>=50) {dialog.querySelector('output').textContent='La colección admite hasta 50 modelos.';return;}
    const entry={...model,note:note.value.trim()};
    if(position<0) {entries.push(entry);window.utilitoolsTrack?.('collection_model_saved');} else entries[position]=entry;
    if(saveCollections()) document.querySelector('#collection-status').textContent='Modelo guardado en '+collections[index].name+'.';
    dialog.close(); updateCollections(); render();
  };
  dialog.querySelector('output').textContent='';
  dialog.showModal();
}

updateCollections();
collectionSelect.addEventListener('change',()=>{
  if(collectionSelect.value!=='shared') sharedView=false;
  favoritesOnly.checked=true; updateCollections(); runSearch();
});
document.querySelector('#share-collection').addEventListener('click',()=>{
  const collection=activeCollection();
  if(!collection) return;
  const url=new URL('/',location.origin);
  url.hash=new URLSearchParams({coleccion:JSON.stringify([collection])}).toString();
  const dialog=document.querySelector('#collection-share');
  dialog.querySelector('textarea').value=url.href;
  dialog.querySelector('output').textContent='';
  dialog.showModal();
});
document.querySelector('#copy-collection').addEventListener('click',async()=>{
  const dialog=document.querySelector('#collection-share');
  const field=dialog.querySelector('textarea');
  try {await navigator.clipboard.writeText(field.value);window.utilitoolsTrack?.('collection_link_copied');dialog.querySelector('output').textContent='Enlace copiado.';}
  catch {field.select();dialog.querySelector('output').textContent='Copiá el enlace seleccionado.';}
});
document.querySelector('#delete-collection').addEventListener('click',()=>{
  const index=collections.indexOf(activeCollection());
  if(index<0 || !confirm('¿Eliminar la colección «'+collections[index].name+'»?')) return;
  collections.splice(index,1); saveCollections(); updateCollections(''); runSearch();
});

if(q.value && !sharedView) runSearch(); else render();
if(sharedView) document.querySelector('#catalogo').scrollIntoView();

document.querySelector('#top-paid').addEventListener('click',()=>{
  topMode='paid';q.value='';source.value='';format.value=licenseFilter.value='';
  favoritesOnly.checked=false;
  document.querySelector('input[name=p][value=pago]').checked=true;
  runSearch(); liveStatus.hidden=false;
  liveStatus.textContent='Selección editorial de UtiliTools. El ranking de ventas está en Cults3D.';
  document.querySelector('#catalogo').scrollIntoView();
});

document.querySelector('#top-free').addEventListener('click',()=>{topMode=true;favoritesOnly.checked=false;licenseFilter.value="";q.value='';source.value='Printables';format.value='';document.querySelector('input[name=p][value=gratis]').checked=true;runSearch();document.querySelector('#catalogo').scrollIntoView();});

document.querySelector('#previous').addEventListener('click',()=>{if(page>1){page--;runSearch(false);}});
document.querySelector('#next').addEventListener('click',()=>{page++;runSearch(false);});
