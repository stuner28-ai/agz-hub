import { load } from 'cheerio';
import { createHash } from 'node:crypto';
const assets = __ASSETS__;
// Cambia con cada versión del sitio: se agrega a las URLs de CSS/JS para poder cachearlos mucho tiempo.
const assetVersion = createHash('sha1').update(JSON.stringify(assets)).digest('hex').slice(0, 10);
const binaryTypes = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', ico: 'image/x-icon' };
const binaryCache = new Map();
const cachePolicy = {
  html: 'public, max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=86400',
  versioned: 'public, max-age=31536000, immutable',
  static: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
};
const printablesEndpoint = 'https://api.printables.com/graphql/';
const query = `query Models($q: String!, $ordering: SearchChoicesEnum, $offset: Int) {
  searchPrints2(query: $q, printType: print, limit: 48, offset: $offset, ordering: $ordering) {
    items { id name slug downloadCount license { name } filesType images { filePath } stls { name } }
  }
}`;

function imageUrl(path) {
  if (!path) return '';
  const url = new URL(path, 'https://media.printables.com/');
  if (url.origin !== 'https://media.printables.com') return '';
  if (url.pathname.includes('/thumbs/')) return url.href;
  const match = url.pathname.match(/^(.*)\/([^/]+)\.(jpg|jpeg|png|webp)$/i);
  if (!match) return url.href;
  url.pathname = match[1] + '/thumbs/inside/640x480/' + match[3].toLowerCase() + '/' + match[2] + '.webp';
  return url.href;
}

let printablesRetryAt = 0;

async function searchPrintables(term, top = false, page = 1) {
  if (Date.now() < printablesRetryAt) throw new Error('Rate limited');
  const response = await fetch(printablesEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ query, variables: { q: term, ordering: top ? "popular" : "best_match", offset: (page - 1) * 48 } }),
    signal: AbortSignal.timeout(8500)
  });
  if (response.status === 429) printablesRetryAt = Date.now() + 300_000;
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const payload = await response.json();
  const items = payload.data?.searchPrints2?.items;
  if (!Array.isArray(items)) throw new Error(payload.errors?.[0]?.message ?? 'Missing items');
  return items.filter(item => item.id && item.name).map(item => {
    const formats = new Set((item.stls ?? []).map(file => file.name?.split('.').at(-1).toUpperCase())
      .filter(ext => ['STL', '3MF', 'OBJ', 'STEP'].includes(ext)));
    if (item.filesType === 'STL' && !formats.size) formats.add('STL');
    if (item.filesType === 'STEP') formats.add('STEP');
    return {
      title: item.name, repo: 'Printables', type: 'gratis', downloads: item.downloadCount, licenseName: item.license?.name ?? '', licenseStatus: classifyLicense(item.license?.name),
      url: 'https://www.printables.com/model/' + encodeURIComponent(item.id + (item.slug ? '-' + item.slug : '')),
      image: imageUrl(item.images?.find(image => image.filePath)?.filePath),
      formats: [...formats]
    };
  });
}

function classifyLicense(name) {
  const value=(name ?? '').toLowerCase();
  if (/non.?commercial|\bby-nc\b|private use|personal use/.test(value)) return 'personal';
  if (/public domain|\bcc0\b|commercial use|gnu|gpl/.test(value)) return 'commercial';
  if (/creative commons/.test(value) && /attribution/.test(value)) return 'commercial';
  return 'unknown';
}

const catalogUrls = [...assets['/app.js'].matchAll(/'(https:\/\/[^'\s]+)', '[^'\n]+'\]/g)].map(match => match[1]);

const thumbnailCache = new Map();
async function catalogThumbnail(index) {
  const url = catalogUrls[index];
  if (!url) return new Response(null, { status: 404 });
  const cached = thumbnailCache.get(index);
  if (cached && cached.expires > Date.now()) return Response.redirect(cached.url,302);
  try {
    const printId = url.match(/printables\.com\/model\/(\d+)/)?.[1];
    if (printId) {
      const response = await fetch(printablesEndpoint, {
        method:'POST', headers:{'content-type':'application/json'},
        body:JSON.stringify({query:'query Preview($id: ID!) { print(id: $id) { images { filePath } } }',variables:{id:printId}}),
        signal:AbortSignal.timeout(7000)
      });
      const payload = await response.json();
      const image = imageUrl(payload.data?.print?.images?.[0]?.filePath);
      if (image) {
        thumbnailCache.set(index,{url:image,expires:Date.now()+3600000});
        return new Response(null,{status:302,headers:{location:image,'cache-control':'public, max-age=3600'}});
      }
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) return new Response(null, { status: 404 });
    let image = '';
    const handler = { element(element) { image ||= element.getAttribute('content') ?? ''; } };
    await new HTMLRewriter().on('meta[property="og:image"]', handler)
      .on('meta[name="twitter:image"]', handler).transform(response).text();
    if (!image) return new Response(null, { status: 404 });
    const resolved = new URL(image, response.url || url);
    if (resolved.protocol === 'https:') {
      return new Response(null, { status: 302, headers: { location: resolved.href, 'cache-control': 'private, max-age=86400' } });
    }
  } catch (error) {
    console.warn('Catalog image unavailable', index, error.message);
  }
  return new Response(null, { status: 404 });
}

