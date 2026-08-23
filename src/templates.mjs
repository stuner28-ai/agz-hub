import { SITE, TOOLS, GUIDES, toolBySlug } from "./content.mjs";

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const jsonLd = value => `<script type="application/ld+json">${JSON.stringify(value).replaceAll("<", "\\u003c")}</script>`;

const pathForTool = slug => `/herramientas/${slug}`;
const pathForGuide = slug => `/guias/${slug}`;

const nav = current => `
  <header class="site-header">
    <div class="nav-shell">
      <a class="brand" href="/" aria-label="UtiliTools, inicio">
        <img src="/assets/logo.svg" width="34" height="34" alt="" aria-hidden="true">
        <span>Utili<span>Tools</span></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">
        <span class="sr-only">Abrir menú</span><span></span><span></span><span></span>
      </button>
      <nav id="main-nav" class="main-nav" aria-label="Navegación principal">
        <a ${current === "tools" ? 'aria-current="page"' : ""} href="/herramientas">Calculadoras</a>
        <a ${current === "guides" ? 'aria-current="page"' : ""} href="/guias">Guías</a>
        <a ${current === "method" ? 'aria-current="page"' : ""} href="/metodologia">Cómo verificamos</a>
        <a class="nav-cta" href="/herramientas/precio-de-venta">Calcular precio</a>
      </nav>
    </div>
  </header>`;

const footer = () => `
  <footer class="site-footer">
    <div class="footer-shell">
      <div class="footer-brand">
        <a class="brand brand-footer" href="/"><img src="/assets/logo.svg" width="34" height="34" alt=""><span>Utili<span>Tools</span></span></a>
        <p>${escapeHtml(SITE.tagline)}. Herramientas independientes para decisiones cotidianas.</p>
      </div>
      <div class="footer-links"><strong>Explorar</strong><a href="/herramientas">Calculadoras</a><a href="/guias">Guías</a><a href="/metodologia">Metodología</a></div>
      <div class="footer-links"><strong>Confianza</strong><a href="/equipo">Quiénes somos</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a><a href="/contacto">Contacto</a></div>
    </div>
    <div class="footer-bottom"><span>© 2026 UtiliTools.com.ar</span><span>Hecho en Argentina · Sin registro · Cálculos en tu dispositivo</span></div>
  </footer>`;

const consentBanner = () => `
  <section class="consent-banner" data-consent-banner hidden aria-label="Preferencias de privacidad">
    <div><strong>Tu privacidad, primero</strong><p>Usamos almacenamiento local para recordar tus datos. Las estadísticas opcionales solo se activan si aceptás.</p></div>
    <div class="consent-actions"><button type="button" class="button ghost small" data-consent="necessary">Solo necesarias</button><button type="button" class="button primary small" data-consent="analytics">Aceptar estadísticas</button></div>
  </section>`;

const head = ({ title, description, path = "/", type = "website", noindex = false, structured = [] }) => {
  const canonical = `${SITE.domain}${path === "/" ? "/" : path}`;
  const fullTitle = title === SITE.name ? `${SITE.name} — ${SITE.tagline}` : `${title} | ${SITE.name}`;
  return `<!doctype html>
<html lang="es-AR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#09111f">
  <meta name="color-scheme" content="light">
  <meta property="og:locale" content="es_AR">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE.domain}/assets/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="UtiliTools, números claros para decidir mejor">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/assets/styles.css">
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});</script>
  ${structured.map(jsonLd).join("\n  ")}
</head>`;
};

const layout = ({ title, description, path, current, content, type, noindex, structured }) => `${head({ title, description, path, type, noindex, structured })}
<body data-page-path="${escapeHtml(path)}">
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  ${nav(current)}
  <main id="contenido">${content}</main>
  ${footer()}
  ${consentBanner()}
  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;

const breadcrumbData = items => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${SITE.domain}${item.path}` }))
});

const breadcrumbs = items => `<nav class="breadcrumbs" aria-label="Migas de pan">${items.map((item, index) => index === items.length - 1 ? `<span aria-current="page">${escapeHtml(item.name)}</span>` : `<a href="${item.path}">${escapeHtml(item.name)}</a><span aria-hidden="true">›</span>`).join("")}</nav>`;

