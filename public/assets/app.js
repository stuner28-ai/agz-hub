import {
  calculateSalePrice,
  calculateMargin,
  calculateVat,
  calculateAguinaldo,
  calculateBreakEven,
  calculateRoi,
  calculateDiscounts,
  calculateCompoundInterest,
  calculate3dPrint,
  calculateMonotributo
} from "./calculators.js";

const ANALYTICS_ID = "G-2RK3H8JB0P";
const money = value => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);
const integer = value => new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value);
const decimal = (value, digits = 2) => new Intl.NumberFormat("es-AR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const percent = value => `${decimal(value)}%`;

const TOOL_INDEX = {
  "precio-de-venta": ["Precio de venta", "/herramientas/precio-de-venta"],
  monotributo: ["Monotributo 2026", "/herramientas/monotributo"],
  "margen-ganancia": ["Margen y markup", "/herramientas/margen-ganancia"],
  iva: ["IVA", "/herramientas/iva"],
  aguinaldo: ["Aguinaldo", "/herramientas/aguinaldo"],
  "punto-equilibrio": ["Punto de equilibrio", "/herramientas/punto-equilibrio"],
  "roi-roas": ["ROI y ROAS", "/herramientas/roi-roas"],
  descuentos: ["Descuentos", "/herramientas/descuentos"],
  "interes-compuesto": ["Interés compuesto", "/herramientas/interes-compuesto"],
  "costo-impresion-3d": ["Costo impresión 3D", "/herramientas/costo-impresion-3d"]
};

function metric(label, value, highlight = false) {
  return `<div class="result-metric ${highlight ? "highlight" : ""}"><span>${label}</span><strong>${value}</strong></div>`;
}

function resultView({ label, value, subtitle, metrics = [], note = "", shareText }) {
  return `<div class="result-live"><span class="step-label light">02 · Tu resultado</span><small>${label}</small><h2>${value}</h2><p class="result-subtitle">${subtitle}</p><div class="result-metrics">${metrics.join("")}</div>${note ? `<p class="result-note">${note}</p>` : ""}<div class="result-actions"><button type="button" class="button result-button" data-share-result data-share-text="${encodeURIComponent(shareText)}">Compartir</button><button type="button" class="button result-button ghost-dark" data-copy-result data-share-text="${encodeURIComponent(shareText)}">Copiar resultado</button></div><p class="copy-feedback" data-copy-feedback aria-live="polite"></p></div>`;
}

const handlers = {
  "sale-price": values => {
    const result = calculateSalePrice(values);
    const shareText = `Mi precio de venta estimado es ${money(result.price)}, con una ganancia aproximada de ${money(result.profit)} y margen de ${percent(result.netMarginPct)}. Calculado en UtiliTools.`;
    return resultView({
      label: "Precio sugerido",
      value: money(result.price),
      subtitle: "Redondeado hacia arriba según tu elección.",
      metrics: [metric("Costos por unidad", money(result.baseCost)), metric("Comisión + impuestos", money(result.transactionCosts)), metric("Ganancia estimada", money(result.profit), true), metric("Margen neto", percent(result.netMarginPct)), metric("Markup", percent(result.markupPct)), ...(result.minimumRoas ? [metric("ROAS mínimo sobre pauta", `${decimal(result.minimumRoas)}×`)] : [])],
      note: "Estimación comercial. Verificá los impuestos aplicables a tu situación antes de publicar el precio.",
      shareText
    });
  },
  margin: values => {
    const result = calculateMargin(values);
    const shareText = `Esta venta deja ${money(result.profit)}: margen ${percent(result.marginPct)} y markup ${percent(result.markupPct)}. Calculado en UtiliTools.`;
    return resultView({ label: "Ganancia por unidad", value: money(result.profit), subtitle: result.profit >= 0 ? "Después de los costos cargados." : "El precio está por debajo del costo total.", metrics: [metric("Costo total", money(result.totalCost)), metric("Margen", percent(result.marginPct), true), metric("Markup", percent(result.markupPct)), metric("Precio para el objetivo", money(result.priceForTarget))], shareText });
  },
  vat: values => {
    const result = calculateVat(values);
    const shareText = `Importe neto ${money(result.net)}, IVA ${money(result.tax)} y total ${money(result.total)} con alícuota ${decimal(result.rate, 1)}%. Calculado en UtiliTools.`;
    return resultView({ label: result.mode === "extract" ? "Neto sin IVA" : "Total con IVA", value: money(result.mode === "extract" ? result.net : result.total), subtitle: `Alícuota seleccionada: ${decimal(result.rate, 1)}%.`, metrics: [metric("Neto gravado", money(result.net)), metric("IVA", money(result.tax), true), metric("Total", money(result.total))], note: "La herramienta aplica la tasa elegida; no determina qué alícuota corresponde a la operación.", shareText });
  },
  aguinaldo: values => {
    const result = calculateAguinaldo(values);
    const shareText = `Aguinaldo bruto estimado: ${money(result.amount)} para ${decimal(result.months, result.months % 1 ? 2 : 0)} meses trabajados. Calculado en UtiliTools.`;
    return resultView({ label: "Aguinaldo bruto estimado", value: money(result.amount), subtitle: result.isFullSemester ? "Semestre completo: 50% de la mejor remuneración." : "Cálculo proporcional al tiempo cargado.", metrics: [metric("Mejor remuneración", money(result.salary)), metric("Meses considerados", decimal(result.months, result.months % 1 ? 2 : 0)), metric("Proporción de la remuneración", percent((result.amount / result.salary) * 100), true)], note: "Puede requerir ajustes por conceptos laborales particulares. No reemplaza una liquidación profesional.", shareText });
  },
  "break-even": values => {
    const result = calculateBreakEven(values);
    const shareText = `Mi punto de equilibrio estimado es ${integer(result.units)} unidades o ${money(result.revenue)} de facturación. Calculado en UtiliTools.`;
    return resultView({ label: "Unidades para cubrir costos", value: integer(result.units), subtitle: `Equilibrio exacto: ${decimal(result.exactUnits)} unidades; se redondea hacia arriba.`, metrics: [metric("Contribución por unidad", money(result.contribution), true), metric("Margen de contribución", percent(result.contributionMarginPct)), metric("Facturación de equilibrio", money(result.revenue)), ...(result.expectedProfit !== null ? [metric("Resultado con ventas esperadas", money(result.expectedProfit))] : [])], shareText });
  },
  roi: values => {
    const result = calculateRoi(values);
    const shareText = `La campaña deja ${money(result.profit)}, ROI ${percent(result.roiPct)}${result.roas ? ` y ROAS ${decimal(result.roas)}×` : ""}. Calculado en UtiliTools.`;
    return resultView({ label: "Ganancia atribuible", value: money(result.profit), subtitle: result.profit >= 0 ? "Ingresos menos todos los costos cargados." : "Los costos cargados superan los ingresos.", metrics: [metric("ROI", percent(result.roiPct), true), ...(result.roas ? [metric("ROAS", `${decimal(result.roas)}×`)] : []), metric("Costos totales", money(result.totalCosts)), metric("Ingresos para equilibrio", money(result.breakEvenRevenue))], note: "La calidad del resultado depende de que ingresos y costos correspondan al mismo período y criterio de atribución.", shareText });
  },
  discounts: values => {
    const result = calculateDiscounts(values);
    const recovery = Number.isFinite(result.recoveryIncreasePct) ? percent(result.recoveryIncreasePct) : "No recuperable";
    const shareText = `Precio final ${money(result.finalPrice)}, ahorro efectivo ${percent(result.effectiveDiscountPct)}. Calculado en UtiliTools.`;
    return resultView({ label: "Precio final", value: money(result.finalPrice), subtitle: "Los descuentos se aplicaron de forma sucesiva.", metrics: [metric("Ahorro", money(result.saved), true), metric("Descuento efectivo", percent(result.effectiveDiscountPct)), metric("Aumento para recuperar", recovery)], shareText });
  },
  "compound-interest": values => {
    const result = calculateCompoundInterest(values);
    const shareText = `Proyección matemática: ${money(result.finalAmount)} en ${decimal(result.periods / 12, 1)} años; aportado ${money(result.contributed)}. Calculado en UtiliTools.`;
    return resultView({ label: "Capital nominal proyectado", value: money(result.finalAmount), subtitle: "Supone tasa constante y aportes al final de cada mes.", metrics: [metric("Total aportado", money(result.contributed)), metric("Interés matemático", money(result.interest), true), metric("Valor real estimado", money(result.realValue)), metric("Tasa mensual equivalente", percent(result.monthlyRatePct))], note: "No es una promesa de rendimiento ni una recomendación de inversión.", shareText });
  },
  "3d-print": values => {
    const result = calculate3dPrint(values);
    const shareText = `Precio sugerido para esta impresión 3D: ${money(result.suggestedPrice)}; costo esperado ${money(result.costWithFailures)}. Calculado en UtiliTools.`;
    return resultView({ label: "Precio sugerido", value: money(result.suggestedPrice), subtitle: "Incluye margen sobre el costo esperado con fallas.", metrics: [metric("Material", money(result.material)), metric("Energía", money(result.electricity)), metric("Desgaste", money(result.depreciation)), metric("Trabajo", money(result.labor)), metric("Costo con fallas", money(result.costWithFailures)), metric("Ganancia estimada", money(result.profit), true)], shareText });
  },
  monotributo: values => {
    const result = calculateMonotributo(values);
    if (!result.eligible) {
      const shareText = `La estimación supera los parámetros generales del Monotributo vigentes desde agosto de 2026. Revisá tu situación en ARCA.`;
      return resultView({ label: "Resultado orientativo", value: "Fuera de parámetros", subtitle: `El límite máximo de ingresos informado por ARCA es ${money(result.maximumIncome)}.`, metrics: [metric("Ingresos cargados", money(result.income))], note: "También puede haber otros parámetros excedidos. Consultá el portal de ARCA o a un profesional.", shareText });
    }
    const shareText = `Categoría de Monotributo estimada: ${result.category}; cuota general aproximada ${money(result.monthlyTotal)}. Valores ARCA desde 01/08/2026.`;
    return resultView({ label: "Categoría estimada", value: result.category, subtitle: `Para ${result.activity === "goods" ? "venta de cosas muebles" : "locaciones y servicios"}.`, metrics: [metric("Cuota general mensual", money(result.monthlyTotal), true), metric("Tope anual de categoría", money(result.annualCap)), metric("Promedio mensual del tope", money(result.monthlyAverageCap)), metric("Margen hasta el tope", money(result.headroom))], note: "El total real puede variar por aportes, obra social, adherentes y excepciones. Confirmá en ARCA.", shareText });
  }
};

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function saveForm(form) {
  const slug = form.dataset.toolSlug;
  if (!slug) return;
  localStorage.setItem(`ut_form_${slug}`, JSON.stringify(formValues(form)));
}

function restoreForm(form) {
  const slug = form.dataset.toolSlug;
  if (!slug) return;
  try {
    const values = JSON.parse(localStorage.getItem(`ut_form_${slug}`) || "null");
    if (!values) return;
    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name);
      if (field) field.value = value;
    }
  } catch { /* Ignore invalid local data. */ }
}