const analyticsEvents = {
  page_view: [['channel',['search','social','referral','direct','internal']],
    ['category',['juguetes','diy-taller','decoracion','organizacion','macetas','miniaturas','repuestos','cosplay','llaveros']]],
  model_opened:[], calculator_opened:[],
  search_completed:[['result',['found','empty','more','error']]],
  filter_changed:[['format',['STL','3MF','OBJ','STEP','all']],['price',['gratis','pago','all']],
    ['license',['commercial','personal','unknown','all']]],
  model_saved:[], collection_created:[], collection_model_saved:[], collection_link_copied:[],
  slicer_import:[['result',['complete','partial','error']],['slicer',['bambu','orca','creality','unknown']],['format',['gcode','3mf']]],
  quote_exported:[['method',['clipboard','text_file']]]
};
const analyticsHost = process.env.UTILITOOLS_POSTHOG_HOST;
const analyticsToken = process.env.UTILITOOLS_POSTHOG_TOKEN;
const analyticsEnabled = Boolean(analyticsToken && /^https:\/\/(us|eu)\.i\.posthog\.com$/.test(analyticsHost ?? ''));

async function analyticsCapture(request,url) {
  if (!analyticsEnabled) return new Response(null,{status:503});
  if (!['www.utilitools.com.ar','utilitools.com.ar','calculadora.utilitools.com.ar',
    'guias.utilitools.com.ar','perfiles.utilitools.com.ar'].includes(url.hostname) ||
    request.headers.get('origin') !== url.origin) return new Response(null,{status:403});
  let event;
  try {event=await request.json();} catch {return new Response(null,{status:400});}
  if (!event || !Object.hasOwn(analyticsEvents,event.event) ||
    typeof event.id!=='string' || !/^[a-f0-9-]{36}$/.test(event.id) ||
    !['home','calculadora','guias','perfiles','category','guide','other'].includes(event.page)) {
    return new Response(null,{status:400});
  }
  const properties={page:event.page,$process_person_profile:false,$geoip_disable:true};
  for(const [name,values] of analyticsEvents[event.event]) {
    if(values.includes(event[name])) properties[name]=event[name];
  }
  try {
    const response=await fetch(analyticsHost+'/capture/',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({api_key:analyticsToken,event:'utilitools_'+event.event,
        distinct_id:event.id,properties}),signal:AbortSignal.timeout(4000)
    });
    return new Response(null,{status:response.ok?204:502});
  } catch {return new Response(null,{status:502});}
}

const site = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/medicion' && request.method === 'POST') return analyticsCapture(request,url);
    if (request.method !== 'GET') return new Response(null, { status: 405 });
    if (url.pathname === '/api/search') {
      const term = url.searchParams.get('q')?.trim() ?? '';
      if ((!term && url.searchParams.get('top') !== '1') || term.length > 100) return Response.json({ error: 'Consulta inválida' }, { status: 400 });
      const page = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1',10) || 1));
      const repo = url.searchParams.get('source');
      const price = url.searchParams.get('price');
      const sources = [];
      if ((!repo || repo === 'Printables') && price !== 'pago') sources.push(['Printables', searchPrintables(term, url.searchParams.get('top') === '1', page)]);
      const outcomes = await Promise.allSettled(sources.map(([, result]) => result));
      const models = [];
      const unavailable = [];
      outcomes.forEach((result, index) => {
        if (result.status === 'fulfilled') models.push(...result.value);
        else {
          unavailable.push(sources[index][0]);
          console.warn(sources[index][0] + ' search unavailable', result.reason.message);
        }
      });
      if (url.searchParams.get('top') === '1') models.sort((a,b)=>(b.downloads??0)-(a.downloads??0));
      const format = url.searchParams.get('format');
      const license = url.searchParams.get('license');
      const filtered = models.filter(model=>
        (!format || model.formats.includes(format)) &&
        (!license || model.licenseStatus === license));
      return Response.json({ models:filtered, unavailable, hasNext:page<100 && models.length===48 }, {
        headers:{'cache-control':'private, max-age=120'}
      });
    }
    const thumb = url.pathname.match(/^\/api\/thumbnail\/(\d{1,2})$/);
    if (thumb) return catalogThumbnail(Number(thumb[1]));
    return serveSite(url);
  }
};

