'use strict';
/* ============ utilidades ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ART = /^(el|la|los|las|the|l)\s+/;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’`´.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(ART, '');
function lev(a, b) {
  if (a === b) return 0; const m = a.length, n = b.length; if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, i) => i), cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) { cur[0] = i; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); [prev, cur] = [cur, prev]; }
  return prev[n];
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const uniq = a => [...new Set(a)];
const nf = new Intl.NumberFormat('es-ES');
function fmtPop(m) { if (m == null) return '—'; if (m >= 1) return (m >= 100 ? nf.format(Math.round(m)) : nf.format(+m.toFixed(1))) + ' millones'; return nf.format(Math.round(m * 1e6)) + ' hab.'; }
const fmtArea = a => a ? nf.format(Math.round(a)) + ' km²' : '—';
const verif = s => esc(s).replace(/\s*\(verificar[^)]*\)/g, ' <span class="chk" title="Dato muy reciente o cambiante: compruébalo">verificar</span>');
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
const now = () => Date.now();
const isSheet = () => matchMedia('(max-width:820px) and (orientation:portrait)').matches;
const isLandPhone = () => matchMedia('(max-height:540px) and (orientation:landscape)').matches;
const isMobile = () => isSheet() || isLandPhone();
function toast(msg, ms = 1800) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
const REF_DATE = 'junio de 2026';
const REGIONS = ['Europa', 'África', 'Asia', 'América del Norte', 'Centroamérica y Caribe', 'América del Sur', 'Oceanía'];

/* ============ datos ============ */
const D = {};
async function loadData() {
  const get = p => fetch(p).then(r => { if (!r.ok) throw new Error('No se pudo cargar ' + p); return r.json(); });
  const [params, world, info, flags, special, phys, physGeo, sphere] = await Promise.all(
    ['params', 'world', 'info', 'flags', 'special', 'phys', 'phys_geo', 'sphere110'].map(n => get('data/' + n + '.json')));
  Object.assign(D, { params, world, info, flags, special, phys, physGeo, sphere });
  D.W = params.W; D.H = params.H;
  D.proj = d3.geoEqualEarth().scale(params.S).translate([D.W / 2, D.H / 2]);
  D.path = d3.geoPath();               // geometrías ya proyectadas
  D.ppath = d3.geoPath(D.proj);        // geometrías en lon/lat
  D.cfeat = topojson.feature(world, world.objects.countries).features;
  D.byId = Object.fromEntries(D.cfeat.map(f => [f.id, f]));
  D.extra = Object.fromEntries(topojson.feature(world, world.objects.extra).features.map(f => [f.id, f]));
  D.states = Object.keys(info).filter(id => info[id].state).sort((a, b) => info[a].name.localeCompare(info[b].name, 'es'));
  // partes de cada país: principal + lejanas + territorios
  D.parts = {};
  for (const f of D.cfeat) { const p = f.properties || {}; if (p.kind === 'far' || p.kind === 'territory') (D.parts[p.sov] = D.parts[p.sov] || []).push(f.id); }
  // colores políticos (coloreado voraz por vecindad)
  const geoms = world.objects.countries.geometries, nb = topojson.neighbors(geoms);
  const col = {}; const order = D.cfeat.map((f, i) => i).sort((a, b) => D.path.area(D.cfeat[b]) - D.path.area(D.cfeat[a]));
  for (const i of order) { const f = D.cfeat[i], p = f.properties || {}; if (p.kind === 'far' || p.kind === 'territory') continue; const used = new Set(nb[i].map(j => col[D.cfeat[j].id])); let c = 1; while (used.has(c) && c < 6) c++; col[f.id] = c; }
  for (const f of D.cfeat) { const p = f.properties || {}; if (!col[f.id]) col[f.id] = col[p.sov] || 6; }
  D.color = col;
  // bounding boxes y diminutos
  D.bbox = {}; D.tiny = [];
  for (const f of D.cfeat) { const b = D.path.bounds(f); D.bbox[f.id] = b; const diag = Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]); f.diag = diag; }
  D.tinySet = new Set();
  for (const f of D.cfeat) { if (f.diag < 7 && f.id !== 'ATA') { const i = info[f.id]; const lab = i && i.lab ? D.proj([i.lab[0], i.lab[1]]) : D.path.centroid(largestPoly(f)); D.tiny.push({ id: f.id, x: lab[0], y: lab[1], diag: f.diag }); D.tinySet.add(f.id); } }
  // índice de nombres para búsqueda
  D.searchIdx = Object.entries(info).filter(([id, e]) => !id.includes('-') || true).map(([id, e]) => ({ id, name: e.name, n: norm(e.name), alts: uniq((e.alts || []).map(norm)) }));
  // físico
  D.pitems = phys.items; D.pidx = phys.idx;
  D.pgeo = {};
  for (const o of ['marine', 'regions', 'lakes', 'rivers']) for (const f of topojson.feature(physGeo, physGeo.objects[o]).features) D.pgeo[f.id] = f;
  D.pRev = {}; // rasgo -> países
  for (const [cid, list] of Object.entries(D.pidx)) { const sov = baseId(cid); for (const fid of list) (D.pRev[fid] = D.pRev[fid] || new Set()).add(sov); }
}
function largestPoly(f) {
  const g = f.geometry; if (!g || g.type !== 'MultiPolygon') return f;
  let best = null, ba = -1; for (const c of g.coordinates) { const p = { type: 'Polygon', coordinates: c }; const a = D.path.area(p); if (a > ba) { ba = a; best = p; } } return best;
}
function baseId(id) { const f = D.byId[id]; const p = f && f.properties || {}; if (p.kind === 'far') return p.sov; return id; }
function geoRef(ref) { if (ref.startsWith('c:')) return D.byId[ref.slice(2)]; return D.extra[ref]; }
function flagSvg(id) { const e = D.info[id]; return e && e.iso2 && D.flags[e.iso2] ? D.flags[e.iso2] : '<svg viewBox="0 0 4 3"><rect width="4" height="3" fill="#ccc"/></svg>'; }
const _fr = {};
function flagRatio(id) { const e = D.info[id]; const k = e && e.iso2; if (!k || !D.flags[k]) return 4 / 3; if (_fr[k]) return _fr[k]; const m = D.flags[k].match(/viewBox="([^"]+)"/); let r = 4 / 3; if (m) { const v = m[1].trim().split(/[\s,]+/).map(Number); if (v[2] > 0 && v[3] > 0) r = v[2] / v[3]; } return (_fr[k] = r); }
function flagBox(id, h, cls = '') { const r = flagRatio(id); return `<span class="flagf ${cls}" style="aspect-ratio:${r.toFixed(4)};width:min(100%,${Math.round(h * r)}px)">${flagSvg(id)}</span>`; }
function flagUrl(id) { const s = flagSvg(id); return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); }
function nameOf(id) { const e = D.info[id]; return e ? e.name : id; }
function unionBounds(ids) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const id of ids) { const b = D.bbox[id]; if (!b) continue; x0 = Math.min(x0, b[0][0]); y0 = Math.min(y0, b[0][1]); x1 = Math.max(x1, b[1][0]); y1 = Math.max(y1, b[1][1]); }
  return [[x0, y0], [x1, y1]];
}
function boundsOf(feats) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of feats) { if (!f) continue; const b = D.path.bounds(f); if (!isFinite(b[0][0])) continue; x0 = Math.min(x0, b[0][0]); y0 = Math.min(y0, b[0][1]); x1 = Math.max(x1, b[1][0]); y1 = Math.max(y1, b[1][1]); }
  return [[x0, y0], [x1, y1]];
}
/* encuadre del país "propio" (sin territorios muy lejanos que distorsionan) */
function homeBounds(id) {
  const f = D.byId[id]; if (!f) return null;
  if (f.geometry && f.geometry.type === 'MultiPolygon') {
    // descarta islas muy lejanas y diminutas respecto del polígono mayor
    const polys = f.geometry.coordinates.map(c => ({ type: 'Polygon', coordinates: c })).map(p => ({ p, a: D.path.area(p), c: D.path.centroid(p) }));
    const big = polys.reduce((a, b) => a.a > b.a ? a : b);
    const keep = polys.filter(q => q.a > big.a * 0.02 || Math.hypot(q.c[0] - big.c[0], q.c[1] - big.c[1]) < 60);
    return boundsOf(keep.map(q => q.p));
  }
  return D.bbox[id];
}