function track(eventName, params = {}) {
  if (localStorage.getItem("ut_consent") === "analytics" && typeof window.gtag === "function") window.gtag("event", eventName, params);
}

document.querySelectorAll("form[data-calculator]").forEach(form => {
  restoreForm(form);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const error = form.querySelector("[data-form-error]");
    const output = document.querySelector("[data-result-output]");
    const placeholder = document.querySelector(".result-placeholder");
    try {
      const handler = handlers[form.dataset.calculator];
      if (!handler) throw new Error("Esta calculadora todavía no está disponible.");
      output.innerHTML = handler(formValues(form));
      output.hidden = false;
      if (placeholder) placeholder.hidden = true;
      error.hidden = true;
      saveForm(form);
      track("calculate", { tool: form.dataset.toolSlug });
      if (window.matchMedia("(max-width: 840px)").matches) output.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (problem) {
      error.textContent = problem.message || "Revisá los datos ingresados.";
      error.hidden = false;
    }
  });
});

document.querySelectorAll("[data-reset-form]").forEach(button => button.addEventListener("click", () => {
  const form = document.querySelector("form[data-calculator]");
  if (!form) return;
  form.reset();
  localStorage.removeItem(`ut_form_${form.dataset.toolSlug}`);
  const output = document.querySelector("[data-result-output]");
  const placeholder = document.querySelector(".result-placeholder");
  if (output) { output.hidden = true; output.innerHTML = ""; }
  if (placeholder) placeholder.hidden = false;
}));

