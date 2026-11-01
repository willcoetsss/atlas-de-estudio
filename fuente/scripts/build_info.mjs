import fs from 'fs';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
const G = '/home/claude/geo/', B = G + 'build/', O = G + 'out/data/';
const wc = JSON.parse(fs.readFileSync(G + 'node_modules/world-countries/countries.json'));
const byA3 = Object.fromEntries(wc.map(c => [c.cca3, c]));
byA3.KOS = byA3.UNK; // Kosovo
const fichas = JSON.parse(fs.readFileSync(B + 'fichas.json'));
const ne = JSON.parse(fs.readFileSync(B + 'ne_meta.json'));
const cities = JSON.parse(fs.readFileSync(B + 'cities.json'));
const langs = JSON.parse(fs.readFileSync(B + 'langs.json'));
const topo = JSON.parse(fs.readFileSync(O + 'world.json'));
const ids = topo.objects.countries.geometries.map(g => g.id);
const lang = new Intl.DisplayNames(['es'], { type: 'language' });
const cur = new Intl.DisplayNames(['es'], { type: 'currency' });
const L3 = { spa: 'es', eng: 'en', fra: 'fr', deu: 'de', por: 'pt', ara: 'ar', rus: 'ru', zho: 'zh', ita: 'it', nld: 'nl', jpn: 'ja', kor: 'ko', hin: 'hi', tur: 'tr', pol: 'pl', ukr: 'uk', swe: 'sv', nor: 'no', nob: 'nb', nno: 'nn', fin: 'fi', dan: 'da', ell: 'el', heb: 'he', fas: 'fa', urd: 'ur', ben: 'bn', msa: 'ms', ind: 'id', tha: 'th', vie: 'vi', swa: 'sw', amh: 'am', som: 'so', hun: 'hu', ces: 'cs', slk: 'sk', slv: 'sl', hrv: 'hr', srp: 'sr', bos: 'bs', ron: 'ro', bul: 'bg', mkd: 'mk', sqi: 'sq', lit: 'lt', lav: 'lv', est: 'et', isl: 'is', gle: 'ga', mlt: 'mt', cat: 'ca', kaz: 'kk', uzb: 'uz', tuk: 'tk', kir: 'ky', tgk: 'tg', aze: 'az', hye: 'hy', kat: 'ka', mon: 'mn', nep: 'ne', sin: 'si', tam: 'ta', mya: 'my', khm: 'km', lao: 'lo', fil: 'fil', mlg: 'mg', kin: 'rw', run: 'rn', bel: 'be', ltz: 'lb', que: 'qu', aym: 'ay', grn: 'gn', pus: 'ps', prs: 'fa-AF', dzo: 'dz', div: 'dv', tet: 'tet', smo: 'sm', ton: 'to', fij: 'fj', mri: 'mi', hat: 'ht', pap: 'pap', zul: 'zu', xho: 'xh', afr: 'af', sot: 'st', tsn: 'tn', ssw: 'ss', nya: 'ny', sna: 'sn', nde: 'nd', tir: 'ti', kur: 'ku', bis: 'bi', her: 'hz', hmo: 'ho', tpi: 'tpi', gil: 'gil', mah: 'mh', nau: 'na', pau: 'pau', tvl: 'tvl', crs: 'crs', sag: 'sg', lin: 'ln', kon: 'kg', lua: 'lua', wol: 'wo', ful: 'ff', hau: 'ha', yor: 'yo', ibo: 'ig' };
const tl = (code, en) => { try { const t = lang.of(L3[code] || code); if (t && t !== code && t !== (L3[code] || code)) return t; } catch (e) { } return en; };
function region(c, id) {
  if (!c) return null;
  const s = c.subregion, r = c.region;
  if (r === 'Europe') return 'Europa';
  if (r === 'Africa') return 'África';
  if (r === 'Asia') return 'Asia';
  if (r === 'Oceania') return 'Oceanía';
  if (s === 'South America') return 'América del Sur';
  if (s === 'North America') return 'América del Norte';
  if (s === 'Central America' || s === 'Caribbean') return 'Centroamérica y Caribe';
  if (r === 'Antarctic') return 'Antártida';
  return null;
}
const info = {};
for (const id of ids) {
  const base = id.includes('-') ? id.split('-')[0] : id;
  const isFar = id.includes('-');
  const g = topo.objects.countries.geometries.find(x => x.id === id);
  const p = g.properties || {};
  const c = byA3[id] || (isFar ? null : byA3[base]);
  const f = fichas[id];
  const n = ne[id] || {};
  const e = { kind: p.kind, sov: p.sov };
  e.name = f ? f.n : (p.name || (c && c.translations.spa.common) || n.ne_name);
  if (c) {
    e.off = c.translations.spa.official;
    e.iso2 = c.cca2.toLowerCase(); e.n3 = c.ccn3;
    e.area = c.area;
    e.lang = Object.entries(c.languages || {}).map(([k, v]) => tl(k, v));
    e.cur = Object.entries(c.currencies || {}).map(([k, v]) => { let t = v.name; try { const x = cur.of(k); if (x && x !== k) t = x; } catch (er) { } return t + ' (' + k + ')'; });
    e.borders = (c.borders || []).map(b => b === 'UNK' ? 'KOS' : b);
    e.reg = region(c, id);
    e.sub = c.subregion;
    e.capEn = c.capital || [];
    e.alts = [c.name.common, c.name.official, ...(c.altSpellings || []).filter(a => a.length > 3)];
    e.ll = c.latlng;
  }
  if (langs[id]) { e.langN = langs[id][0]; e.langR = langs[id][1] || ''; delete e.lang; }
  if (id === 'KOS') e.iso2 = 'xk';
  if (id === 'FRA') e.off = 'República Francesa';
  if (id === 'BGR' && e.cur) e.cur = ['Euro (EUR), desde 2026'];
  if (n.lx != null) e.lab = [n.lx, n.ly, n.minlab];
  if (f) { Object.assign(e, { cap: f.cap, capn: f.capn, gov: f.gov, lead: f.lead, war: f.war, col: f.col, rel: f.rel, per: f.per, thing: f.thing, pop: f.pop }); e.alts = [...(f.alt ? f.alt.split('|') : []), ...(e.alts || []), n.ne_name].filter(Boolean); e.state = 1; }
  else if (n.pop) e.pop = +(n.pop / 1e6).toFixed(3);
  if (!e.cap && c && c.capital) e.cap = c.capital[0];
  const cc = cities[id] || cities[base];
  if (cc && !isFar) e.cities = cc.map(x => [x.n, x.x, x.y, x.cap, x.p]);
  if (id === 'ESH') { e.reg = 'África'; e.note = 'Territorio no autónomo pendiente de descolonización según la ONU. Marruecos controla ~80 %; el Frente Polisario y la RASD reclaman la independencia.'; }
  if (id === 'KAS') { e.name = 'Glaciar de Siachen'; e.note = 'Zona en disputa entre la India y Pakistán; la controla la India.'; }
  if (id === 'ATA') { e.name = 'Antártida'; e.reg = 'Antártida'; e.note = 'Continente sin soberanía efectiva: el Tratado Antártico (1959) congela las reclamaciones territoriales y lo reserva para la ciencia.'; }
  if (!e.reg && e.sov && info[e.sov]) e.reg = info[e.sov].reg;
  info[id] = e;
}
// second pass region for territories whose sovereign came later
for (const [id, e] of Object.entries(info)) if (!e.reg && byA3[e.sov]) e.reg = region(byA3[e.sov]);
// capitals in Spanish from NE populated places (only fill alt answers)
for (const [id, e] of Object.entries(info)) {
  if (!e.state) continue;
  const caps = (e.cities || []).filter(x => x[3] === 1).map(x => x[0]);
  e.capAlts = [...new Set([...(e.capEn || []), ...caps])].filter(x => x !== e.cap && x !== 'Johannesburgo');
  if (!caps.length && e.ll) { }
  // capital marker: prefer NE capital matching
  const cm = (e.cities || []).find(x => x[3] === 1 && (x[0] === e.cap || (e.capEn || []).includes(x[0])));
  e.capPt = cm ? [cm[1], cm[2]] : ((e.cities || []).find(x => x[3]) ? [(e.cities.find(x => x[3]))[1], (e.cities.find(x => x[3]))[2]] : null);
}
// flags
const flagDir = G + 'node_modules/flag-icons/flags/4x3/';
const flags = {};
const need = new Set(Object.values(info).map(e => e.iso2).filter(Boolean));
for (const k of need) { const p = flagDir + k + '.svg'; if (fs.existsSync(p)) flags[k] = fs.readFileSync(p, 'utf8').replace(/\s*\n\s*/g, ' '); else console.log('no flag', k); }
fs.writeFileSync(O + 'flags.json', JSON.stringify(flags));
// flag similarity
await initWasm(fs.readFileSync(G + 'node_modules/@resvg/resvg-wasm/index_bg.wasm'));
const vec = {};
for (const [k, svg] of Object.entries(flags)) {
  try {
    const r = new Resvg(svg, { fitTo: { mode: 'width', value: 24 } });
    const img = r.render(); const px = img.pixels; const v = [];
    for (let i = 0; i < px.length; i += 4) v.push(px[i], px[i + 1], px[i + 2]);
    vec[k] = v;
  } catch (er) { console.log('raster fail', k, er.message); }
}
const states = Object.entries(info).filter(([id, e]) => e.state && vec[e.iso2]);
for (const [id, e] of states) {
  const a = vec[e.iso2];
  const d = states.filter(([j]) => j !== id).map(([j, f]) => { const b = vec[f.iso2]; let s = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) { const t = a[i] - b[i]; s += t * t; } return [j, s]; }).sort((x, y) => x[1] - y[1]);
  e.flagSim = d.slice(0, 8).map(x => x[0]);
}
for (const e of Object.values(info)) { delete e.capEn; }
fs.writeFileSync(O + 'info.json', JSON.stringify(info));
console.log('info', Object.keys(info).length, 'flags', Object.keys(flags).length, (fs.statSync(O + 'flags.json').size / 1024 | 0) + 'KB', (fs.statSync(O + 'info.json').size / 1024 | 0) + 'KB');
console.log('TCD sim', info.TCD.flagSim, 'IDN', info.IDN.flagSim, 'IRL', info.IRL.flagSim);
console.log(info.ESP.lang, info.ESP.cur, info.JPN.lang, info.CHE.lang, info.ESP.capAlts, info.ESP.reg, info.GRL);
console.log('no reg', Object.entries(info).filter(([k, e]) => !e.reg).map(x => x[0]));
