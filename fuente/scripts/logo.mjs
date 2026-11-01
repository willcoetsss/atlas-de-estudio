import fs from 'fs'; import * as d3 from 'd3-geo'; import { feature } from 'topojson-client';
const t = JSON.parse(fs.readFileSync('/home/claude/geo/out/data/sphere110.json'));
const land = feature(t, t.objects.land);
const cx = 256, cy = 168, R = 128;
const proj = d3.geoOrthographic().scale(R).translate([cx, cy]).rotate([-15, -28]).clipAngle(90).precision(0.5);
const path = d3.geoPath(proj).digits(0);
const L = path(land), G = path(d3.geoGraticule().step([20, 20])()), S = path({ type: 'Sphere' });
// Titán arrodillado: pictograma de trazos gruesos
const fig = `
  <path d="M211 362 C224 350 288 350 301 362 L284 436 C272 446 240 446 228 436 Z"/>
  <circle cx="262" cy="326" r="27"/>
  <path d="M220 370 L170 338 L150 262" fill="none" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M292 370 L344 338 L364 262" fill="none" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M240 432 L196 486 L130 488" fill="none" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M272 432 L344 424 L350 490" fill="none" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M112 500 H402" fill="none" stroke-width="10" stroke-linecap="round"/>`;
const mk = ({ ink, ocean, landC, grat, bg }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg ? `<rect width="512" height="512" rx="96" fill="${bg}"/>` : ''}
<g fill="${ink}" stroke="${ink}">${fig}</g>
<path d="${S}" fill="${ocean}"/><path d="${G}" fill="none" stroke="${grat}" stroke-width="2.2"/><path d="${L}" fill="${landC}"/>
<path d="${S}" fill="none" stroke="${ink}" stroke-width="9"/></svg>`;
const cur = mk({ ink: 'currentColor', ocean: '#2d7fb5', landC: '#e9dcc0', grat: 'rgba(255,255,255,.45)' });
fs.writeFileSync('/home/claude/geo/logo/logo-current.svg', cur);
fs.writeFileSync('/home/claude/geo/logo/logo.svg', mk({ ink: '#16242f', ocean: '#2d7fb5', landC: '#e9dcc0', grat: 'rgba(255,255,255,.45)' }));
fs.writeFileSync('/home/claude/geo/logo/icon.svg', mk({ ink: '#16242f', ocean: '#2d7fb5', landC: '#e9dcc0', grat: 'rgba(255,255,255,.45)', bg: '#e9eef0' }));
console.log(cur.length);