const toolCard = (tool, compact = false) => `
  <a class="tool-card accent-${tool.accent} ${compact ? "tool-card-compact" : ""}" href="${pathForTool(tool.slug)}" data-search-card data-search-text="${escapeHtml(`${tool.title} ${tool.description} ${tool.category}`.toLowerCase())}">
    <span class="tool-icon" aria-hidden="true">${escapeHtml(tool.icon)}</span>
    <span class="tool-meta">${escapeHtml(tool.category)}</span>
    <h3>${escapeHtml(tool.shortTitle)}</h3>
    <p>${escapeHtml(tool.description)}</p>
    <span class="tool-link">Abrir calculadora <span aria-hidden="true">→</span></span>
  </a>`;

const guideCard = guide => `
  <article class="guide-card">
    <div class="guide-visual" aria-hidden="true"><span>${escapeHtml(guide.category)}</span><b>${escapeHtml(guide.title.split(":")[0])}</b></div>
    <div class="guide-card-body"><div class="guide-meta"><span>${escapeHtml(guide.category)}</span><span>${escapeHtml(guide.readingTime)}</span></div><h3><a href="${pathForGuide(guide.slug)}">${escapeHtml(guide.title)}</a></h3><p>${escapeHtml(guide.description)}</p><a class="text-link" href="${pathForGuide(guide.slug)}">Leer guía <span aria-hidden="true">→</span></a></div>
  </article>`;

const renderField = field => {
  if (field.type === "select") {
    return `<div class="field"><label for="${field.name}">${escapeHtml(field.label)}</label><select id="${field.name}" name="${field.name}">${field.options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${String(value) === String(field.value) ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}</select>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}</div>`;
  }
  return `<div class="field"><label for="${field.name}">${escapeHtml(field.label)}</label><div class="input-shell">${field.prefix ? `<span>${escapeHtml(field.prefix)}</span>` : ""}<input id="${field.name}" name="${field.name}" type="number" inputmode="decimal" value="${escapeHtml(field.value)}" min="${escapeHtml(field.min)}" ${field.max !== undefined ? `max="${escapeHtml(field.max)}"` : ""} step="${escapeHtml(field.step)}" ${field.required ? "required" : ""}>${field.suffix ? `<span>${escapeHtml(field.suffix)}</span>` : ""}</div>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}</div>`;
};

const trustStrip = () => `<div class="trust-strip" aria-label="Principios de UtiliTools"><span><b>✓</b> Fórmula visible</span><span><b>✓</b> Datos en tu dispositivo</span><span><b>✓</b> Fuentes enlazadas</span><span><b>✓</b> Sin registro</span></div>`;

