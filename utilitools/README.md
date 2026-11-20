# UtiliTools

Fuente del portal https://www.utilitools.com.ar/ (proyecto Vercel `utilitools-v2`, equipo `adg11`).

## Estructura

| Ruta | Qué es |
|---|---|
| `src/public/` | HTML, CSS, JavaScript e imágenes del sitio, como archivos normales. |
| `src/assets.manifest.json` | Qué ruta del sitio sirve cada archivo, en orden. Las imágenes van con `"encoding": "base64"`. |
| `src/server.mjs` | Código del servidor (búsqueda, miniaturas, medición, SEO, enrutado). `__ASSETS__` marca dónde se insertan los recursos. |
| `scripts/build.mjs` | Arma `api/portal.mjs` a partir de `src/`. |
| `api/portal.mjs` | **Archivo generado.** Es lo que corre en Vercel. No editarlo a mano. |
| `vercel.json`, `package.json` | Configuración de despliegue. |

Las rutas que terminan en `/` (por ejemplo `/acerca/`) se guardan como `index.html` dentro de su carpeta.

## Flujo de trabajo

```sh
# 1. Editar archivos en src/
# 2. Regenerar el bundle
node scripts/build.mjs
# 3. Verificar
node scripts/build.mjs --check
node --check api/portal.mjs
```

Para agregar una página o recurso nuevo, creá el archivo en `src/public/` y sumá su entrada en `src/assets.manifest.json`.

`package.json` no tiene script `build` a propósito: si lo tuviera, Vercel intentaría ejecutarlo al desplegar. El bundle se genera localmente y se sube ya armado.

## Imágenes para compartir

Cada guía y cada categoría tiene su imagen en `src/public/og/` (1200×630, PNG). Si cambiás un título o agregás una guía o categoría, regenerá las imágenes y sumá las nuevas al manifiesto:

```sh
python3 scripts/og-images.py .
node scripts/build.mjs
```

## Fuentes externas

El sitio **no consulta ni copia contenido de otras plataformas**: no hay búsqueda en línea, ni miniaturas, ni lectura de páginas ajenas. Solo enlaza a las fichas y a las búsquedas de cada sitio.

- Printables (Prusa): las condiciones generales (art. 9.1, vigentes desde el 20/04/2026) prohíben la extracción manual o automatizada del contenido. Volver a mostrar resultados requiere permiso escrito de Prusa.
- Cults3D: su página "no-ai" prohíbe scrapear, bajar o copiar imágenes y textos sin permiso del autor. Alternativa: su API oficial con clave.
- Thingiverse: sus términos de uso (3.3(b)(vi) y (vii)) prohíben el scraping y la agregación sistemática con fines comerciales sin permiso escrito. Alternativa: su API con token, con resultados separados y atribuidos.
- Shapekit: no publica términos; sus modelos son CC BY-NC 4.0.

Antes de volver a mostrar fotos o resultados de cualquier fuente, revisar sus condiciones y usar solo una API oficial o un permiso escrito.

## Despliegue

Solo se suben `api/portal.mjs`, `package.json` y `vercel.json` (ver `.vercelignore`). Primero preview, producción solo con aprobación de Alan.

Antes de publicar, revisar portada, búsqueda con imágenes, calculadora e importación de G-code, subdominios (`calculadora.`, `perfiles.`, `guias.`), categorías, `/robots.txt`, `/sitemap.xml` y `/ads.txt`.

## Línea base

El primer commit de esta carpeta genera un `api/portal.mjs` idéntico byte a byte al despliegue productivo `dpl_DSqvmc8KZWx4ND8g3nTE2Hvwvq8r` (SHA-1 `2d9666810d7619a4fe3dbd9f27f24f773bfa22e5`). Despliegue anterior para rollback: `dpl_HwgdBB9pHxvDiUaxFez4ndKH7BFE`.
