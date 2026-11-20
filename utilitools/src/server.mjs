import { createHash, randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
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
// Printables no se consulta desde el servidor: sus condiciones (art. 9.1) prohíben la extracción
// automatizada. Solo se enlaza a su sitio.
const printablesSearch = term => 'https://www.printables.com/search/models?' + new URLSearchParams({ q: term });

const analyticsEvents = {
  page_view: [['channel',['search','social','referral','direct','internal']],
    ['category',['juguetes','diy-taller','decoracion','organizacion','macetas','miniaturas','repuestos','cosplay','llaveros','gamer','cocina','mascotas','electronica']]],
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

// Pedidos de baja de modelos: se guardan como JSON en un Blob privado de Vercel.
const takedownReasons = ['autor', 'licencia', 'marca', 'otro'];
async function takedownRequest(request, url) {
  const back = status => Response.redirect(url.origin + '/acerca/?baja=' + status + '#bajas', 303);
  if (request.headers.get('origin') !== url.origin) return new Response(null, { status: 403 });
  let form;
  try { form = await request.json(); } catch { return back('error'); }
  const field = (name, max) => typeof form?.[name] === 'string' ? form[name].trim().slice(0, max) : '';
  if (field('web', 200)) return back('enviada'); // campo trampa: solo lo completan los bots
  const entry = {
    modelo: field('modelo', 500), motivo: field('motivo', 20), detalle: field('detalle', 1500),
    email: field('email', 200), creado: new Date().toISOString(), sitio: url.hostname
  };
  if (!entry.modelo || !takedownReasons.includes(entry.motivo) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(entry.email)) return back('incompleto');
  if (!process.env.BLOB_READ_WRITE_TOKEN) return back('error');
  try {
    // La librería reintenta con espera si Blob falla: cortamos a los 8 s para no dejar al usuario esperando.
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, 8000); });
    try {
      await Promise.race([put('bajas/' + entry.creado.slice(0, 10) + '-' + randomUUID() + '.json', JSON.stringify(entry, null, 2),
        { access: 'private', contentType: 'application/json', addRandomSuffix: false, abortSignal: controller.signal }), timeout]);
    } finally { clearTimeout(timer); }
    return back('enviada');
  } catch (error) {
    console.error('Takedown request not stored', error.message);
    return back('error');
  }
}

const takedownMessages = {
  enviada: 'Recibimos tu pedido. Lo revisamos y, si corresponde, quitamos el modelo del sitio.',
  incompleto: 'Faltan datos: completá el enlace o nombre del modelo, el motivo y un email válido.',
  error: 'No pudimos guardar el pedido. Probá de nuevo en unos minutos.'
};

const site = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/api/medicion' && request.method === 'POST') return analyticsCapture(request,url);
    if (url.pathname === '/api/bajas' && request.method === 'POST') return takedownRequest(request,url);
    if (request.method !== 'GET') return new Response(null, { status: 405 });
    return await serveSite(url);
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

