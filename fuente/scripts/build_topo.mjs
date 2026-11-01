import fs from 'fs';
import mapshaper from 'mapshaper';
import * as d3 from 'd3-geo';
import { geoProject } from 'd3-geo-projection';
import { topology } from 'topojson-server';
import { quantize } from 'topojson-client';

const B = '/home/claude/geo/build/', O = '/home/claude/geo/out/data/';
fs.mkdirSync(O, { recursive: true });
const raw = d3.geoEqualEarthRaw;
const XMAX = raw(Math.PI, 0)[0], YMAX = raw(0, Math.PI / 2)[1];
const W = 2000, S = (W / 2) / XMAX, H = 2 * YMAX * S;
const proj = d3.geoEqualEarth().scale(S).translate([W / 2, H / 2]);
fs.writeFileSync(B + 'world_params.json', JSON.stringify({ W, S, H, XMAX, YMAX }));
console.log({ W, S, H });

async function simplify(name, pct, extra = '') {
  const input = { [name + '.json']: fs.readFileSync(B + name + '_ll.geojson', 'utf8') };
  const cmd = `-i ${name}.json -simplify ${pct}% weighted keep-shapes ${extra} -o ${name}_s.json format=geojson`;
  const out = await mapshaper.applyCommands(cmd, input);
  return JSON.parse(out[name + '_s.json']);
}
function project(gj) {
  const p = geoProject(gj, proj);
  // round to 0.01 units
  return p;
}
function area(f) { return d3.geoArea(f); }

const layers = {};
async function go() {
  const spec = [['countries', 30], ['extra', 25], ['marine', 8], ['regions', 15], ['lakes', 35], ['rivers', 45]];
  for (const [n, pct] of spec) {
    const src = n === 'countries' ? 'countries' : n;

    const s = await simplify(src, pct);
    // sanity: spherical area of polygons must be < 2π
    let bad = 0;
    const rev = g => { if (g.type === 'Polygon') g.coordinates.forEach(r => r.reverse()); else if (g.type === 'MultiPolygon') g.coordinates.forEach(p => p.forEach(r => r.reverse())); };
    for (const f of s.features) if (f.geometry && /Polygon/.test(f.geometry.type) && area(f) > 2 * Math.PI) { rev(f.geometry); if (area(f) > 2 * Math.PI) bad++; }
    console.log(n, s.features.length, 'bad winding', bad);
    layers[n] = project(s);
  }
  // label geometry for rivers & regions
  const lab = {};
  for (const f of layers.rivers.features) {
    if (!f.geometry) continue;
    const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let best = null, bl = 0;
    for (const l of lines) { let len = 0; for (let i = 1; i < l.length; i++) len += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); if (len > bl) { bl = len; best = l; } }
    if (!best) continue;
    let half = bl / 2, acc = 0, pt = best[0], ang = 0;
    for (let i = 1; i < best.length; i++) { const d = Math.hypot(best[i][0] - best[i - 1][0], best[i][1] - best[i - 1][1]); if (acc + d >= half) { const t = (half - acc) / d; pt = [best[i - 1][0] + t * (best[i][0] - best[i - 1][0]), best[i - 1][1] + t * (best[i][1] - best[i - 1][1])];
        // angle over a wider window
        const a = best[Math.max(0, i - 4)], b = best[Math.min(best.length - 1, i + 3)]; ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; break; } acc += d; }
    if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    lab[f.properties.id] = { x: +pt[0].toFixed(2), y: +pt[1].toFixed(2), a: +ang.toFixed(1), len: +bl.toFixed(1) };
  }
  for (const f of layers.regions.features) {
    if (!f.geometry) continue;
    const pts = []; const walk = c => typeof c[0] === 'number' ? pts.push(c) : c.forEach(walk); walk(f.geometry.coordinates);
    let mx = 0, my = 0; pts.forEach(p => { mx += p[0]; my += p[1]; }); mx /= pts.length; my /= pts.length;
    let sxx = 0, syy = 0, sxy = 0; pts.forEach(p => { const dx = p[0] - mx, dy = p[1] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    let ang = 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI;
    const l1 = (sxx + syy) / 2 + Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy), l2 = (sxx + syy) / 2 - Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
    const elong = Math.sqrt(l1 / Math.max(l2, 1e-9));
    if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
    const b = d3.geoPath().bounds ? null : null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; pts.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    lab[f.properties.id] = { a: elong > 2.2 ? +ang.toFixed(1) : 0, len: +Math.hypot(x1 - x0, y1 - y0).toFixed(1) };
  }
  fs.writeFileSync(B + 'labels.json', JSON.stringify(lab));

  const mk = (objs, q) => { const t = topology(objs, q); return t; };
  const strip = gj => { gj.features.forEach(f => { f.id = f.properties.id; f.properties = Object.fromEntries(Object.entries(f.properties).filter(([k]) => k !== 'id')); if (!Object.keys(f.properties).length) delete f.properties; }); return gj; };
  const world = mk({ countries: strip(layers.countries), extra: strip(layers.extra) }, 1e5);
  fs.writeFileSync(O + 'world.json', JSON.stringify(world));
  const phys = mk({ marine: strip(layers.marine), regions: strip(layers.regions), lakes: strip(layers.lakes), rivers: strip(layers.rivers) }, 6e4);
  fs.writeFileSync(O + 'phys_geo.json', JSON.stringify(phys));
  for (const f of ['world.json', 'phys_geo.json']) console.log(f, (fs.statSync(O + f).size / 1024).toFixed(0), 'KB');
}
go();
