import json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pyproj import Proj
Image.MAX_IMAGE_PIXELS = None
D = '/home/claude/geo/dl/'; O = '/home/claude/geo/out/relief/'
import os; os.makedirs(O, exist_ok=True)
P = json.load(open('/home/claude/geo/build/world_params.json'))
W, S, H = P['W'], P['S'], P['H']

sh = Image.open(D + 'rast/shadedrelief.jpg').convert('RGB')          # 10800x5400
SW, SH = sh.size
et = Image.open(D + 'rast/etopo1.jpg').convert('RGB').resize((SW, SH), Image.BILINEAR)

# land mask
mask = Image.new('L', (SW, SH), 0); dr = ImageDraw.Draw(mask)
def px(c): return [((x + 180) / 360 * SW, (90 - y) / 180 * SH) for x, y in c]
for f in json.load(open(D + 'ne_10m_land.geojson'))['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        dr.polygon(px(poly[0]), fill=255)
        for hole in poly[1:]: dr.polygon(px(hole), fill=0)
mask = mask.filter(ImageFilter.GaussianBlur(1.2))

e = np.asarray(et.filter(ImageFilter.GaussianBlur(5))).astype(np.float32)
lum = 0.3 * e[..., 0] + 0.59 * e[..., 1] + 0.11 * e[..., 2]
d = np.clip((lum - 60) / (185 - 60), 0, 1)               # 1 = shallow, 0 = deep
d = 0.15 + 0.85 * d ** 0.9
shallow = np.array([206, 228, 240], np.float32); mid = np.array([160, 198, 224], np.float32); deep = np.array([104, 150, 194], np.float32)
t = d[..., None]
ocean = np.where(t > 0.5, mid + (shallow - mid) * ((t - 0.5) * 2), deep + (mid - deep) * (t * 2))
land = np.asarray(sh).astype(np.float32)
m = (np.asarray(mask).astype(np.float32) / 255)[..., None]
comp = land * m + ocean * (1 - m)
comp = np.clip(comp, 0, 255).astype(np.uint8)
src = comp
print('composite ready')

# reproject to Equal Earth, output width OW
p = Proj('+proj=eqearth +R=1 +lon_0=0')
def render(OW):
    OH = int(round(OW * H / W)); k = OW / W
    out = np.zeros((OH, OW, 3), np.uint8); out[:] = (200, 214, 224)
    xs = (np.arange(OW) + 0.5) / k
    for r0 in range(0, OH, 256):
        r1 = min(OH, r0 + 256)
        ys = (np.arange(r0, r1) + 0.5) / k
        X, Y = np.meshgrid(xs, ys)
        rx = (X - W / 2) / S; ry = -(Y - H / 2) / S
        lon, lat = p(rx, ry, inverse=True)
        ok = np.isfinite(lon) & (np.abs(lon) <= 180) & (np.abs(lat) <= 90)
        bx, by = p(np.where(ok, lon, 0), np.where(ok, lat, 0))
        ok &= (np.abs(bx - rx) < 1e-6) & (np.abs(by - ry) < 1e-6)
        lon = np.where(ok, lon, 0); lat = np.where(ok, lat, 0)
        fx = (lon + 180) / 360 * SW - 0.5; fy = (90 - lat) / 180 * SH - 0.5
        x0 = np.clip(np.floor(fx).astype(int), 0, SW - 1); y0 = np.clip(np.floor(fy).astype(int), 0, SH - 1)
        x1 = np.clip(x0 + 1, 0, SW - 1); y1 = np.clip(y0 + 1, 0, SH - 1)
        ax = (fx - np.floor(fx))[..., None]; ay = (fy - np.floor(fy))[..., None]
        v = (src[y0, x0] * (1 - ax) * (1 - ay) + src[y0, x1] * ax * (1 - ay) + src[y1, x0] * (1 - ax) * ay + src[y1, x1] * ax * ay)
        blk = out[r0:r1]; blk[ok] = v[ok].astype(np.uint8)
    return Image.fromarray(out)

lo = render(2048); lo.save(O + 'relief_lo.jpg', quality=84, optimize=True, progressive=True)
hi = render(8192)
TW, TH = 1024, int(np.ceil(hi.size[1] / 4))
for j in range(4):
    for i in range(8):
        hi.crop((i * TW, j * TH, (i + 1) * TW, min(hi.size[1], (j + 1) * TH))).save(O + f'r_{i}_{j}.jpg', quality=80, optimize=True, progressive=True)
print('tiles', TW, TH, hi.size)
json.dump({'tw': TW, 'th': TH, 'w': hi.size[0], 'h': hi.size[1]}, open('/home/claude/geo/build/relief_meta.json', 'w'))