/* ============ contornos detallados (1:10m) bajo demanda ============ */
// El mapa general usa contornos simplificados. Al acercarse, cada país visible se sustituye por su
// versión detallada (data/hd/<id>.json); al volver a la vista del mundo se recupera la ligera.
const HD = {
  geo: {}, lo: {}, hb: {}, on: new Set(), prom: {}, IN: 2.4, OUT: 1.7,
  load(id) {
    if (this.geo[id]) return Promise.resolve(this.geo[id]);
    if (this.prom[id]) return this.prom[id];
    return this.prom[id] = fetch('data/hd/' + id + '.json').then(r => r.ok ? r.json() : null).then(t => {
      if (!t) return null; const f = topojson.feature(t, t.objects.c); const g = f.geometry || (f.features && f.features[0] && f.features[0].geometry); return (this.geo[id] = g || null);
    }).catch(() => null);
  },
  set(id, hd) {
    const f = D.byId[id]; if (!f) return false;
    if (!this.lo[id]) this.lo[id] = f.geometry;
    const g = hd ? this.geo[id] : this.lo[id]; if (!g || f.geometry === g) return false;
    f.geometry = g; if (hd) this.on.add(id); else this.on.delete(id); return true;
  },
  visible() {
    const x0 = MAP.t.invertX(0), x1 = MAP.t.invertX(MAP.vw), y0 = MAP.t.invertY(0), y1 = MAP.t.invertY(MAP.vh);
    const hit = b => b && b[1][0] > x0 && b[0][0] < x1 && b[1][1] > y0 && b[0][1] < y1;
    return D.cfeat.filter(f => { const b = D.bbox[f.id]; if (!hit(b)) return false; if (b[1][0] - b[0][0] < D.W * 0.4) return true; const h = this.hb[f.id] || (this.hb[f.id] = homeBounds(f.id)); return hit(h); }).map(f => f.id);
  },
  // se llama al terminar cada gesto; espera un poco por si viene otro y no trabaja mientras el mapa se mueve
  update() { clearTimeout(this._t); this._t = setTimeout(() => this.run(), MAP.fast ? 220 : 60); },
  async run() {
    if (MAP._moving) return;
    const r = MAP.rel();
    if (r < this.OUT) return this.queue([...this.on].map(id => [id, false]));
    if (r < this.IN) return;
    const ids = this.visible();
    // primero los más pequeños: llegan antes y apenas cuestan
    await Promise.all(ids.map(id => this.load(id)));
    if (MAP._moving || MAP.rel() < this.OUT) return;
    this.queue(ids.filter(id => this.geo[id] && D.byId[id].geometry !== this.geo[id]).map(id => [id, true]));
  },
  // cambia los contornos de uno en uno, cada uno en su propio fotograma, para no bloquear la pantalla
  queue(jobs) {
    this.jobs = jobs; if (this._raf) return;
    const step = () => {
      this._raf = null; if (MAP._moving || !this.jobs.length) return;
      const t0 = performance.now(), done = new Set();
      while (this.jobs.length && performance.now() - t0 < 12) { const [id, hd] = this.jobs.shift(); if (this.set(id, hd)) { this.draw(id); done.add(id); } }
      if (done.size) MAP.emit('hd', done);
      if (this.jobs.length) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  },
  draw(id) {
    const d = D.path(D.byId[id]);
    MAP.cty.filter(x => x.id === id).attr('d', d);
    // contornos de resaltado que siguen a un país concreto
    MAP.gz.selectAll(`[data-hd="${id}"]`).attr('d', d);
  },
  // geometría con el máximo detalle disponible, sin tocar el mapa (siluetas, juegos)
  async best(id) { await this.load(id); return this.geo[id] || (this.lo[id] || D.byId[id].geometry); }
};

/* ============ memoria de aprendizaje (repetición espaciada) ============ */
const INTERVALS_MIN = [1, 10, 60 * 24, 60 * 24 * 3, 60 * 24 * 8, 60 * 24 * 21, 60 * 24 * 60];
const LEVELS = [{ n: 'Nuevo', c: 'var(--m0)' }, { n: 'Aprendiendo', c: 'var(--m1)' }, { n: 'Repasando', c: 'var(--m2)' }, { n: 'Dominado', c: 'var(--m4)' }];
const STORE = {
  key: 'atlas-estudio-v1',
  d: { v: 1, items: {}, days: [], tot: { n: 0, ok: 0 }, set: {} },
  load() { const s = lsGet(this.key); if (s) { try { const x = JSON.parse(s); if (x && x.items) this.d = Object.assign(this.d, x); } catch (e) { } } },
  saveLocal() { lsSet(this.key, JSON.stringify(this.d)); },
  save() { this.saveLocal(); REMOTE.schedule(); },
  rec(key) { return this.d.items[key]; },
  // r = [caja, vence(min), vistas, aciertos, fallos, tiempoMedio(ds), última(min)]
  grade(key, q, ms) {
    const t = Math.floor(now() / 60000);
    const r = this.d.items[key] || [0, 0, 0, 0, 0, 0, 0];
    r[2]++; r[6] = t; r[5] = Math.round(((r[5] * (r[2] - 1)) + Math.min(ms, 60000) / 100) / r[2]);
    if (q === 0) { r[4]++; r[0] = Math.max(0, r[0] - 2); r[1] = t + 1; }
    else {
      r[3]++;
      if (q === 1) { r[0] = Math.max(1, r[0]); r[1] = t + Math.max(1, Math.round(INTERVALS_MIN[r[0]] * 0.4)); }
      else { r[0] = Math.min(6, r[0] + (q === 3 && r[0] >= 1 ? 2 : 1)); r[1] = t + INTERVALS_MIN[r[0]]; }
    }
    this.d.items[key] = r;
    this.d.tot.n++; if (q > 0) this.d.tot.ok++;
    const day = new Date().toISOString().slice(0, 10); if (!this.d.days.includes(day)) this.d.days.push(day);
    this.save();
    return r;
  },
  level(key) { const r = this.d.items[key]; if (!r || !r[2]) return 0; if (r[0] <= 1) return 1; if (r[0] <= 3) return 2; return 3; },
  weight(key, tmin) {
    const r = this.d.items[key];
    if (!r || !r[2]) return 1.0;                                   // nuevo
    const due = r[1] <= tmin;
    if (due) { const iv = INTERVALS_MIN[r[0]] || 1; return 3 + Math.min(3, (tmin - r[1]) / iv) + (r[4] > r[3] ? 1 : 0); }
    return 0.06 / (r[0] + 1) + (r[0] <= 1 ? 0.25 : 0);              // dominado: aparece de vez en cuando
  },
  pick(keys, avoid = []) {
    const tmin = Math.floor(now() / 60000);
    const learning = keys.filter(k => { const r = this.d.items[k]; return r && r[2] && r[0] <= 1; }).length;
    let tot = 0; const w = keys.map(k => { let x = avoid.includes(k) ? 0 : this.weight(k, tmin); if (!this.d.items[k] && learning >= 10) x *= 0.25; tot += x; return x; });
    if (tot <= 0) return keys[Math.random() * keys.length | 0];
    let r = Math.random() * tot; for (let i = 0; i < keys.length; i++) { r -= w[i]; if (r <= 0) return keys[i]; }
    return keys[keys.length - 1];
  },
  streak() {
    const set = new Set(this.d.days); let s = 0; const d = new Date();
    if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  },
  merge(o) {
    if (!o || !o.items) return;
    for (const [k, r] of Object.entries(o.items)) { const m = this.d.items[k]; if (!m || (r[6] || 0) > (m[6] || 0) || (r[2] > m[2] && (r[6] || 0) >= (m[6] || 0))) this.d.items[k] = r; }
    this.d.days = uniq([...(this.d.days || []), ...(o.days || [])]).sort();
    if (o.tot && o.tot.n > this.d.tot.n) this.d.tot = o.tot;
  },
  reset(prefixes) {
    if (!prefixes) { this.d.items = {}; this.d.days = []; this.d.tot = { n: 0, ok: 0 }; }
    else for (const k of Object.keys(this.d.items)) if (prefixes.some(p => k.startsWith(p))) delete this.d.items[k];
    this.save();
  }
};
/* copia en la nube privada del usuario (capacidad db), además del navegador */
const REMOTE = {
  db: null, uid: null, ready: false, t: null,
  async init() {
    try {
      if (!window.claude || !window.claude.use) return this.status('Progreso guardado en este navegador');
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return this.status('Progreso guardado en este navegador');
      const uid = await user.id(); if (!uid) return this.status('Progreso guardado en este navegador');
      this.db = db; this.uid = uid;
      const snap = await this.doc().get();
      if (snap.exists) { const v = snap.data(); STORE.merge(v && v.json ? JSON.parse(v.json) : null); STORE.saveLocal(); APP.refresh && APP.refresh(); }
      this.ready = true; this.status('Progreso sincronizado');
    } catch (e) { this.status('Progreso guardado en este navegador'); }
  },
  doc() { return this.db.doc('data/users/' + this.uid + '/atlas/progreso'); },
  status(t) { const s = $('#sync'); if (s) s.textContent = t; },
  schedule() { if (!this.ready) return; clearTimeout(this.t); this.t = setTimeout(() => this.push(), 4000); },
  async push() { try { await this.doc().set({ json: JSON.stringify(STORE.d), at: new Date().toISOString() }); this.status('Progreso sincronizado'); } catch (e) { this.status('Sin conexión: guardado en el navegador'); } }
};

/* ============ motor del mapa ============ */
const MAP = {
  t: d3.zoomIdentity, k: 1, mode: 'political', listeners: {},
  on(ev, f) { (this.listeners[ev] = this.listeners[ev] || []).push(f); },
  emit(ev, ...a) { (this.listeners[ev] || []).forEach(f => f(...a)); },
  init() {
    const svg = this.svg = d3.select('#map');
    // En pantallas táctiles el mapa se mueve como una imagen ya pintada mientras dura el gesto o la animación
    // (lo hace la tarjeta gráfica) y solo se vuelve a dibujar, nítido, al terminar. Así no va a tirones.
    this.fast = matchMedia('(pointer: coarse)').matches;
    const stage = document.createElement('div'); stage.className = 'mapstage' + (this.fast ? ' fast' : '');
    svg.node().parentNode.insertBefore(stage, svg.node()); stage.appendChild(svg.node());
    this.stage = d3.select(stage); this.tc = d3.zoomIdentity; this.ox = 0; this.oy = 0;
    const defs = svg.append('defs');
    defs.append('clipPath').attr('id', 'sphereClip').append('path').attr('d', D.ppath({ type: 'Sphere' }));
    this.gz = svg.append('g');
    const g = this.gz;
    this.gOcean = g.append('path').attr('class', 'ocean').attr('d', D.ppath({ type: 'Sphere' }));
    this.gRelief = g.append('g').attr('clip-path', 'url(#sphereClip)').attr('display', 'none');
    this.gGrat = g.append('path').attr('class', 'grat').attr('d', D.ppath(d3.geoGraticule10()));
    this.gCty = g.append('g');
    this.gPhys = g.append('g').attr('display', 'none');
    this.gSpecial = g.append('g');
    this.gHL = g.append('g');
    // nombres y círculos de países pequeños en una capa aparte, que se oculta mientras el mapa se mueve
    const top = this.svgTop = d3.select(stage).append('svg').attr('id', 'mapTop').attr('aria-hidden', 'true');
    this.gz2 = top.append('g');
    this.gMarks = this.gz2.append('g');
    this.gLabels = this.gz2.append('g');
    this.gTop = this.gz2.append('g');
    // relieve: imagen general + teselas de alta resolución
    const P = D.params, sc = P.w / D.W;
    this.gRelief.append('image').attr('href', 'relief/relief_lo.jpg').attr('x', 0).attr('y', 0).attr('width', D.W).attr('height', D.H).attr('preserveAspectRatio', 'none');
    this.tiles = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) {
      const w = P.tw / sc, hgt = Math.min(P.th, P.h - j * P.th) / sc;
      const im = this.gRelief.append('image').attr('x', i * P.tw / sc).attr('y', j * P.th / sc).attr('width', w + 0.05).attr('height', hgt + 0.05).attr('preserveAspectRatio', 'none');
      this.tiles.push({ im, x0: i * P.tw / sc, y0: j * P.th / sc, x1: i * P.tw / sc + w, y1: j * P.th / sc + hgt, src: `relief/r_${i}_${j}.jpg`, loaded: false });
    }
    // países
    this.cty = this.gCty.selectAll('path').data(D.cfeat).join('path').attr('class', 'cty').attr('d', D.path).attr('data-id', d => d.id);
    this.mk = this.gMarks.selectAll('circle').data(D.tiny).join('circle').attr('class', 'mk').attr('cx', d => d.x).attr('cy', d => d.y).attr('data-id', d => d.id);
    this.paintPolitical();
    // interacción
    const tip = $('#tip');
    const over = (ev, id) => { if (this.hoverEnabled === false) return; this.emit('hover', id, ev); };
    const move = ev => { if (!tip.hidden) { const r = $('#mapwrap').getBoundingClientRect(); let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14; if (x + 250 > r.width) x -= 270; tip.style.left = x + 'px'; tip.style.top = y + 'px'; } };
    const bind = sel => sel.on('pointerenter', (ev, d) => { over(ev, d.id); d3.select(ev.currentTarget).classed('hov', true); })
      .on('pointerleave', (ev) => { d3.select(ev.currentTarget).classed('hov', false); this.emit('hover', null, ev); })
      .on('pointermove', move)
      .on('click', (ev, d) => { if (this._dragged) return; ev.stopPropagation(); this.emit('click', d.id, ev, this.toWorld(ev)); });
    bind(this.cty); bind(this.mk);
    svg.on('pointermove.tip', move);
    svg.on('click.bg', ev => { if (this._dragged) return; this.emit('click', null, ev, this.toWorld(ev)); });
    const node = svg.node();
    this.zoom = d3.zoom().scaleExtent([0.2, 200]).on('start', () => { this._dragged = false; this._moving = true; }).on('zoom', ev => {
      if (ev.sourceEvent && ev.sourceEvent.type === 'mousemove') this._dragged = true;
      this.t = ev.transform; this.k = ev.transform.k;
      if (this.fast) {
        // solo se mueve la capa ya pintada: escala relativa a lo último que se dibujó
        const t = ev.transform, c = this.tc, s = t.k / c.k;
        node.style.transform = `translate(${t.x - s * c.x}px,${t.y - s * c.y}px) scale(${s})`;
        if (!this._hidTop && (Math.abs(s - 1) > 0.002 || Math.abs(t.x - c.x) > 2 || Math.abs(t.y - c.y) > 2)) { this._hidTop = true; this.svgTop.classed('away', true); }
        if (this._rafHide == null) this._rafHide = requestAnimationFrame(() => { this._rafHide = null; if (this._moving) $('#tip').hidden = true; });
      } else { this.gz.attr('transform', ev.transform); this.gz2.attr('transform', ev.transform); this.onZoom(); }
      this.emit('zoom', ev.transform);
    }).on('end', () => {
      this._moving = false; setTimeout(() => this._dragged = false, 0);
      if (this.fast) this.commit();
      this.onZoomEnd(); this.emit('zoomend');
    });
    this.stage.call(this.zoom).on('dblclick.zoom', null);
    $('#zin').onclick = () => this.stage.transition().duration(300).call(this.zoom.scaleBy, 1.8);
    $('#zout').onclick = () => this.stage.transition().duration(300).call(this.zoom.scaleBy, 1 / 1.8);
    $('#zhome').onclick = () => this.home();
    new ResizeObserver(debounce(() => this.resize(), 80)).observe($('#mapwrap'));
    this.resize(true);
  },
  // dibuja de verdad la posición actual (una sola vez, al acabar el gesto) y quita el desplazamiento provisional
  commit() {
    const n = this.svg.node();
    this.gz.attr('transform', this.t); this.gz2.attr('transform', this.t); this.tc = this.t; this.onZoom();
    n.style.transform = '';
    if (this._hidTop) { this._hidTop = false; requestAnimationFrame(() => this.svgTop.classed('away', false)); }
  },
  toWorld(ev) { const p = d3.pointer(ev, this.svg.node()); return this.t.invert(p); },
  resize(first) {
    const r = $('#mapwrap').getBoundingClientRect(); this.vw = r.width; this.vh = r.height;
    if (this.fast) {
      // margen pintado alrededor de lo visible, para que al arrastrar o alejar no aparezcan huecos en blanco
      const ox = this.ox = Math.round(r.width * 0.35), oy = this.oy = Math.round(r.height * 0.35), n = this.svg.node();
      n.setAttribute('viewBox', `${-ox} ${-oy} ${r.width + 2 * ox} ${r.height + 2 * oy}`);
      Object.assign(n.style, { left: -ox + 'px', top: -oy + 'px', width: r.width + 2 * ox + 'px', height: r.height + 2 * oy + 'px', transformOrigin: `${ox}px ${oy}px` });
    }
    this.fitK = Math.min(this.vw / D.W, this.vh / D.H) * 0.98;
    this.zoom.scaleExtent([this.fitK * 0.8, this.fitK * 120]).translateExtent([[-D.W * 0.25, -D.H * 0.35], [D.W * 1.25, D.H * 1.35]]);
    if (first) this.home(0);
    this.emit('resize');
  },
  pad() { const m = isSheet(); const p = $('#panel'); const bottom = m && !p.hidden && !p.classList.contains('collapsed') ? p.getBoundingClientRect().height : 0; return { t: m ? 60 : 56, r: 54, b: bottom + 20, l: 20 }; },
  fit(b, { dur = 750, maxK = 60, minK = 1 } = {}) {
    if (!b || !isFinite(b[0][0])) return;
    const p = this.pad(), w = Math.max(40, this.vw - p.l - p.r), hh = Math.max(40, this.vh - p.t - p.b);
    const bw = Math.max(b[1][0] - b[0][0], 1), bh = Math.max(b[1][1] - b[0][1], 1);
    let k = Math.min(w / bw, hh / bh) * 0.88; k = Math.max(this.fitK * minK, Math.min(k, this.fitK * maxK));
    const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
    const t = d3.zoomIdentity.translate(p.l + w / 2 - k * cx, p.t + hh / 2 - k * cy).scale(k);
    if (!dur) return this.stage.call(this.zoom.transform, t);
    // el vuelo empieza en el fotograma siguiente: así el trabajo de montar el panel no se come el principio de la animación
    cancelAnimationFrame(this._fitRaf); this._fitRaf = requestAnimationFrame(() => this.stage.transition().duration(dur).ease(d3.easeCubicInOut).call(this.zoom.transform, t));
  },
  home(dur = 600) { this.fit([[0, 0], [D.W, D.H]], { dur, maxK: 1, minK: 0.8 }); },
  rel() { return this.k / this.fitK; },
  onZoom() {
    const k = this.k;
    this.mk.attr('r', 5 / k).attr('display', d => this.mode !== 'physical' && this.mode !== 'physquiz' && d.diag * k < 14 ? null : 'none');
    this.gLabels.attr('font-size', 13 / k).attr('stroke-width', 3 / k);
    this.gTop.attr('font-size', 13 / k).attr('stroke-width', 3 / k);
    if (this.zoomHook) this.zoomHook(k);
  },
  onZoomEnd() {
    if (this.mode === 'physical' || this.mode === 'physquiz') this.loadTiles();
    HD.update();
    if (this.layoutHook) this.layoutHook();
  },
  loadTiles() {
    if (this.rel() < 1.6) return;
    const x0 = this.t.invertX(0), x1 = this.t.invertX(this.vw), y0 = this.t.invertY(0), y1 = this.t.invertY(this.vh);
    for (const t of this.tiles) if (!t.loaded && t.x1 > x0 && t.x0 < x1 && t.y1 > y0 && t.y0 < y1) { t.im.attr('href', t.src); t.loaded = true; }
  },
  setMode(mode) {
    this.mode = mode;
    const phys = mode === 'physical' || mode === 'physquiz';
    this.svg.classed('phys', phys);
    this.gRelief.attr('display', phys ? null : 'none');
    this.gPhys.attr('display', phys ? null : 'none');
    this.gGrat.attr('display', phys ? 'none' : null);
    this.gOcean.style('fill', phys ? '#c8d6e0' : null);
    this.mk.attr('display', phys ? 'none' : null);
    if (phys) { this.cty.style('fill', null); this.loadTiles(); }
    else this.paintPolitical();
    this.onZoom();
  },
  paintPolitical() { this.cty.attr('class', 'cty').style('fill', d => `var(--p${D.color[d.id] || 6})`); this.mk.style('fill', d => `var(--p${D.color[d.id] || 6})`).style('stroke', null); },
  paint(fn) { this.cty.style('fill', d => fn(d.id)); this.mk.style('fill', d => fn(d.id)); },
  clearOverlays() { this.gSpecial.selectAll('*').remove(); this.gHL.selectAll('*').remove(); this.gTop.selectAll('*').remove(); },
  /* etiquetas con detección de colisiones en pantalla */
  layoutLabels(sel, opts = {}) {
    const k = this.k, t = this.t, vw = this.vw, vh = this.vh, base = 13;
    const placed = [];
    const items = sel.data().map((d, i) => ({ d, i })).filter(o => (o.d.minK || 0) <= this.rel());
    items.sort((a, b) => (a.d.pri || 0) - (b.d.pri || 0));
    const show = new Set();
    for (const o of items) {
      const d = o.d; const sx = t.applyX(d.x), sy = t.applyY(d.y);
      if (sx < -50 || sx > vw + 50 || sy < -30 || sy > vh + 30) continue;
      if (opts.hide && opts.hide(d)) continue;
      const fs = base * (d.em || 1); const w = (d.w || d.text.length * 0.56 * (d.ls ? 1 + d.ls * 1.6 : 1)) * fs, hgt = fs * (d.lines || 1.2);
      let bx;
      if (d.a && Math.abs(d.a) > 8) { const ang = d.a * Math.PI / 180, c = Math.abs(Math.cos(ang)), s = Math.abs(Math.sin(ang)); const W2 = w * c + hgt * s, H2 = w * s + hgt * c; bx = [sx - W2 / 2, sy - H2 / 2, sx + W2 / 2, sy + H2 / 2]; }
      else bx = [sx - w / 2, sy - hgt / 2, sx + w / 2, sy + hgt / 2];
      if (opts.always && opts.always(d)) { placed.push(bx); show.add(o.i); continue; }
      if (placed.some(p => !(bx[2] < p[0] || bx[0] > p[2] || bx[3] < p[1] || bx[1] > p[3]))) continue;
      placed.push(bx); show.add(o.i);
    }
    sel.attr('display', (d, i) => show.has(i) ? null : 'none');
  }
};