const domain = 'utilitools.com.ar';
const sections = {
  calculadora: ['Calculadora de impresión 3D en ARS', 'costos'],
  perfiles: ['Perfiles y filamentos para impresión 3D', 'perfiles'],
  guias: ['Guías de impresión 3D', 'tecnicas']
};

function sectionHost(hostname) {
  return Object.keys(sections).find(section => hostname === section + '.' + domain);
}

function serveSite(url) {
  const hostSection = sectionHost(url.hostname);
  const crawler = crawlFile(url, hostSection);
  if (crawler) return crawler;
  const searchHome = hostSection ? 'https://www.' + domain + '/' : '/';
  const path = url.pathname;
  if (/^\/categorias\/[a-z-]+$/.test(path) && Object.hasOwn(categoryDetails,path+'/')) return Response.redirect(web+path+'/',308);
  const route = path.match(/^\/(calculadora|perfiles|guias)\/?$/)?.[1];
  let name = path;
  let section;

  if (route || (hostSection && path === '/')) {
    section = route ?? hostSection;
    name = '/herramientas/index.html';
  } else if (path === '/herramientas' || path === '/herramientas/') {
    name = '/herramientas/index.html';
  } else if (path.startsWith('/guias/')) {
    name = '/herramientas' + path;
  } else if (path === '/' || path === '/index.html') {
    name = '/index.html';
  }

  let status = 200;
  if (!Object.hasOwn(assets, name)) {
    name = '/404.html';
    section = undefined;
    status = 404;
  }
  const extension = name.endsWith('/') ? 'html' : name.split('.').at(-1);
  const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8',
    js: 'text/javascript; charset=utf-8', svg: 'image/svg+xml', ...binaryTypes };
  let body = assets[name];
  if (Object.hasOwn(binaryTypes, extension)) {
    if (!binaryCache.has(name)) binaryCache.set(name, Buffer.from(body, 'base64'));
    body = binaryCache.get(name);
  } else if (extension === 'html') {
    body = body.replaceAll('__SEARCH_HOME__', searchHome);
    if (section) {
      const [title, anchor] = sections[section];
      body = body.replace(/<title>[^<]*<\/title>/, '<title>' + title + ' | UtiliTools 3D</title>')
        .replace('<body id="inicio">', '<body id="inicio" data-tool="' + section + '">')
        .replace('href="#perfiles">Ir al buscador de perfiles', 'href="#' + anchor + '">Ir a la herramienta')
        .replace(/(<section class="hero">[\s\S]*?)<h1>([\s\S]*?)<\/h1>/, '$1<p class="hero-title">$2</p>');
      const sectionHeading = new RegExp('(id="' + anchor + '"[^>]*>[\\s\\S]*?)<h2([^>]*)>(.*?)</h2>');
      body = body.replace(sectionHeading, '$1<h1$2>$3</h1>');
    }
    if (hostSection || url.hostname === 'www.' + domain) {
      for (const section of Object.keys(sections)) {
        body = body.replaceAll('href="/' + section + '/', 'href="https://' + section + '.' + domain + '/');
      }
    }
  }
  if (extension === 'html') {
    body = seoHtml(body, name, section);
    body = body.replace(/\b(href|src)="((?:\/|\.\.\/)[^"?#:]+\.(?:css|js))"/g, '$1="$2?v=' + assetVersion + '"');
    if(analyticsEnabled) body=body.replace('</body>',
      '<div style="max-width:1100px;margin:1rem auto;padding:0 1rem;font-size:.9rem"><label><input id="analytics-consent" type="checkbox"> Permitir estadísticas de uso</label> · <a href="https://www.utilitools.com.ar/privacidad/">Privacidad</a></div><script src="/utilitools-analytics.js" defer></script></body>');
  }
  const cacheControl = status !== 200 ? 'public, max-age=0, s-maxage=300'
    : extension === 'html' ? cachePolicy.html
    : url.searchParams.get('v') === assetVersion ? cachePolicy.versioned
    : cachePolicy.static;
  return new Response(body, {
    status,
    headers: { 'content-type': types[extension], 'cache-control': cacheControl }
  });
}