document.addEventListener("click", async event => {
  const shareButton = event.target.closest("[data-share-result]");
  const copyButton = event.target.closest("[data-copy-result]");
  const button = shareButton || copyButton;
  if (!button) return;
  const text = decodeURIComponent(button.dataset.shareText || "");
  const payload = `${text} ${location.href}`;
  if (shareButton && navigator.share) {
    try { await navigator.share({ title: document.title, text, url: location.href }); track("share_result", { method: "native" }); return; } catch { /* User canceled or share unavailable. */ }
  }
  try {
    await navigator.clipboard.writeText(payload);
    const feedback = document.querySelector("[data-copy-feedback]");
    if (feedback) feedback.textContent = "Resultado copiado.";
    track("share_result", { method: "copy" });
  } catch {
    const feedback = document.querySelector("[data-copy-feedback]");
    if (feedback) feedback.textContent = "No pudimos copiarlo automáticamente.";
  }
});

const favoriteKey = "ut_favorites";
const getFavorites = () => {
  try { return JSON.parse(localStorage.getItem(favoriteKey) || "[]"); } catch { return []; }
};

function updateFavoriteButtons() {
  const favorites = getFavorites();
  document.querySelectorAll("[data-favorite]").forEach(button => {
    const active = favorites.includes(button.dataset.favorite);
    button.setAttribute("aria-pressed", String(active));
    button.textContent = active ? "★ Guardada" : "☆ Guardar";
  });
}