/* ============ panel y navegación ============ */
const APP = { tab: null, tabs: {} };
function setPanel(html) { const b = $('#panelBody'); b.innerHTML = html; $('#panel').scrollTop = 0; if (APP.syncTog) APP.syncTog(); }
function tooltip(html, ev) {
  const tip = $('#tip'); if (!html) { tip.hidden = true; return; }
  tip.innerHTML = html; tip.hidden = false;
  if (ev && ev.clientX != null) { const r = $('#mapwrap').getBoundingClientRect(); let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14; if (x + 250 > r.width) x -= 270; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
}
function switchTab(name) {
  if (APP.tab === name) return;
  const prev = APP.tabs[APP.tab]; if (prev && prev.leave) prev.leave();
  APP.tab = name;
  $$('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name));
  const t = APP.tabs[name];
  const pageMode = !!t.page;
  $('#page').hidden = !pageMode; $('#panel').hidden = pageMode;
  $('#main').style.gridTemplateColumns = pageMode ? '1fr' : '';
  MAP.hoverEnabled = true; MAP.layoutHook = null; MAP.zoomHook = null; MAP.clearOverlays(); MAP.gLabels.selectAll('*').remove(); tooltip(null);
  $('#legend').hidden = true; $('#searchbox').hidden = true;
  t.enter();
  lsSet('atlas-tab', name);
  try { if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name); } catch (e) { }
  setTimeout(() => MAP.resize(), 30);
}
function applyTheme(v) { if (v) document.documentElement.setAttribute('data-theme', v); else document.documentElement.removeAttribute('data-theme'); }
function setTheme(v) { applyTheme(v); try { if (v) localStorage.setItem('atlas-theme', v); else localStorage.removeItem('atlas-theme'); } catch (e) { } }
function initShell() {
  // en táctil se cambia de pestaña al levantar el dedo, aunque se haya movido un poco (antes se perdían toques)
  $$('.tab').forEach(b => {
    b.onclick = () => switchTab(b.dataset.tab);
    let p0 = null;
    b.addEventListener('pointerdown', e => { p0 = e.pointerType === 'mouse' ? null : [e.clientX, e.clientY]; });
    b.addEventListener('pointerup', e => { if (p0 && Math.hypot(e.clientX - p0[0], e.clientY - p0[1]) < 24) switchTab(b.dataset.tab); p0 = null; });
  });
  // leyenda: abrir y cerrar a mano (más fiable que el comportamiento nativo de <details> en Safari)
  const lg = $('#legend');
  lg.addEventListener('click', e => { if (e.target.closest('summary')) { e.preventDefault(); lg.open = !lg.open; } });
  $('#handle').onclick = () => $('#panel').classList.toggle('collapsed');
  const ptog = $('#ptog');
  const syncTog = () => ptog.setAttribute('aria-pressed', isSheet() ? $('#panel').classList.contains('collapsed') : $('#main').classList.contains('nopanel'));
  ptog.onclick = () => { if (isSheet()) $('#panel').classList.toggle('collapsed'); else $('#main').classList.toggle('nopanel'); syncTog(); setTimeout(() => MAP.resize(), 40); };
  APP.syncTog = syncTog;
  try { if (sessionStorage.getItem('atlas-portrait')) document.documentElement.classList.add('allow-portrait'); } catch (e) { }
  $('#keepPortrait').onclick = () => { document.documentElement.classList.add('allow-portrait'); try { sessionStorage.setItem('atlas-portrait', '1'); } catch (e) { } setTimeout(() => { MAP.resize(); MAP.home(0); }, 40); };
  const fs = $('#fsLand');
  if (document.fullscreenEnabled && screen.orientation && screen.orientation.lock) fs.hidden = false;
  fs.onclick = async () => { try { await document.documentElement.requestFullscreen(); await screen.orientation.lock('landscape'); } catch (e) { toast('Tu navegador no deja girar la pantalla: gira el móvil a mano'); } };
  applyTheme(lsGet('atlas-theme'));
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (APP.tabs[h]) switchTab(h); });
  // buscador
  const inp = $('#search'), sg = $('#sugg'); let hits = [], cur = 0;
  const render = () => { sg.hidden = !hits.length; sg.innerHTML = hits.map((h, i) => `<button data-id="${h.id}" class="${i === cur ? 'on' : ''}"><img alt="" src="${flagUrl(h.id)}">${esc(h.name)}<small>${esc(D.info[h.id].state ? (D.info[h.id].reg || '') : 'territorio')}</small></button>`).join(''); };
  inp.oninput = () => {
    const q = norm(inp.value); cur = 0; if (!q) { hits = []; return render(); }
    hits = D.searchIdx.filter(x => !x.id.includes('-') && (x.n.includes(q) || x.alts.some(a => a.startsWith(q)))).sort((a, b) => (b.n.startsWith(q) - a.n.startsWith(q)) || (!!D.info[b.id].state - !!D.info[a.id].state) || a.n.localeCompare(b.n)).slice(0, 8);
    render();
  };
  inp.onkeydown = e => { if (e.key === 'ArrowDown') { cur = Math.min(hits.length - 1, cur + 1); render(); e.preventDefault(); } else if (e.key === 'ArrowUp') { cur = Math.max(0, cur - 1); render(); e.preventDefault(); } else if (e.key === 'Enter' && hits[cur]) { pick(hits[cur].id); } else if (e.key === 'Escape') { hits = []; render(); } };
  sg.onclick = e => { const b = e.target.closest('button'); if (b) pick(b.dataset.id); };
  const pick = id => { hits = []; render(); inp.value = ''; inp.blur(); const t = APP.tabs[APP.tab]; if (t && t.select) t.select(id, true); };
  document.addEventListener('click', e => { if (!e.target.closest('#searchbox')) { hits = []; render(); } });
}