const web = 'https://www.utilitools.com.ar';
const guides = {
  'calibrar-filamento.html': ['Cómo calibrar el filamento para impresión 3D', 'Calibrá una bobina con pruebas de temperatura, flujo y tolerancia antes de imprimir una tanda.'],
  'costos-de-impresion.html': ['Cómo calcular el costo de una impresión 3D', 'Calculá material, electricidad, desgaste, mano de obra y margen para cotizar impresiones en pesos argentinos.'],
  'fidgets-y-holguras.html': ['Holguras para fidgets y encastres impresos en 3D', 'Ajustá la separación de bisagras y piezas móviles con pruebas de encastre antes de imprimir un lote.']
};
const categoryDetails = {"/categorias/juguetes/": ["Juguetes para imprimir en 3D", "Para juguetes articulados, revisá que las uniones se impriman separadas y evitá agregar soportes dentro de bisagras."], "/categorias/diy-taller/": ["DIY y taller para imprimir en 3D", "Medí el mango de la herramienta y la distancia entre los anclajes antes de elegir un soporte."], "/categorias/decoracion/": ["Decoración para imprimir en 3D", "Para un florero decorativo o una pantalla, decidí desde el principio si necesitás paredes completas, un fondo cerrado y soporte."], "/categorias/organizacion/": ["Organización para imprimir en 3D", "Gridfinity usa una cuadrícula nominal de 42 × 42 mm. Una caja de 2 × 1 ocupa dos módulos de largo y uno de ancho."], "/categorias/macetas/": ["Macetas para imprimir en 3D", "Elegí el diámetro útil según el cepellón y revisá si el modelo tiene drenaje o depósito integrado."], "/categorias/miniaturas/": ["Miniaturas para imprimir en 3D", "Compará la altura de la figura y el diámetro de su base con las miniaturas que ya tenés."], "/categorias/repuestos/": ["Repuestos para imprimir en 3D", "Buscá por la marca y el modelo del objeto. Medí ejes, agujeros y trabas con un calibre."], "/categorias/cosplay/": ["Cosplay para imprimir en 3D", "Tomá medidas sobre la ropa que vas a usar y comparalas con las dimensiones internas del archivo."], "/categorias/llaveros/": ["Llaveros para imprimir en 3D", "Revisá que el agujero admita tu argolla y que el borde tenga suficiente material alrededor."]};
const details = {
  calculadora: ['Calculadora de costos de impresión 3D en ARS', 'Calculá el costo de PLA, PETG y otros materiales, electricidad y mano de obra. Estimá un precio por pieza o por lote en pesos argentinos.'],
  perfiles: ['Perfiles y filamentos para impresoras 3D', 'Consultá perfiles iniciales y filtrá por impresora, filamento y tipo de pieza. Compará parámetros para PLA, PETG y otros materiales.'],
  guias: ['Guías de impresión 3D', 'Calibración de filamento, holguras, encastres y costos de impresión. Consultá guías prácticas para impresión FDM.']
};

