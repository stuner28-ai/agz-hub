import { mkdir, rm, writeFile, cp, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE, TOOLS, GUIDES } from "./src/content.mjs";
import { renderHome, renderToolsIndex, renderToolPage, renderGuidesIndex, renderGuidePage, renderMethodology, renderAbout, renderPrivacy, renderTerms, renderContact, render404 } from "./src/templates.mjs";

const root = new URL(".", import.meta.url).pathname;
const out = join(root, "dist");
const contactEmail = process.env.PUBLIC_CONTACT_EMAIL || "";

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, "public"), out, { recursive: true });
await copyFile(join(root, "src", "calculators.mjs"), join(out, "assets", "calculators.js"));

async function writePage(path, html) {
  const directory = path === "/" ? out : join(out, path.replace(/^\//, ""));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "index.html"), html, "utf8");
}

await writePage("/", renderHome());
await writePage("/herramientas", renderToolsIndex());
for (const tool of TOOLS) await writePage(`/herramientas/${tool.slug}`, renderToolPage(tool));
await writePage("/guias", renderGuidesIndex());
for (const guide of GUIDES) await writePage(`/guias/${guide.slug}`, renderGuidePage(guide));
await writePage("/metodologia", renderMethodology());
await writePage("/equipo", renderAbout());
await writePage("/privacidad", renderPrivacy());
await writePage("/terminos", renderTerms());
await writePage("/contacto", renderContact(contactEmail));
await writeFile(join(out, "404.html"), render404(), "utf8");

const urls = ["/", "/herramientas", ...TOOLS.map(tool => `/herramientas/${tool.slug}`), "/guias", ...GUIDES.map(guide => `/guias/${guide.slug}`), "/metodologia", "/equipo", "/privacidad", "/terminos", "/contacto"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(path => `  <url><loc>${SITE.domain}${path === "/" ? "/" : path}</loc><lastmod>${SITE.updatedIso}</lastmod></url>`).join("\n")}\n</urlset>\n`;
await writeFile(join(out, "sitemap.xml"), sitemap, "utf8");

console.log(`Built ${urls.length} canonical pages in ${out}`);