document.querySelectorAll("[data-favorite]").forEach(button => button.addEventListener("click", () => {
  const slug = button.dataset.favorite;
  const favorites = getFavorites();
  const next = favorites.includes(slug) ? favorites.filter(item => item !== slug) : [...favorites, slug];
  localStorage.setItem(favoriteKey, JSON.stringify(next));
  updateFavoriteButtons();
  renderSavedTools();
  track("favorite_tool", { tool: slug, active: next.includes(slug) });
}));

function renderSavedTools() {
  const target = document.querySelector("[data-saved-tools]");
  if (!target) return;
  const favorites = getFavorites().filter(slug => TOOL_INDEX[slug]);
  target.innerHTML = favorites.length
    ? favorites.map(slug => `<a href="${TOOL_INDEX[slug][1]}"><span>★</span>${TOOL_INDEX[slug][0]}<b>→</b></a>`).join("")
    : "<p>Todavía no guardaste calculadoras. Abrí una y tocá “Guardar”.</p>";
}
updateFavoriteButtons();
renderSavedTools();

const search = document.querySelector("#tool-search");
if (search) search.addEventListener("input", () => {
  const query = search.value.trim().toLocaleLowerCase("es");
  let visible = 0;
  document.querySelectorAll("[data-search-card]").forEach(card => {
    const match = !query || card.dataset.searchText.includes(query);
    card.hidden = !match;
    if (match) visible += 1;
  });
  const empty = document.querySelector("[data-search-empty]");
  if (empty) empty.hidden = visible > 0;
});

const navToggle = document.querySelector(".nav-toggle");
if (navToggle) navToggle.addEventListener("click", () => {
  const expanded = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!expanded));
  document.querySelector(".main-nav")?.classList.toggle("open", !expanded);
});

function enableAnalytics() {
  if (document.querySelector(`script[src*="${ANALYTICS_ID}"]`)) return;
  window.gtag("consent", "update", { analytics_storage: "granted" });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  document.head.append(script);
  window.gtag("js", new Date());
  window.gtag("config", ANALYTICS_ID, { anonymize_ip: true });
}

const consentBanner = document.querySelector("[data-consent-banner]");
const consent = localStorage.getItem("ut_consent");
if (consent === "analytics") enableAnalytics();
if (!consent && consentBanner) consentBanner.hidden = false;
document.querySelectorAll("[data-consent]").forEach(button => button.addEventListener("click", () => {
  const choice = button.dataset.consent;
  localStorage.setItem("ut_consent", choice);
  if (choice === "analytics") enableAnalytics();
  else window.gtag("consent", "update", { analytics_storage: "denied" });
  if (consentBanner) consentBanner.hidden = true;
}));