async function serveSite(url) {
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
      // /calculadora/ y /perfiles/#x pasan a la raíz de su subdominio; /guias/x.html conserva la ruta.
      for (const section of Object.keys(sections)) {
        body = body.replace(new RegExp('href="/' + section + '/([^"]*)"', 'g'), (match, rest) =>
          'href="https://' + section + '.' + domain + '/' + (rest === '' || rest.startsWith('#') ? rest : section + '/' + rest) + '"');
      }
    }
  }
  if (name === '/acerca/' && Object.hasOwn(takedownMessages, url.searchParams.get('baja') ?? '')) {
    const status = url.searchParams.get('baja');
    body = body.replace('<!--BAJA-ESTADO-->', '<p class="form-status ' + status + '" role="status">' + takedownMessages[status] + '</p>');
  }
  if (extension === 'html' && body.includes('<!--MODELOS:')) {
    body = categoryModels(body);
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


const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Reemplaza <!--MODELOS:consulta--> por enlaces a la búsqueda en Printables y en el buscador propio.
function categoryModels(body) {
  const marker = body.match(/<!--MODELOS:([^>]{1,80})-->/);
  const query = marker[1].trim();
  const searchLink = '/?q=' + encodeURIComponent(query) + '#catalogo';
  return body.replace(marker[0], '<p class="models-fallback">Los modelos más populares de esta categoría están en ' +
    '<a href="' + escapeHtml(printablesSearch(query)) + '" target="_blank" rel="noopener noreferrer">Printables ↗</a>. ' +
    'También podés <a href="' + searchLink + '">buscar en el catálogo de UtiliTools y en otros sitios →</a></p>');
}

const web = 'https://www.utilitools.com.ar';
// archivo: [título SEO, descripción, fecha de actualización o null]
const guides = {
  "calibrar-filamento.html": ["Cómo calibrar el filamento para impresión 3D", "Calibrá una bobina con pruebas de temperatura, flujo y tolerancia antes de imprimir una tanda.", null],
  "costos-de-impresion.html": ["Cómo calcular el costo de una impresión 3D", "Calculá material, electricidad, desgaste, mano de obra y margen para cotizar impresiones en pesos argentinos.", null],
  "fidgets-y-holguras.html": ["Holguras para fidgets y encastres impresos en 3D", "Ajustá la separación de bisagras y piezas móviles con pruebas de encastre antes de imprimir un lote.", null],
  "pla-vs-petg.html": ["PLA o PETG: cuál elegir para cada pieza", "Temperaturas, resistencia al calor y a golpes, acabado y precio: qué filamento conviene para decoración, piezas funcionales y exterior.", "2026-11-17"],
  "cuanto-cobrar-impresion-3d.html": ["Cuánto cobrar una impresión 3D en Argentina", "Cómo armar el precio con material, máquina, mano de obra, fallos, embalaje y comisión. Ejemplo completo en pesos argentinos.", "2026-11-17"],
  "vender-en-mercado-libre.html": ["Cómo vender impresiones 3D en Mercado Libre", "Costos de venta, publicaciones que venden, embalaje y licencias: lo que conviene revisar antes de publicar impresiones 3D.", "2026-11-17"],
  "primera-capa.html": ["Cómo lograr una primera capa perfecta en impresión 3D", "Diagnóstico visual, limpieza de la cama, nivelación y Z offset para que la primera capa se pegue y quede lisa.", "2026-11-17"],
  "secar-filamento.html": ["Cómo secar el filamento y guardarlo bien", "Señales de humedad, temperaturas y tiempos de secado para PLA, PETG, TPU, ABS y nylon, y cómo guardar las bobinas.", "2026-11-17"],
  "warping.html": ["Warping en impresión 3D: por qué se levanta la pieza", "Por qué las esquinas se despegan y se curvan, y cómo evitarlo con adhesión, enfriamiento, brim y diseño.", "2026-11-17"],
  "hilos-stringing.html": ["Cómo eliminar los hilos (stringing) en impresión 3D", "Secado, torre de temperatura, retracción y recorridos para eliminar los hilos entre partes de la pieza.", "2026-11-17"],
  "licencias-modelos-3d.html": ["Licencias de modelos 3D: qué podés vender", "Creative Commons, licencias de plataformas, marcas y personajes: qué permite cada licencia y cómo citar al autor.", "2026-11-17"],
  "soportes.html": ["Soportes fáciles de retirar en impresión 3D", "Cuándo hacen falta, soportes normales o en árbol, distancias Z y XY, interfaz y el truco del PETG para que salgan limpios.", "2026-11-17"],
  "multicolor.html": ["Impresión 3D multicolor con menos purga", "Cambio por capa, sistemas multimaterial y cómo reducir la purga, el tiempo y el costo de imprimir en varios colores.", "2026-11-17"],
  "tpu-flexibles.html": ["Cómo imprimir TPU y filamentos flexibles", "Dureza Shore, extrusor directo o bowden, temperaturas, velocidad y cuidados para imprimir TPU sin que se trabe.", "2026-11-17"],
  "boquillas.html": ["Qué boquilla usar en tu impresora 3D", "Tamaños de 0,2 a 0,8 mm, latón o acero endurecido, señales de desgaste y cómo cambiar la boquilla.", "2026-11-17"],
  "mantenimiento.html": ["Mantenimiento básico de la impresora 3D", "Rutina por frecuencia, lubricación, correas, atascos y seguridad para que tu impresora falle menos y dure más.", "2026-11-17"]
};
const categoryDetails = {"/categorias/juguetes/": ["Juguetes para imprimir en 3D", "Juguetes articulados, fidgets y modelos que se imprimen sin ensamblar. Los más descargados, holguras y configuración recomendada."], "/categorias/diy-taller/": ["DIY y taller para imprimir en 3D", "Soportes para herramientas, paneles Honeycomb y pegboard, guías y plantillas para el taller. Modelos populares y configuración de partida."], "/categorias/decoracion/": ["Decoración para imprimir en 3D", "Floreros, lámparas y adornos de pared para imprimir en 3D. Modelos populares, consejos de acabado y modo espiral."], "/categorias/organizacion/": ["Organización para imprimir en 3D", "Gridfinity, organizadores de cajón y cajas modulares para imprimir. Medidas del sistema, modelos populares y configuración."], "/categorias/macetas/": ["Macetas para imprimir en 3D", "Macetas con drenaje, autorriego y para suculentas. Los modelos más descargados y qué material usar para interior o exterior."], "/categorias/miniaturas/": ["Miniaturas para imprimir en 3D", "Miniaturas para rol y wargames, escenografía y bustos. Modelos populares, escalas y configuración para FDM y resina."], "/categorias/repuestos/": ["Repuestos para imprimir en 3D", "Perillas, clips, tapas y piezas de reemplazo para imprimir. Cómo medir, qué material usar y modelos populares."], "/categorias/cosplay/": ["Cosplay para imprimir en 3D", "Cascos, armaduras y accesorios de cosplay para imprimir en 3D. Cómo escalar, unir, lijar y pintar piezas grandes."], "/categorias/llaveros/": ["Llaveros para imprimir en 3D", "Llaveros personalizados, con nombre y articulados para imprimir y vender. Modelos populares, cambio de color y costos."], "/categorias/gamer/": ["Accesorios gamer para imprimir en 3D", "Soportes para joysticks y auriculares, organizadores de juegos y pasacables para imprimir en 3D. Modelos populares y configuración."], "/categorias/cocina/": ["Accesorios de cocina para imprimir en 3D", "Organizadores, soportes de esponja, ganchos y cortantes de galletitas. Qué material usar y cuidados con el contacto con alimentos."], "/categorias/mascotas/": ["Accesorios para mascotas para imprimir en 3D", "Soportes para comederos, chapitas y colgadores de correas para imprimir en 3D, con consejos de seguridad para perros y gatos."], "/categorias/electronica/": ["Electrónica: cajas y soportes para imprimir en 3D", "Gabinetes para Raspberry Pi y Arduino, cajas de proyectos y organizadores de cables. Holguras, ventilación y material recomendado."]};
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
  // Imagen para compartir: propia en guías y categorías, portada general en el resto.
  let logo = web + '/herramientas/assets/portada-1120.jpg';
  let image = { type: 'image/jpeg', width: 1120, height: 840 };
  const ogPath = guide && Object.hasOwn(guides, guide) ? '/og/guias/' + guide.replace(/\.html$/, '.png')
    : Object.hasOwn(categoryDetails, name) ? '/og/categorias/' + name.split('/').at(-2) + '.png' : null;
  if (ogPath && Object.hasOwn(assets, ogPath)) {
    logo = web + ogPath;
    image = { type: 'image/png', width: 1200, height: 630 };
  }
  let structured = '';
  if (name === '/index.html') {
    structured = '<script type="application/ld+json">' + JSON.stringify({ '@context':'https://schema.org','@type':'WebSite',
      name:'UtiliTools', url:web+'/', potentialAction:{ '@type':'SearchAction',
        target:web+'/?q={search_term_string}#catalogo', 'query-input':'required name=search_term_string' } }) + '</script>';
  } else if (guide && Object.hasOwn(guides, guide)) {
    const [, , updated] = guides[guide];
    const org = { '@type':'Organization', name:'UtiliTools', url:web+'/', logo:web+'/apple-touch-icon.png' };
    structured = '<script type="application/ld+json">' + JSON.stringify({ '@context':'https://schema.org','@type':'Article',
      headline:title, description, inLanguage:'es-AR', mainEntityOfPage:url, image:logo, author:org, publisher:org,
      ...(updated ? { datePublished:updated, dateModified:updated } : {}) }) + '</script>';
  } else if (Object.hasOwn(categoryDetails, name)) {
    structured = '<script type="application/ld+json">' + JSON.stringify({ '@context':'https://schema.org','@type':'BreadcrumbList',
      itemListElement:[{ '@type':'ListItem', position:1, name:'Inicio', item:web+'/' },
        { '@type':'ListItem', position:2, name:categoryDetails[name][0].replace(/ para imprimir en 3D$/, ''), item:url }] }) + '</script>';
  }
  const metadata = '<meta name="description" content="' + description + '"><link rel="canonical" href="' + url + '">' +
    '<meta name="robots" content="' + (noindex ? 'noindex,follow' : 'index,follow') + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="UtiliTools">' +
    '<meta property="og:title" content="' + pageTitle + '"><meta property="og:description" content="' + description + '">' +
    '<meta property="og:url" content="' + url + '"><meta property="og:image" content="' + logo + '">' +
    '<meta property="og:image:type" content="' + image.type + '"><meta property="og:image:width" content="' + image.width + '"><meta property="og:image:height" content="' + image.height + '">' +
    '<meta property="og:image:alt" content="' + pageTitle.replace(/"/g, '&quot;') + '">' +
    '<meta property="og:locale" content="es_AR">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&display=swap">' +
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
    paths.map(path => {
      const updated = path.startsWith('/guias/') && guides[path.slice(7)]?.[2];
      return '<url><loc>' + origin + path + '</loc>' + (updated ? '<lastmod>' + updated + '</lastmod>' : '') + '</url>';
    }).join('') + '</urlset>';
  return new Response(content, { headers: { ...headers, 'content-type':'application/xml; charset=utf-8' } });
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
  if(method==='POST' && incoming.pathname==='/api/bajas') {
    const fields=req.body && typeof req.body==='object' ? req.body : Object.fromEntries(new URLSearchParams(String(req.body ?? '')));
    const body=JSON.stringify(fields);
    if(Buffer.byteLength(body)>4000) return res.status(413).end();
    options.body=body;
    options.headers={origin:req.headers.origin ?? '','content-type':'application/json'};
  }
  const response = await site.fetch(new Request(incoming, options));
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (incoming.pathname.startsWith('/api/')) res.setHeader('X-Robots-Tag', 'noindex');
  res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
}
