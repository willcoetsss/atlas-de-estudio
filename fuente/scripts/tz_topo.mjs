import fs from 'fs'; import mapshaper from 'mapshaper'; import * as d3 from 'd3-geo';
const B='/home/claude/geo/build/', O='/home/claude/geo/out/data/';
const out = await mapshaper.applyCommands('-i tz.json -simplify 6% weighted keep-shapes -o tz_s.json format=topojson quantization=40000', {'tz.json': fs.readFileSync(B+'tz_ll.geojson','utf8')});
const t = JSON.parse(out['tz_s.json']);
// orientación compatible con d3 (anillos exteriores en sentido horario)
const tc = await import('topojson-client');
let bad=0; for (const f of tc.feature(t, t.objects[Object.keys(t.objects)[0]]).features) if (d3.geoArea(f) > 2*Math.PI) bad++;
console.log('objects', Object.keys(t.objects), 'bad', bad);
fs.writeFileSync(O+'tz.json', JSON.stringify(t)); console.log((fs.statSync(O+'tz.json').size/1024|0)+'KB');
