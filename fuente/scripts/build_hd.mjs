// Contornos detallados (Natural Earth 1:10m): un archivo por país en data/hd/<id>.json.
// Se simplifica todo junto (respetando la topología, para que las fronteras compartidas coincidan),
// se proyecta igual que el mapa general y se cuantiza con una rejilla común a todos los archivos.
import fs from 'fs';
import mapshaper from 'mapshaper';
import * as d3 from 'd3-geo';
import { geoProject } from 'd3-geo-projection';
import { topology } from 'topojson-server';
const B = '/home/claude/geo/build/', O = '/home/claude/geo/out/data/hd/';
const INTERVAL = process.argv[2] || '350';
fs.rmSync(O, { recursive: true, force: true }); fs.mkdirSync(O, { recursive: true });
const P = JSON.parse(fs.readFileSync(B + 'world_params.json'));
const proj = d3.geoEqualEarth().scale(P.S).translate([P.W / 2, P.H / 2]);
const input = { 'c.json': fs.readFileSync(B + 'countries_hd_ll.geojson', 'utf8') };
const out = await mapshaper.applyCommands(`-i c.json -simplify interval=${INTERVAL} keep-shapes -o c_s.json format=geojson`, input);
const gj = JSON.parse(out['c_s.json']);
const rev = g => { if (g.type === 'Polygon') g.coordinates.forEach(r => r.reverse()); else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(r => r.reverse())); };
for (const f of gj.features) if (f.geometry && d3.geoArea(f) > 2 * Math.PI) rev(f.geometry);
const pj = geoProject(gj, proj);
pj.features.forEach(f => { f.id = f.properties.id; f.properties = {}; });
// rejilla común: extensión fija del mapa
const Q = 400000;
const kx = P.W / (Q - 1), ky = P.H / (Q - 1);
const t = topology({ c: pj }, null);
// cuantiza a mano con la transformación global y codifica en deltas
const qa = t.arcs.map(a => { let px = 0, py = 0; const o = []; for (const [x, y] of a) { const qx = Math.round(x / kx), qy = Math.round(y / ky); if (o.length && qx === px && qy === py) continue; o.push(o.length ? [qx - px, qy - py] : [qx, qy]); px = qx; py = qy; } if (o.length === 1) o.push([0, 0]); return o; });
let total = 0, pts = 0;
for (const g of t.objects.c.geometries) {
  if (!g.arcs) continue;
  const used = new Map(); const remap = i => { const neg = i < 0, k = neg ? ~i : i; if (!used.has(k)) used.set(k, used.size); const n = used.get(k); return neg ? ~n : n; };
  const walk = a => typeof a === 'number' ? remap(a) : a.map(walk);
  const geom = { type: g.type, id: g.id, arcs: walk(g.arcs) };
  const arcs = [...used.keys()].map(k => qa[k]); pts += arcs.reduce((s, a) => s + a.length, 0);
  const sub = { type: 'Topology', transform: { scale: [kx, ky], translate: [0, 0] }, objects: { c: { type: 'GeometryCollection', geometries: [geom] } }, arcs };
  const s = JSON.stringify(sub); total += s.length;
  fs.writeFileSync(O + g.id + '.json', s);
}
console.log('interval', INTERVAL, 'files', t.objects.c.geometries.length, 'total', (total / 1048576).toFixed(2), 'MB', 'points', pts);
