# Genera las imágenes para compartir (1200x630) de guías y categorías en src/public/og/.
# Lee los títulos de src/server.mjs. Uso: python3 scripts/og-images.py .
# Requiere Pillow y las fuentes Inter (InterDisplay-Bold) y DejaVu Sans Mono instaladas.
import json, re, sys, os, math
from PIL import Image, ImageDraw, ImageFont
root = sys.argv[1]
src = open(os.path.join(root, 'src/server.mjs'), encoding='utf-8').read()
cats = json.loads(re.search(r'const categoryDetails = (\{.*?\});', src, re.S).group(1))
gblock = src[src.index('const guides = {'):src.index('\n};', src.index('const guides = {'))]
guides = {k: json.loads(v) for k, v in re.findall(r'^\s*"([^"]+\.html)": (\[.*\]),?$', gblock, re.M)}
F = '/usr/share/fonts/opentype/inter/'
title_font = lambda size: ImageFont.truetype(F + 'InterDisplay-Bold.otf', size)
brand = ImageFont.truetype(F + 'InterDisplay-Bold.otf', 40)
mono = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 26) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf') else ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 26)
small = ImageFont.truetype(F + 'Inter-Medium.otf', 28)
BG, PANEL, EDGE, LIME, INK, MUTED = '#101419', '#181f26', '#303943', '#c7fa75', '#edf3f8', '#aab6c2'

def wrap(draw, text, font, width):
    words, lines, cur = text.replace(' en 3D', ' en\u00a03D').split(' '), [], ''
    for w in words:
        t = (cur + ' ' + w).strip(' ')
        if draw.textlength(t, font=font) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return [l.replace('\u00a0', ' ') for l in lines]

def make(kind, title, out):
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.rounded_rectangle([40, 40, W - 40, H - 40], radius=28, fill=PANEL, outline=EDGE, width=2)
    # trama diagonal lima, solo a la derecha (como el hero del sitio)
    pat = Image.new('L', (W, H), 0); pd = ImageDraw.Draw(pat)
    for x in range(-H, W + H, 40):
        pd.line([(x, 0), (x + H * math.tan(math.radians(30)), H)], fill=60, width=2)
        pd.line([(x, H), (x + H * math.tan(math.radians(30)), 0)], fill=60, width=2)
    mask = Image.linear_gradient('L').rotate(90).resize((W, H))  # 0 a la izquierda, 255 a la derecha
    mask = mask.point(lambda v: max(0, v - 110) * 2)
    from PIL import ImageChops
    pat = ImageChops.multiply(pat, mask)
    clip = Image.new('L', (W, H), 0); ImageDraw.Draw(clip).rounded_rectangle([42, 42, W - 42, H - 42], radius=26, fill=255)
    pat = ImageChops.multiply(pat, clip)
    im.paste(Image.new('RGB', (W, H), LIME), (0, 0), pat.point(lambda v: v * 0.55))
    d = ImageDraw.Draw(im)
    # marca
    d.rounded_rectangle([88, 86, 140, 138], radius=11, fill=LIME)
    w = d.textlength('U', font=brand); d.text((114 - w / 2, 88), 'U', font=brand, fill='#152011')
    d.text((158, 88), 'UtiliTools', font=brand, fill=INK)
    d.text((88, 196), kind, font=mono, fill=LIME)
    size = 76
    while True:
        f = title_font(size); lines = wrap(d, title, f, 860)
        if (len(lines) <= 3 and 246 + len(lines) * int(size * 1.08) <= 470) or size <= 48: break
        size -= 4
    y = 246
    for line in lines:
        d.text((86, y), line, font=f, fill=INK); y += int(size * 1.08)
    d.text((88, H - 116), 'utilitools.com.ar', font=small, fill=MUTED)
    im = im.quantize(colors=48, method=Image.Quantize.MEDIANCUT)
    os.makedirs(os.path.dirname(out), exist_ok=True); im.save(out, optimize=True)
    return os.path.getsize(out)

sizes = []
for f, (title, desc, *_) in guides.items():
    sizes.append(make('GUÍA', title, os.path.join(root, 'src/public/og/guias', f.replace('.html', '.png'))))
for path, (title, desc) in cats.items():
    slug = path.strip('/').split('/')[-1]
    sizes.append(make('CATEGORÍA', title, os.path.join(root, 'src/public/og/categorias', slug + '.png')))
print(len(sizes), 'imágenes · promedio', sum(sizes) // len(sizes) // 1024, 'KB · total', sum(sizes) // 1024, 'KB')