export function renderHome() {
  const websiteData = { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.domain, description: SITE.description, inLanguage: "es-AR" };
  const content = `
    <section class="hero">
      <div class="hero-orb hero-orb-one"></div><div class="hero-orb hero-orb-two"></div>
      <div class="hero-grid">
        <div class="hero-copy"><span class="eyebrow">Hecho para Argentina · Actualizado</span><h1>Calculá antes de <em>decidir.</em></h1><p>Herramientas claras para poner precios, controlar márgenes, entender impuestos y hacer rendir mejor tu negocio.</p><div class="hero-actions"><a class="button primary" href="/herramientas/precio-de-venta">Calcular mi precio</a><a class="button secondary" href="/herramientas">Ver todas</a></div><div class="hero-proof"><span>${TOOLS.length} calculadoras revisadas</span><span>·</span><span>0 datos enviados</span><span>·</span><span>Fuentes oficiales</span></div></div>
        <div class="hero-demo" aria-label="Ejemplo de resultado"><div class="demo-top"><span>Precio que sostiene tu margen</span><span class="status-dot">En vivo</span></div><div class="demo-price"><small>Precio sugerido</small><strong>$19.900</strong><span>Incluye costos + comisión + margen</span></div><div class="demo-grid"><div><small>Ganancia</small><b>$5.970</b></div><div><small>Margen</small><b>30,0%</b></div></div><a href="/herramientas/precio-de-venta">Usar con mis números <span>→</span></a></div>
      </div>
    </section>
    ${trustStrip()}
    <section class="section shell" aria-labelledby="tools-title">
      <div class="section-heading"><div><span class="eyebrow dark">Empezá por una decisión</span><h2 id="tools-title">Las cuentas que más cuestan, resueltas</h2></div><a class="text-link" href="/herramientas">Explorar las ${TOOLS.length} <span>→</span></a></div>
      <div class="quick-search"><label for="tool-search">¿Qué necesitás calcular?</label><div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><input id="tool-search" type="search" placeholder="Ej.: precio, monotributo, aguinaldo…" autocomplete="off"></div><p data-search-empty hidden>No encontramos una herramienta con esas palabras.</p></div>
      <div class="tool-grid" data-search-grid>${TOOLS.slice(0, 6).map(tool => toolCard(tool)).join("")}</div>
    </section>
    <section class="impact-section"><div class="shell impact-grid"><div><span class="eyebrow">Una diferencia concreta</span><h2>No te damos solo un número.<br>Te mostramos de dónde sale.</h2><p>Cada calculadora publica su fórmula, un ejemplo, sus límites y la fuente cuando depende de reglas oficiales.</p><a class="button secondary light" href="/metodologia">Ver cómo verificamos</a></div><div class="impact-list"><article><span>01</span><div><h3>Corregible</h3><p>Cada página muestra fecha de revisión y un canal para reportar errores.</p></div></article><article><span>02</span><div><h3>Privado</h3><p>Tus importes se calculan en el navegador y quedan guardados solo en tu dispositivo.</p></div></article><article><span>03</span><div><h3>Compartible</h3><p>Copiá o compartí el resultado sin exponer los valores que no quieras mostrar.</p></div></article></div></div></section>
    <section class="section shell" aria-labelledby="guides-title"><div class="section-heading"><div><span class="eyebrow dark">Entender para decidir</span><h2 id="guides-title">Guías que completan la cuenta</h2></div><a class="text-link" href="/guias">Ver guías <span>→</span></a></div><div class="guide-grid">${GUIDES.map(guideCard).join("")}</div></section>
    <section class="return-panel shell"><div><span class="eyebrow dark">Tu espacio, sin crear cuenta</span><h2>Guardá herramientas y recuperá tus últimos valores.</h2><p>UtiliTools usa almacenamiento local: permanece en este dispositivo y podés borrarlo cuando quieras.</p></div><div class="saved-tools" data-saved-tools><p>Todavía no guardaste calculadoras.</p></div></section>`;
  return layout({ title: SITE.name, description: SITE.description, path: "/", current: "home", content, structured: [websiteData] });
}

export function renderToolsIndex() {
  const items = [{ name: "Inicio", path: "/" }, { name: "Calculadoras", path: "/herramientas" }];
  const content = `<section class="page-hero shell">${breadcrumbs(items)}<span class="eyebrow dark">${TOOLS.length} herramientas verificadas</span><h1>Calculadoras para decisiones reales</h1><p>Menos páginas, más profundidad. Elegí una herramienta y encontrá fórmula, explicación, ejemplo, fuentes y límites.</p></section><section class="section shell no-top"><div class="quick-search"><label for="tool-search">Buscar calculadora</label><div><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><input id="tool-search" type="search" placeholder="Precio, IVA, impresión 3D…"></div><p data-search-empty hidden>No encontramos una herramienta con esas palabras.</p></div><div class="tool-grid" data-search-grid>${TOOLS.map(tool => toolCard(tool)).join("")}</div></section>`;
  return layout({ title: "Calculadoras", description: "Calculadoras verificadas de negocio, impuestos, trabajo, marketing y producción.", path: "/herramientas", current: "tools", content, structured: [breadcrumbData(items)] });
}