function seoHtml(body, name, section) {
  const guide = name.startsWith('/herramientas/guias/') && name.split('/').at(-1);
  let url = web + '/';
  let title = 'Buscador de archivos STL y 3MF para imprimir';
  let description = 'Encontrá modelos 3D gratis y pagos, filtrá por formato y repositorio, y consultá guías y una calculadora de impresión en pesos argentinos.';
  let noindex = false;
  if (section) {
    [title, description] = details[section];
    url = 'https://' + section + '.utilitools.com.ar/';
  } else if (guide && Object.hasOwn(guides, guide)) {
    [title, description] = guides[guide];
    url = 'https://guias.utilitools.com.ar/guias/' + guide;
  } else if (Object.hasOwn(categoryDetails, name)) {
    [title, description] = categoryDetails[name];
    url = web + name;
  } else if (name === '/privacidad/' || name === '/acerca/') {
    const privacy = name === '/privacidad/';
    title = privacy ? 'Privacidad' : 'Acerca del portal maker';
    description = privacy ? 'Cómo UtiliTools procesa las búsquedas, los archivos de perfiles y los datos técnicos del sitio.' : 'Conocé cómo funcionan el buscador, la calculadora y las guías gratuitas de UtiliTools.';
    url = web + name;
  } else if (name === '/404.html') {
    title = 'Página no encontrada';
    description = 'La página que buscás no existe. Buscá modelos 3D o elegí una categoría.';
    noindex = true;
  } else if (name !== '/index.html') {
    title = 'Herramientas de impresión 3D';
    description = 'Perfiles, filamentos, guías y calculadora de impresión 3D.';
    url = web + '/herramientas/';
    noindex = true;
  }
  const pageTitle = title + ' | UtiliTools';
  const logo = web + '/herramientas/assets/portada-1120.jpg';
  const structured = name === '/index.html' ? '<script type="application/ld+json">' +
    JSON.stringify({ '@context':'https://schema.org','@type':'WebSite',name:'UtiliTools',url:web+'/' }) + '</script>' : '';
  const metadata = '<meta name="description" content="' + description + '"><link rel="canonical" href="' + url + '">' +
    '<meta name="robots" content="' + (noindex ? 'noindex,follow' : 'index,follow') + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="UtiliTools">' +
    '<meta property="og:title" content="' + pageTitle + '"><meta property="og:description" content="' + description + '">' +
    '<meta property="og:url" content="' + url + '"><meta property="og:image" content="' + logo + '">' +
    '<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1120"><meta property="og:image:height" content="840">' +
    '<meta property="og:locale" content="es_AR">' +
    '<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">' +
    (/name=["']theme-color["']/.test(body) ? '' : '<meta name="theme-color" content="#101419">') +
    '<meta name="twitter:card" content="summary_large_image">' + structured;
  body = body.replace(/<title>[^<]*<\/title>/i, '<title>' + pageTitle + '</title>')
    .replace(/<meta\b[^>]*\bname=["']description["'][^>]*>/ig, '')
  if (body.includes('</head>')) return body.replace('</head>', metadata + '</head>');
  return body.replace(/(<html[^>]*>)/i, '$1<head>').replace(/<body\b/i, metadata + '</head><body');
}

function crawlFile(url, section) {
  const origin = section ? 'https://' + url.hostname : web;
  const headers = { 'cache-control': 'public, max-age=300' };
  if (url.pathname === '/ads.txt' && !section) {
    return new Response('google.com, pub-2453279126589038, DIRECT, f08c47fec0942fa0\n', {
      headers: { ...headers, 'content-type': 'text/plain; charset=utf-8' }
    });
  }
  if (url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ' + origin + '/sitemap.xml\n', {
      headers: { ...headers, 'content-type':'text/plain; charset=utf-8' }
    });
  }
  if (url.pathname !== '/sitemap.xml') return null;
  const paths = section === 'guias' ? ['/', ...Object.keys(guides).map(name => '/guias/' + name)] :
    section ? ['/'] : ['/', '/acerca/', '/privacidad/', ...Object.keys(categoryDetails)];
  const content = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths.map(path => '<url><loc>' + origin + path + '</loc></url>').join('') + '</urlset>';
  return new Response(content, { headers: { ...headers, 'content-type':'application/xml; charset=utf-8' } });
}

class HTMLRewriter {
  handlers = [];
  on(selector, handlers) { this.handlers.push([selector, handlers]); return this; }
  transform(response) {
    return { text: async () => {
      const $ = load(await response.text());
      const walk = node => {
        const end = [];
        if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
          for (const [selector, handlers] of this.handlers) {
            if (handlers.element && $(node).is(selector)) handlers.element({
              getAttribute: name => $(node).attr(name),
              onEndTag: callback => end.push(callback)
            });
          }
        }
        if (node.type === 'text') {
          for (const [selector, handlers] of this.handlers) {
            if (handlers.text && $(node.parent).closest(selector).length) {
              handlers.text({ text: node.data });
            }
          }
        }
        for (const child of node.children ?? []) walk(child);
        for (const callback of end) callback();
      };
      walk($.root().get(0));
    } };
  }
}

export default async function handler(req, res) {
  const incoming = new URL(req.url, 'https://' + req.headers.host);
  const routed = incoming.searchParams.get('__portal_path');
  if (routed !== null) {
    if (!routed.startsWith('/') || routed.startsWith('//')) return res.status(400).end();
    incoming.pathname = routed;
    incoming.searchParams.delete('__portal_path');
  }
  const method = req.method === 'HEAD' ? 'GET' : req.method;
  const options = {method};
  if(method==='POST' && incoming.pathname==='/api/medicion') {
    if(!req.headers['content-type']?.startsWith('application/json')) return res.status(415).end();
    const body=typeof req.body==='string'?req.body:JSON.stringify(req.body ?? null);
    if(Buffer.byteLength(body)>1500) return res.status(413).end();
    options.body=body;
    options.headers={origin:req.headers.origin ?? ''};
  }
  const response = await site.fetch(new Request(incoming, options));
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (incoming.pathname.startsWith('/api/')) res.setHeader('X-Robots-Tag', 'noindex');
  res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
}
