// Genera api/portal.mjs a partir de src/.
//   node scripts/build.mjs          escribe api/portal.mjs
//   node scripts/build.mjs --check  falla si api/portal.mjs no coincide con src/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const output = join(root, 'api', 'portal.mjs');

const manifest = JSON.parse(readFileSync(join(src, 'assets.manifest.json'), 'utf8'));
const assets = {};
for (const { route, file, encoding } of manifest) {
  if (Object.hasOwn(assets, route)) throw new Error('Ruta duplicada en el manifiesto: ' + route);
  const path = join(src, 'public', file);
  assets[route] = encoding === 'base64'
    ? readFileSync(path).toString('base64')
    : readFileSync(path, 'utf8');
}

const server = readFileSync(join(src, 'server.mjs'), 'utf8');
const marker = '__ASSETS__';
if (server.split(marker).length !== 2) throw new Error('src/server.mjs debe contener ' + marker + ' una sola vez');
const bundle = server.replace(marker, () => JSON.stringify(assets));
const sha1 = createHash('sha1').update(bundle).digest('hex');

if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(output, 'utf8'); } catch {}
  if (current !== bundle) {
    console.error('api/portal.mjs está desactualizado. Ejecutá: node scripts/build.mjs');
    process.exit(1);
  }
  console.log('api/portal.mjs al día · sha1 ' + sha1);
} else {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, bundle);
  console.log('api/portal.mjs generado · ' + manifest.length + ' recursos · ' + bundle.length + ' bytes · sha1 ' + sha1);
}
