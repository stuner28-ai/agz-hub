import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import assert from "node:assert/strict";

const root = new URL("./dist", import.meta.url).pathname;
const htmlFiles = [];

async function walk(directory) {
  for (const name of await readdir(directory)) {
    const path = join(directory, name);
    const info = await stat(path);
    if (info.isDirectory()) await walk(path);
    else if (name.endsWith(".html")) htmlFiles.push(path);
  }
}

await walk(root);
assert.ok(htmlFiles.length >= 20, `Se esperaban al menos 20 páginas HTML y hay ${htmlFiles.length}`);

const knownRoutes = new Set(htmlFiles.map(file => {
  const route = `/${relative(root, file).replaceAll("\\", "/")}`;
  if (route === "/index.html") return "/";
  if (route.endsWith("/index.html")) return route.slice(0, -11);
  return route;
}));

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const label = relative(root, file);
  assert.match(html, /<html lang="es-AR">/, `${label}: falta lang es-AR`);
  assert.equal((html.match(/<title>/g) || []).length, 1, `${label}: title inválido`);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, `${label}: canonical inválido`);
  assert.ok(!html.includes("AdSense Banner"), `${label}: conserva un anuncio simulado`);
  assert.ok(!html.includes("Visitas Totales"), `${label}: conserva contador de visitas`);
  assert.ok(!html.includes("pagead2.googlesyndication.com/pagead/js"), `${label}: carga AdSense antes de aprobación`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  for (const match of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = match[1];
    if (href.startsWith("/assets/") || href === "/manifest.webmanifest" || href === "/sitemap.xml") continue;
    assert.ok(knownRoutes.has(href) || href === "/", `${label}: enlace interno inexistente ${href}`);
  }
}

const toolFiles = htmlFiles.filter(file => file.includes("/herramientas/") && !file.endsWith("/herramientas/index.html"));
for (const file of toolFiles) {
  const html = await readFile(file, "utf8");
  const visibleText = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  assert.ok(visibleText.split(" ").length >= 430, `${relative(root, file)}: contenido demasiado breve`);
  assert.match(html, /FAQPage/, `${relative(root, file)}: falta FAQ estructurada`);
  assert.match(html, /WebApplication/, `${relative(root, file)}: falta WebApplication estructurada`);
}

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
assert.ok((sitemap.match(/<url>/g) || []).length >= 20, "Sitemap incompleto");
assert.ok(!sitemap.includes(".html</loc>"), "Sitemap contiene URLs heredadas duplicadas");

const home = await readFile(join(root, "index.html"), "utf8");
assert.ok(home.includes("El copiloto del bolsillo argentino"), "La portada perdió el posicionamiento principal");
assert.ok(home.includes("href=\"/herramientas/descuentos\""), "La portada no conduce a Compra inteligente");

const toolsIndex = await readFile(join(root, "herramientas", "index.html"), "utf8");
for (const focus of ["ahorrar", "emprender", "trabajar"]) assert.ok(toolsIndex.includes(`id="${focus}"`), `Falta el foco ${focus} en herramientas`);

const smartBuy = await readFile(join(root, "herramientas", "descuentos", "index.html"), "utf8");
assert.ok(smartBuy.includes('data-calculator="smart-buy"'), "Compra inteligente no está conectada al calculador");
assert.ok(smartBuy.includes('data-show-when="promoA:percent,second-unit"'), "Compra inteligente perdió los campos condicionales");
assert.ok(smartBuy.includes("Resolución 4/2025"), "Compra inteligente no muestra la fuente oficial");

const contact = await readFile(join(root, "contacto", "index.html"), "utf8");
if (process.env.PUBLIC_CONTACT_EMAIL) {
  assert.ok(contact.includes(`href="mailto:${process.env.PUBLIC_CONTACT_EMAIL}?subject=`), "Contacto no tiene el correo público esperado");
  assert.ok(!contact.includes("Canal público en configuración"), "Contacto todavía parece incompleto");
} else {
  assert.ok(contact.includes("Canal público en configuración"), "El build sin correo no explica el estado del canal");
}

console.log(`QA OK: ${htmlFiles.length} HTML, ${toolFiles.length} herramientas, enlaces y metadatos verificados.`);