export function renderToolPage(tool) {
  const path = pathForTool(tool.slug);
  const items = [{ name: "Inicio", path: "/" }, { name: "Calculadoras", path: "/herramientas" }, { name: tool.shortTitle, path }];
  const related = tool.related.map(slug => toolBySlug[slug]).filter(Boolean);
  const faqData = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: tool.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  const appData = { "@context": "https://schema.org", "@type": "WebApplication", name: tool.title, url: `${SITE.domain}${path}`, applicationCategory: "FinanceApplication", operatingSystem: "Cualquier navegador moderno", offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" }, description: tool.description, inLanguage: "es-AR", dateModified: SITE.updatedIso, author: { "@type": "Organization", name: "Equipo UtiliTools", url: `${SITE.domain}/equipo` } };
  const content = `
    <section class="tool-hero shell accent-${tool.accent}">${breadcrumbs(items)}<div class="tool-hero-grid"><div><div class="tool-kicker"><span class="tool-icon large">${escapeHtml(tool.icon)}</span><span>${escapeHtml(tool.category)} · ${escapeHtml(tool.updatedLabel || `Revisado ${SITE.updatedHuman}`)}</span></div><h1>${escapeHtml(tool.title)}</h1><p>${escapeHtml(tool.description)}</p><div class="hero-tool-actions"><button type="button" class="save-button" data-favorite="${escapeHtml(tool.slug)}" aria-pressed="false">☆ Guardar</button><a href="#calculadora">Ir al cálculo ↓</a></div></div><aside><strong>${escapeHtml(tool.promise)}</strong><ul><li>Sin registro</li><li>Datos en tu dispositivo</li><li>Resultado compartible</li></ul></aside></div></section>
    <section class="calculator-section shell" id="calculadora">
      <div class="calculator-card">
        <div class="calculator-heading"><div><span class="step-label">01 · Cargá tus datos</span><h2>Hacé la cuenta</h2></div><button type="button" class="reset-button" data-reset-form>Restablecer</button></div>
        <form data-calculator="${escapeHtml(tool.calculator)}" data-tool-slug="${escapeHtml(tool.slug)}" novalidate><div class="form-grid">${tool.fields.map(renderField).join("")}</div><button class="button primary calculate-button" type="submit">Calcular ahora <span aria-hidden="true">→</span></button><p class="form-error" data-form-error role="alert" hidden></p></form>
      </div>
      <div class="result-card" data-result-card><div class="result-placeholder"><span>02 · Tu resultado</span><svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true"><circle cx="36" cy="36" r="29" stroke="currentColor" stroke-width="2" stroke-dasharray="5 5"></circle><path d="M25 37l7 7 15-17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg><h2>Listo cuando vos estés</h2><p>Completá los campos y calculá. Podés corregir valores todas las veces que necesites.</p></div><div class="result-output" data-result-output role="status" aria-live="polite" hidden></div></div>
    </section>
    <section class="formula-band"><div class="shell formula-grid"><span class="step-label light">03 · Entendé el cálculo</span><div><h2>La fórmula, sin caja negra</h2><code>${escapeHtml(tool.formula)}</code><p>${escapeHtml(tool.formulaNote)}</p></div></div></section>
    <article class="editorial shell"><header><span class="eyebrow dark">Ejemplo explicado</span><h2>${escapeHtml(tool.exampleTitle)}</h2><p>${escapeHtml(tool.example)}</p></header>${tool.sections.map(section => `<section><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("")}</section>`).join("")}</article>
    <section class="sources-section shell"><div><span class="eyebrow dark">Transparencia</span><h2>Fuentes y revisión</h2><p>Contenido revisado por el equipo editorial de UtiliTools el ${SITE.updatedHuman}. Si una regla oficial cambia, la fecha y el cálculo deben actualizarse juntos.</p></div><div class="source-list">${tool.sources.map(([name, url, note]) => `<a href="${url}" ${url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}><strong>${escapeHtml(name)}</strong><span>${escapeHtml(note)}</span><b aria-hidden="true">↗</b></a>`).join("")}</div></section>
    <section class="faq-section shell"><span class="eyebrow dark">Preguntas frecuentes</span><h2>Antes de usar el resultado</h2><div class="faq-list">${tool.faqs.map(([q, a], index) => `<details ${index === 0 ? "open" : ""}><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join("")}</div></section>
    <section class="related-section shell"><div class="section-heading"><div><span class="eyebrow dark">Seguí con esto</span><h2>Herramientas relacionadas</h2></div><a class="text-link" href="/herramientas">Ver todas <span>→</span></a></div><div class="tool-grid related-grid">${related.map(item => toolCard(item, true)).join("")}</div></section>`;
  return layout({ title: tool.title, description: tool.description, path, current: "tools", content, structured: [breadcrumbData(items), appData, faqData] });
}

export function renderGuidesIndex() {
  const items = [{ name: "Inicio", path: "/" }, { name: "Guías", path: "/guias" }];
  const content = `<section class="page-hero shell">${breadcrumbs(items)}<span class="eyebrow dark">Guías originales</span><h1>La explicación detrás del número</h1><p>Material práctico para tomar decisiones, con ejemplos propios, checklist y acceso directo a la calculadora correspondiente.</p></section><section class="section shell no-top"><div class="guide-grid guide-grid-index">${GUIDES.map(guideCard).join("")}</div></section>`;
  return layout({ title: "Guías", description: "Guías prácticas de precios, margen y Monotributo para Argentina.", path: "/guias", current: "guides", content, structured: [breadcrumbData(items)] });
}

export function renderGuidePage(guide) {
  const path = pathForGuide(guide.slug);
  const tool = toolBySlug[guide.tool];
  const items = [{ name: "Inicio", path: "/" }, { name: "Guías", path: "/guias" }, { name: guide.title, path }];
  const articleData = { "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description, datePublished: "2026-08-23", dateModified: SITE.updatedIso, inLanguage: "es-AR", mainEntityOfPage: `${SITE.domain}${path}`, image: `${SITE.domain}/assets/og-default.png`, author: { "@type": "Organization", name: "Equipo UtiliTools", url: `${SITE.domain}/equipo` }, publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: `${SITE.domain}/assets/logo.svg` } } };
  const content = `<article class="guide-page"><header class="guide-hero shell">${breadcrumbs(items)}<div class="guide-meta"><span>${escapeHtml(guide.category)}</span><span>${escapeHtml(guide.readingTime)} de lectura</span><span>Revisado ${SITE.updatedHuman}</span></div><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.intro)}</p><div class="byline"><span class="byline-mark">UT</span><div><strong>Equipo UtiliTools</strong><span>Investigación, cálculo y edición interna</span></div></div></header><div class="guide-cover"><div class="guide-cover-art"><span>${escapeHtml(guide.category)}</span><strong>${escapeHtml(guide.title)}</strong><i></i><b>UtiliTools</b></div></div><div class="guide-layout shell"><div class="guide-body">${guide.sections.map(([title, paragraphs]) => `<section><h2>${escapeHtml(title)}</h2>${paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("")}</section>`).join("")}<section class="checklist"><h2>Checklist de aplicación</h2><ul>${guide.checklist.map(item => `<li><span>✓</span>${escapeHtml(item)}</li>`).join("")}</ul></section><div class="article-disclosure"><strong>Cómo se creó esta guía</strong><p>Redacción y ejemplos propios de UtiliTools, contrastados con la metodología publicada y, cuando corresponde, fuentes oficiales enlazadas desde la calculadora. No se usaron testimonios inventados ni promesas de resultados.</p></div></div><aside class="guide-aside"><div class="sticky-card"><span class="tool-icon">${escapeHtml(tool.icon)}</span><small>Aplicá la guía</small><h2>${escapeHtml(tool.shortTitle)}</h2><p>${escapeHtml(tool.promise)}</p><a class="button primary" href="${pathForTool(tool.slug)}">Abrir calculadora</a></div></aside></div></article>`;
  return layout({ title: guide.title, description: guide.description, path, current: "guides", type: "article", content, structured: [breadcrumbData(items), articleData] });
}

export function renderMethodology() {
  const path = "/metodologia";
  const items = [{ name: "Inicio", path: "/" }, { name: "Metodología", path }];
  const content = `<section class="page-hero shell narrow">${breadcrumbs(items)}<span class="eyebrow dark">Nuestro estándar</span><h1>Cómo construimos y verificamos cada herramienta</h1><p>Publicar una fórmula no alcanza. Documentamos la fuente, probamos casos límite y explicamos qué no puede resolver una calculadora.</p></section><article class="policy-page shell"><section><h2>1. Un problema real y un alcance concreto</h2><p>Cada herramienta debe responder una decisión identificable. Evitamos calculadoras duplicadas, temas sin relación con el público de UtiliTools y páginas creadas únicamente para captar búsquedas.</p></section><section><h2>2. Fórmula visible y casos de prueba</h2><p>Las funciones matemáticas se mantienen separadas de la interfaz y tienen pruebas automatizadas. Verificamos valores normales, ceros, límites, porcentajes incompatibles y redondeos. En cada página se publica una versión legible de la fórmula.</p></section><section><h2>3. Fuentes primarias para reglas cambiantes</h2><p>Cuando un cálculo depende de impuestos, trabajo o parámetros oficiales, enlazamos la fuente del organismo responsable y mostramos la fecha de vigencia. No usamos notas periodísticas como autoridad final. Si no podemos verificar un dato, no lo presentamos como vigente.</p></section><section><h2>4. Revisión editorial humana</h2><p>El equipo UtiliTools revisa explicación, ejemplos, resultados y enlaces antes de publicar. La automatización puede ayudar a detectar errores técnicos, pero no reemplaza la responsabilidad editorial.</p></section><section><h2>5. Privacidad por diseño</h2><p>Los cálculos se ejecutan en el navegador. Los valores pueden guardarse en el almacenamiento local del dispositivo para facilitar visitas futuras, pero no se envían a nuestra infraestructura. Las estadísticas se cargan únicamente con consentimiento.</p></section><section><h2>6. Correcciones</h2><p>Si detectamos un error material, corregimos cálculo y explicación, actualizamos la fecha de revisión y describimos el cambio cuando afecta resultados. Las herramientas oficiales o asesoramiento profesional prevalecen en situaciones personales.</p></section><div class="method-cards"><div><strong>Revisión actual</strong><span>${SITE.updatedHuman}</span></div><div><strong>Herramientas publicadas</strong><span>${TOOLS.length}</span></div><div><strong>Fuentes oficiales</strong><span>Enlace directo</span></div></div></article>`;
  return layout({ title: "Metodología y política editorial", description: "Cómo UtiliTools verifica cálculos, fuentes, contenido y correcciones.", path, current: "method", content, structured: [breadcrumbData(items)] });
}

export function renderAbout() {
  const path = "/equipo";
  const items = [{ name: "Inicio", path: "/" }, { name: "Quiénes somos", path }];
  const content = `<section class="page-hero shell narrow">${breadcrumbs(items)}<span class="eyebrow dark">Proyecto independiente argentino</span><h1>UtiliTools existe para que una cuenta difícil no frene una decisión.</h1><p>Somos un proyecto editorial y tecnológico enfocado en herramientas prácticas para trabajadores, monotributistas y pequeños negocios.</p></section><article class="policy-page shell"><section><h2>Qué hacemos</h2><p>Diseñamos calculadoras que combinan una interfaz rápida con explicación suficiente para entender el resultado. Priorizamos problemas frecuentes en Argentina: precios, márgenes, obligaciones básicas, campañas y producción.</p></section><section><h2>Qué no hacemos</h2><p>No vendemos datos personales, no pedimos credenciales fiscales y no prometemos resultados financieros. Tampoco publicamos decenas de páginas automáticas sobre temas que no podemos mantener.</p></section><section><h2>Responsabilidad editorial</h2><p>El Equipo UtiliTools investiga, implementa y revisa el contenido. En temas regulados, la fuente oficial y el profesional que conoce tu situación prevalecen sobre una estimación general.</p></section><section><h2>Modelo de sostenimiento</h2><p>El acceso es gratuito. El proyecto busca financiarse con publicidad claramente identificada y compatible con la lectura. Mientras AdSense revisa el sitio, no mostramos espacios vacíos ni anuncios simulados. La utilidad del contenido es el centro de cada página.</p></section></article>`;
  return layout({ title: "Quiénes somos", description: "Conocé el propósito, alcance y responsabilidad editorial de UtiliTools.", path, current: "about", content, structured: [breadcrumbData(items)] });
}

export function renderPrivacy() {
  const path = "/privacidad";
  const items = [{ name: "Inicio", path: "/" }, { name: "Privacidad", path }];
  const content = `<section class="page-hero shell narrow">${breadcrumbs(items)}<span class="eyebrow dark">Última actualización: ${SITE.updatedHuman}</span><h1>Política de privacidad y cookies</h1><p>Explicamos en lenguaje claro qué se guarda, para qué y cómo podés controlarlo.</p></section><article class="policy-page shell"><section><h2>Cálculos y datos ingresados</h2><p>Los importes que cargás en las calculadoras se procesan localmente en tu navegador. UtiliTools no los recibe ni los almacena en servidores. Para facilitar próximas visitas, el dispositivo puede recordar campos, favoritos y preferencias mediante localStorage. Podés borrar esos datos desde la configuración del navegador.</p></section><section><h2>Estadísticas de uso</h2><p>Con tu consentimiento, podemos activar Google Analytics para conocer páginas visitadas, tipo general de dispositivo, país aproximado y eventos como uso de una calculadora. La medición nos ayuda a detectar problemas y priorizar mejoras. Si elegís “Solo necesarias”, no cargamos Analytics.</p></section><section><h2>Publicidad</h2><p>UtiliTools se prepara para utilizar Google AdSense. Terceros, incluido Google, pueden usar cookies para publicar anuncios basados en visitas anteriores cuando la publicidad esté habilitada y exista una base de consentimiento aplicable. Google y sus socios pueden ofrecer publicidad personalizada o no personalizada según tus opciones y la legislación correspondiente.</p><p>Podés administrar la personalización en <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Configuración de anuncios de Google</a>. Para usuarios del EEE, Reino Unido y Suiza se utilizará una plataforma de gestión de consentimiento certificada antes de servir anuncios cuando corresponda.</p></section><section><h2>Cookies y almacenamiento necesarios</h2><p>Guardamos la elección de privacidad para no preguntarla en cada visita. También podemos recordar los valores de formularios y herramientas guardadas. Estas funciones no crean una cuenta ni identifican directamente a una persona.</p></section><section><h2>Enlaces externos</h2><p>Las fuentes oficiales y recursos enlazados tienen políticas propias. UtiliTools no controla sus prácticas ni su disponibilidad.</p></section><section><h2>Tus opciones</h2><p>Podés rechazar estadísticas desde el aviso inicial, borrar almacenamiento local o usar las herramientas del navegador para bloquear cookies. También podés volver a mostrar el panel mediante el enlace “Privacidad” y borrar la preferencia desde tu navegador.</p></section><section><h2>Contacto y cambios</h2><p>Las consultas de privacidad se reciben por el canal indicado en la página de contacto. Las modificaciones importantes se reflejarán en la fecha superior.</p></section></article>`;
  return layout({ title: "Política de privacidad", description: "Política de privacidad, cookies, Analytics y publicidad de UtiliTools.", path, current: "privacy", content, structured: [breadcrumbData(items)] });
}

export function renderTerms() {
  const path = "/terminos";
  const items = [{ name: "Inicio", path: "/" }, { name: "Términos", path }];
  const content = `<section class="page-hero shell narrow">${breadcrumbs(items)}<span class="eyebrow dark">Última actualización: ${SITE.updatedHuman}</span><h1>Términos de uso</h1><p>UtiliTools ofrece estimaciones educativas y operativas. Estos límites protegen decisiones informadas.</p></section><article class="policy-page shell"><section><h2>Uso de las herramientas</h2><p>Podés usar las calculadoras gratuitamente para fines personales o comerciales internos. Los resultados dependen de los datos cargados, supuestos publicados y vigencia de las fuentes.</p></section><section><h2>No constituye asesoramiento profesional</h2><p>El sitio no reemplaza asesoramiento contable, impositivo, legal, laboral, financiero ni técnico. Cuando una decisión pueda afectar obligaciones, derechos o patrimonio, verificá el resultado con el organismo o profesional competente.</p></section><section><h2>Exactitud y disponibilidad</h2><p>Trabajamos para mantener cálculos y enlaces correctos, pero pueden existir errores, cambios normativos o interrupciones. No garantizamos que el servicio esté disponible de manera ininterrumpida ni que un resultado se adapte a todas las situaciones.</p></section><section><h2>Propiedad y reutilización</h2><p>La marca, diseño, explicaciones, ejemplos y código editorial pertenecen a UtiliTools salvo fuentes indicadas. Podés compartir enlaces y resultados propios; no podés copiar masivamente el sitio ni presentarlo como propio.</p></section><section><h2>Conductas prohibidas</h2><p>No uses el servicio para introducir código malicioso, automatizar solicitudes abusivas, vulnerar seguridad, engañar a terceros o infringir derechos.</p></section><section><h2>Cambios</h2><p>Podemos mejorar herramientas y estos términos. La fecha superior identifica la versión vigente.</p></section></article>`;
  return layout({ title: "Términos de uso", description: "Condiciones, alcance y limitaciones de las calculadoras de UtiliTools.", path, current: "terms", content, structured: [breadcrumbData(items)] });
}

export function renderContact(contactEmail = "") {
  const path = "/contacto";
  const items = [{ name: "Inicio", path: "/" }, { name: "Contacto", path }];
  const contactBlock = contactEmail
    ? `<div class="contact-card"><span class="tool-icon">@</span><h2>Escribinos</h2><p>Errores de cálculo, fuentes desactualizadas, accesibilidad o propuestas útiles.</p><a class="button primary" href="mailto:${escapeHtml(contactEmail)}?subject=Consulta%20desde%20UtiliTools">${escapeHtml(contactEmail)}</a><small>No envíes claves, CUIT ni información financiera sensible.</small></div>`
    : `<div class="contact-card"><span class="tool-icon">@</span><h2>Canal público en configuración</h2><p>No publicamos el correo personal del responsable sin autorización. El canal definitivo se incorporará antes de solicitar una nueva revisión de AdSense.</p><small>No hay un formulario que simule envíos: preferimos ser transparentes.</small></div>`;
  const content = `<section class="page-hero shell narrow">${breadcrumbs(items)}<span class="eyebrow dark">Estamos del otro lado</span><h1>Contacto y correcciones</h1><p>Una herramienta confiable necesita recibir reportes y corregirlos con trazabilidad.</p></section><section class="contact-layout shell">${contactBlock}<div class="contact-copy"><h2>Qué información ayuda</h2><ul><li>La URL de la herramienta.</li><li>Los valores que ingresaste, si no son sensibles.</li><li>El resultado esperado y el obtenido.</li><li>Un enlace oficial si reportás un cambio normativo.</li></ul><h2>Qué no enviar</h2><p>No necesitamos CUIT, documentos, claves fiscales, números de tarjeta ni contraseñas. UtiliTools nunca pedirá acceso a ARCA.</p><h2>Plazo editorial</h2><p>Los errores materiales se priorizan. Cuando una corrección modifica resultados, actualizamos también la explicación y la fecha de revisión.</p></div></section>`;
  return layout({ title: "Contacto y correcciones", description: "Contactá a UtiliTools para reportar errores, fuentes desactualizadas o problemas de accesibilidad.", path, current: "contact", content, structured: [breadcrumbData(items)] });
}

export function render404() {
  const content = `<section class="not-found shell"><span>404</span><h1>Esa herramienta ya no está acá.</h1><p>Retiramos páginas duplicadas o que no cumplían nuestro estándar. Probá con una de las calculadoras verificadas.</p><a class="button primary" href="/herramientas">Ver calculadoras</a></section>`;
  return layout({ title: "Página no encontrada", description: "La página solicitada no existe.", path: "/404", current: "none", content, noindex: true });
}
