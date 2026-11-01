/* ============ EXAMEN ============ */
const POL_TYPES = [
  { m: 'cap', n: 'País → capital', d: 'Te digo el país, dices la capital' },
  { m: 'capc', n: 'Capital → país', d: 'Te digo la capital, dices el país' },
  { m: 'mapn', n: 'Mapa → nombre', d: 'Resalto un país en el mapa' },
  { m: 'mapc', n: 'Nombre → mapa', d: 'Haz clic sobre el país' },
  { m: 'flag', n: 'Bandera → país', d: 'Reconoce la bandera' },
  { m: 'flagc', n: 'País → bandera', d: 'Elige su bandera' }];
const PHY_TYPES = [
  { m: 'pn', n: 'Señalado → nombre', d: 'Resalto un accidente en el mapa' },
  { m: 'pl', n: 'Nombre → señalar', d: 'Haz clic donde está' },
  { m: 'ps', n: '¿Qué mar lo baña?', d: 'Mares y océanos de cada país' }];
const PHY_GROUPS = [
  { k: 'seas', n: 'Océanos y mares', c: ['océano', 'mar'] },
  { k: 'gulfs', n: 'Golfos, bahías y estrechos', c: ['golfo', 'bahía', 'estrecho', 'canal', 'fiordo', 'laguna', 'arrecife'] },
  { k: 'ranges', n: 'Cordilleras y sierras', c: ['cordillera'] },
  { k: 'peaks', n: 'Picos y volcanes', c: ['pico', 'volcán'] },
  { k: 'rivers', n: 'Ríos', c: ['río'] },
  { k: 'lakes', n: 'Lagos', c: ['lago', 'embalse'] },
  { k: 'penins', n: 'Penínsulas e istmos', c: ['península', 'istmo', 'delta'] },
  { k: 'islands', n: 'Islas y archipiélagos', c: ['isla', 'archipiélago'] },
  { k: 'relief', n: 'Desiertos, mesetas y llanuras', c: ['desierto', 'meseta', 'llanura', 'cuenca', 'tundra', 'valle', 'humedal', 'depresión'] }];
const CAR_TYPES = [
  { m: 'cl', n: 'Paralelos y meridianos' }, { m: 'cp', n: '¿Qué proyección es?' }, { m: 'cq', n: '¿Qué conserva?' }, { m: 'cs', n: 'Tipo de superficie' }, { m: 'cc', n: 'Coordenadas' }];
const DIFF = [{ k: 1, n: 'Básico', r: 2 }, { k: 2, n: 'Medio', r: 4 }, { k: 3, n: 'Experto', r: 99 }];
const CAR_LINES = [
  { id: 'ecuador', n: 'Ecuador', lat: 0 }, { id: 'cancer', n: 'Trópico de Cáncer', lat: 23.44 }, { id: 'capricornio', n: 'Trópico de Capricornio', lat: -23.44 },
  { id: 'artico', n: 'Círculo polar ártico', lat: 66.56 }, { id: 'antartico', n: 'Círculo polar antártico', lat: -66.56 },
  { id: 'greenwich', n: 'Meridiano de Greenwich', lon: 0 }, { id: 'antimeridiano', n: 'Antimeridiano (180°)', lon: 180 }];
const CAR_CITIES = [['Madrid', -3.70, 40.42], ['Buenos Aires', -58.38, -34.60], ['Tokio', 139.69, 35.69], ['Nairobi', 36.82, -1.29], ['Sídney', 151.21, -33.87], ['Nueva York', -74.01, 40.71], ['El Cairo', 31.24, 30.04], ['Moscú', 37.62, 55.76], ['Ciudad de México', -99.13, 19.43], ['Lima', -77.04, -12.05], ['Bombay', 72.88, 19.08], ['Reikiavik', -21.94, 64.15], ['Ciudad del Cabo', 18.42, -33.92], ['Singapur', 103.82, 1.35], ['Anchorage', -149.90, 61.22], ['Quito', -78.47, -0.18], ['Pekín', 116.40, 39.90], ['Londres', -0.13, 51.51], ['Honolulu', -157.86, 21.31], ['Ushuaia', -68.30, -54.80]];
const PROPN = { conforme: 'Conforme (ángulos y formas locales)', equivalente: 'Equivalente (áreas)', equidistante: 'Equidistante (distancias desde un punto o línea)', afilactica: 'Afiláctica o de compromiso (ninguna exacta)' };
const SURFN = { cilindrica: 'Cilíndrica', pseudocilindrica: 'Pseudocilíndrica', conica: 'Cónica', azimutal: 'Azimutal (plana)', otra: 'Interrumpida u otra' };

const QUIZ = {
  cat: 'pol', q: null, sc: { n: 0, ok: 0, streak: 0, best: 0 }, recent: [],
  st: null,
  defaults() {
    return {
      pol: { types: ['cap', 'capc', 'mapn', 'mapc', 'flag', 'flagc'], regs: [], mode: 'mc', limited: true, review: false },
      phy: { types: ['pn', 'pl', 'ps'], groups: PHY_GROUPS.map(g => g.k), diff: 1, regs: [], mode: 'mc', review: false },
      car: { types: CAR_TYPES.map(t => t.m), review: false, regs: [], mode: 'mc' }
    };
  },
  conf() { if (!this.st) { const s = STORE.d.set.quiz || {}; const d = this.defaults(); this.st = {}; for (const k of Object.keys(d)) this.st[k] = Object.assign({}, d[k], s[k] || {}); if (s.cat) this.cat = s.cat; } return this.st[this.cat]; },
  saveConf() { STORE.d.set.quiz = Object.assign({}, this.st, { cat: this.cat }); STORE.saveLocal(); },
  enter() {
    this.conf();
    MAP.hoverEnabled = false;
    this.applyMapMode();
    this.next();
  },
  leave() { MAP.paintPolitical(); MAP.hoverEnabled = true; this.q = null; },
  applyMapMode() { MAP.setMode(this.cat === 'phy' ? 'physquiz' : 'political'); MAP.clearOverlays(); MAP.gLabels.selectAll('*').remove(); },
  hover() { tooltip(null); },
  refresh() { if (this.q && !this.q.done) this.render(); },
  /* ---------- conjuntos de preguntas ---------- */
  polPool() {
    const c = this.conf();
    let ids = D.states.filter(id => D.byId[id] || true);
    if (!c.limited) ids = ids.filter(id => !['KOS', 'TWN', 'PSE'].includes(id));
    if (c.regs.length) ids = ids.filter(id => c.regs.includes(D.info[id].reg));
    const keys = [];
    for (const m of c.types) for (const id of ids) { if ((m === 'mapn' || m === 'mapc') && !D.byId[id]) continue; keys.push(m + '|' + id); }
    return keys;
  },
  phyItems() {
    const c = this.conf(); const maxR = DIFF.find(d => d.k === c.diff).r;
    const cats = new Set(PHY_GROUPS.filter(g => c.groups.includes(g.k)).flatMap(g => g.c));
    const regOk = fid => !c.regs.length || [...(D.pRev[fid] || [])].some(cid => D.info[cid] && c.regs.includes(D.info[cid].reg));
    return Object.entries(D.pitems).filter(([id, it]) => cats.has(it.c) && it.r <= maxR && D.pRev[id] && regOk(id) && (it.c !== 'isla' || it.r <= 3)).map(([id]) => id);
  },
  phyPool() {
    const c = this.conf(); const items = this.phyItems(); const keys = [];
    for (const m of c.types) {
      if (m === 'ps') { for (const id of D.states) { if (c.regs.length && !c.regs.includes(D.info[id].reg)) continue; const seas = this.seasOf(id); if (seas.length) keys.push('ps|' + id); } }
      else for (const id of items) keys.push(m + '|' + id);
    }
    return keys;
  },
  seasOf(id) { const ids = [id, ...(D.parts[id] || []).filter(t => D.byId[t].properties.kind === 'far')]; return uniq(ids.flatMap(i => D.pidx[i] || []).filter(f => D.pitems[f] && ['océano', 'mar'].includes(D.pitems[f].c))); },
  carPool() {
    const c = this.conf(); const keys = [];
    for (const m of c.types) {
      if (m === 'cl') CAR_LINES.forEach(l => keys.push('cl|' + l.id));
      if (m === 'cp' || m === 'cq' || m === 'cs') PROJS.filter(p => p.quiz !== false).forEach(p => keys.push(m + '|' + p.id));
      if (m === 'cc') CAR_CITIES.forEach(x => keys.push('cc|' + x[0]));
    }
    return keys;
  },
  pool() { const c = this.conf(); let k = this.cat === 'pol' ? this.polPool() : this.cat === 'phy' ? this.phyPool() : this.carPool(); if (c.review) { const tmin = Math.floor(now() / 60000); k = k.filter(x => { const r = STORE.rec(x); return r && r[2] && (r[0] <= 1 || r[4] > r[3] || r[1] <= tmin); }); } return k; },
  /* ---------- siguiente pregunta ---------- */
  next() {
    MAP.clearOverlays(); MAP.paintPolitical(); tooltip(null);
    if (this.cat === 'phy') MAP.cty.style('fill', null);
    const keys = this.pool();
    if (!keys.length) { this.q = null; this.render(); return; }
    const key = STORE.pick(keys, this.recent);
    this.recent.push(key); if (this.recent.length > Math.min(6, Math.floor(keys.length / 2))) this.recent.shift();
    const [m, id] = key.split('|');
    const q = this.q = { key, m, id, t0: now(), tries: 0, hint: false, done: false, cat: this.cat };
    try { this.build(q); } catch (e) { console.error(e); this.recent.pop(); return this.next(); }
    this.render(); this.stage();
  },
  build(q) {
    const c = this.conf(), I = D.info, mc = c.mode === 'mc' || q.m === 'flagc' || this.cat === 'car';
    q.mc = mc;
    const regionPeers = (id, n = 12) => { const e = I[id]; const same = D.states.filter(x => x !== id && I[x].sub === e.sub); const nb = (e.borders || []).filter(x => I[x] && I[x].state); const reg = D.states.filter(x => x !== id && I[x].reg === e.reg); return uniq([...nb, ...shuffle(same), ...shuffle(reg)]).slice(0, n); };
    const pickD = (cands, n = 3, label = x => x) => { const seen = new Set([norm(label(q.id))]); const out = []; for (const x of cands) { const l = norm(label(x)); if (seen.has(l)) continue; seen.add(l); out.push(x); if (out.length >= n) break; } return out; };
    if (this.cat === 'pol') {
      const e = I[q.id];
      if (q.m === 'cap') { q.prompt = `¿Cuál es la capital de <u>${esc(e.name)}</u>?`; q.answer = e.cap; q.accept = [e.cap, ...(e.capAlts || [])]; q.label = 'capital'; if (mc) { const ds = pickD(shuffle(regionPeers(q.id, 6)).concat(regionPeers(q.id, 20)), 3, x => I[x].cap); q.opts = shuffle([q.id, ...ds]).map(x => ({ v: x, t: I[x].cap })); } }
      else {
        const nameOpts = cands => { const ds = pickD(cands, 3, x => I[x].name); return shuffle([q.id, ...ds]).map(x => ({ v: x, t: I[x].name })); };
        q.answer = e.name; q.accept = [e.name, ...(e.alts || [])]; q.label = 'país';
        if (q.m === 'capc') { q.prompt = `¿De qué país es capital <u>${esc(e.cap)}</u>?`; if (mc) q.opts = nameOpts(shuffle(regionPeers(q.id, 6)).concat(regionPeers(q.id, 20))); }
        if (q.m === 'mapn') { q.prompt = '¿Qué país está resaltado en el mapa?'; if (mc) q.opts = nameOpts(regionPeers(q.id, 5).concat(regionPeers(q.id, 20))); }
        if (q.m === 'mapc') { q.prompt = `Haz clic sobre <u>${esc(e.name)}</u> en el mapa`; q.click = true; q.mc = false; }
        if (q.m === 'flag') { q.prompt = '¿De qué país es esta bandera?'; q.flag = q.id; if (mc) q.opts = nameOpts([...(e.flagSim || []).slice(0, 4), ...shuffle(regionPeers(q.id, 10))]); }
        if (q.m === 'flagc') { q.prompt = `¿Cuál es la bandera de <u>${esc(e.name)}</u>?`; const ds = pickD([...(e.flagSim || []).slice(0, 5), ...regionPeers(q.id, 8)], 3, x => I[x].iso2); q.opts = shuffle([q.id, ...ds]).map(x => ({ v: x, flag: x })); q.flagOpts = true; }
      }
    }
    if (this.cat === 'phy') {
      if (q.m === 'ps') {
        const e = I[q.id]; const seas = this.seasOf(q.id); const ans = seas[Math.random() * seas.length | 0]; q.target = ans;
        q.prompt = `¿Qué mar u océano baña las costas de <u>${esc(e.name)}</u>?`; q.answer = D.pitems[ans].n; q.accept = [q.answer]; q.mc = true;
        const others = Object.keys(D.pitems).filter(f => ['océano', 'mar'].includes(D.pitems[f].c) && !seas.includes(f) && D.pRev[f]);
        const near = others.filter(f => [...D.pRev[f]].some(cid => I[cid] && I[cid].reg === e.reg));
        const ds = pickD(shuffle(near).concat(shuffle(others)).filter(f => D.pitems[f].n !== q.answer), 3, f => D.pitems[f].n);
        q.opts = shuffle([ans, ...ds]).map(f => ({ v: f, t: D.pitems[f].n })); q.correctV = ans;
      } else {
        const it = D.pitems[q.id]; q.answer = it.n; q.accept = [it.n]; q.target = q.id;
        const grp = PHY_GROUPS.find(g => g.c.includes(it.c));
        if (q.m === 'pn') {
          q.prompt = `¿Cómo se llama ${art(it.c)} resaltad${fem(it.c) ? 'a' : 'o'}?`;
          if (q.mc) { const pool = this.phyItems().filter(f => f !== q.id && grp.c.includes(D.pitems[f].c)); const near = pool.filter(f => [...(D.pRev[f] || [])].some(x => (D.pRev[q.id] || new Set()).has(x))); const ds = pickD(shuffle(near).concat(shuffle(pool)), 3, f => (f === q.id ? it.n : D.pitems[f].n)); q.opts = shuffle([q.id, ...ds]).map(f => ({ v: f, t: D.pitems[f].n })); }
        } else { q.prompt = `Señala en el mapa: <u>${esc(it.n)}</u> <span class="muted" style="font-size:.7em">(${esc(it.c)})</span>`; q.click = true; q.mc = false; }
      }
    }
    if (this.cat === 'car') {
      q.mc = true;
      if (q.m === 'cl') { const l = CAR_LINES.find(x => x.id === q.id); q.prompt = '¿Qué línea está resaltada en el mapa?'; q.answer = l.n; q.opts = shuffle([l, ...sample(CAR_LINES.filter(x => x !== l), 3)]).map(x => ({ v: x.id, t: x.n })); q.correctV = l.id; }
      else if (q.m === 'cc') { const city = CAR_CITIES.find(x => x[0] === q.id); q.prompt = `¿Cuáles son las coordenadas del punto marcado? <span class="hint">Es ${esc(city[0])}.</span>`; const fmt = (lo, la) => `${Math.abs(la).toFixed(0)}° ${la >= 0 ? 'N' : 'S'}, ${Math.abs(lo).toFixed(0)}° ${lo >= 0 ? 'E' : 'O'}`; const ok = fmt(city[1], city[2]); const ds = uniq([fmt(-city[1], city[2]), fmt(city[1], -city[2]), fmt(-city[1], -city[2]), fmt(city[2], city[1])]).filter(x => x !== ok).slice(0, 3); q.answer = ok; q.opts = shuffle([ok, ...ds]).map(x => ({ v: x, t: x })); q.correctV = ok; q.city = city; }
      else {
        const p = PROJS.find(x => x.id === q.id);
        if (q.m === 'cp') { q.prompt = '¿Qué proyección es esta?'; q.answer = p.n; q.proj = p; const sameF = PROJS.filter(x => x.id !== p.id && x.surf === p.surf); q.opts = shuffle([p, ...pickD(shuffle(sameF).concat(shuffle(PROJS.filter(x => x.id !== p.id))), 3, x => (x.id ? x.n : PROJS.find(y => y.id === x).n))]).map(x => ({ v: x.id, t: x.n })); q.correctV = p.id; }
        if (q.m === 'cq') { q.prompt = `¿Qué propiedad conserva la proyección <u>${esc(p.n)}</u>?`; q.answer = PROPN[p.prop]; q.opts = Object.keys(PROPN).map(k => ({ v: k, t: PROPN[k] })); q.correctV = p.prop; }
        if (q.m === 'cs') { q.prompt = `¿De qué tipo es la proyección <u>${esc(p.n)}</u>?`; q.answer = SURFN[p.surf]; q.opts = Object.keys(SURFN).map(k => ({ v: k, t: SURFN[k] })); q.correctV = p.surf; }
      }
    }
    if (q.correctV == null) q.correctV = q.id;
  },
  /* ---------- puesta en escena del mapa ---------- */
  stage() {
    const q = this.q; if (!q) return;
    const gH = MAP.gHL, I = D.info;
    if (q.cat === 'pol') {
      const regB = () => { const c = this.conf(); if (!c.regs.length) return null; const ids = D.states.filter(id => c.regs.includes(I[id].reg) && D.byId[id]); return boundsOf(ids.map(id => rectF(homeBounds(id)))); };
      if (q.m === 'mapn' || q.m === 'cap') { this.markCountry(q.id, 'f-q'); this.flyContext(q.id); }
      else if (q.m === 'mapc') { const b = regB(); b ? MAP.fit(b, { maxK: 12 }) : MAP.home(); }
      else { const b = regB(); b ? MAP.fit(b, { maxK: 12 }) : MAP.home(); }
    }
    if (q.cat === 'phy') {
      if (q.m === 'pn') { this.drawPhys(q.target, true); this.flyPhys(q.target); }
      else if (q.m === 'ps') { this.markCountry(q.id, 'f-q'); MAP.cty.filter(d => d.id === q.id).style('fill', 'rgba(22,64,163,.45)'); this.flyContext(q.id, 3); }
      else { const c = this.conf(); if (c.regs.length) { const ids = D.states.filter(id => c.regs.includes(I[id].reg)); MAP.fit(boundsOf(ids.map(id => rectF(homeBounds(id)))), { maxK: 8 }); } else MAP.home(); }
    }
    if (q.cat === 'car') {
      if (q.m === 'cl') { const l = CAR_LINES.find(x => x.id === q.id); const ls = l.lat != null ? { type: 'LineString', coordinates: d3.range(-180, 180.1, 2).map(x => [x, l.lat]) } : { type: 'LineString', coordinates: d3.range(-90, 90.1, 2).map(y => [l.lon === 180 ? 179.99 : l.lon, y]) }; gH.append('path').attr('class', 'hl-line').attr('d', D.ppath(ls)); gH.append('path').attr('class', 'hl-line2').attr('d', D.ppath(ls)); MAP.home(); }
      else if (q.m === 'cc') { const p = D.proj([q.city[1], q.city[2]]); gH.append('path').attr('class', 'grat').style('stroke', 'var(--muted)').attr('d', D.ppath(d3.geoGraticule().step([15, 15])())); gH.append('circle').attr('class', 'hl-pt').attr('cx', p[0]).attr('cy', p[1]).attr('r', 0.9); MAP.home(); }
      else MAP.home();
    }
  },
  markCountry(id, cls) { MAP.cty.filter(d => d.id === id || (d.properties && d.properties.kind === 'far' && d.properties.sov === id)).classed(cls, true); MAP.mk.filter(d => d.id === id).classed(cls, true).attr('display', null); },
  flyContext(id, mult = 5) { const b = homeBounds(id); const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2; const s = Math.max(b[1][0] - b[0][0], b[1][1] - b[0][1], 30) * mult / 2; MAP.fit([[cx - s, cy - s * 0.6], [cx + s, cy + s * 0.6]], { maxK: 30 }); },
  physFeature(fid) { const it = D.pitems[fid]; if (D.pgeo[fid]) return D.pgeo[fid]; const p = D.proj([it.x, it.y]); return { type: 'Feature', geometry: { type: 'Point', coordinates: p } }; },
  drawPhys(fid, strong) {
    const f = this.physFeature(fid), g = MAP.gHL, t = f.geometry.type;
    if (t === 'Point') { const [x, y] = f.geometry.coordinates; g.append('circle').attr('class', 'hl-pt').attr('cx', x).attr('cy', y).attr('r', 6 / MAP.k).attr('data-scale', 6); }
    else if (/Line/.test(t)) { g.append('path').attr('class', 'hl-line').attr('d', D.path(f)); g.append('path').attr('class', 'hl-line2').attr('d', D.path(f)); }
    else g.append('path').attr('class', 'hl-poly').attr('d', D.path(f));
    MAP.zoomHook = k => MAP.gHL.selectAll('circle[data-scale]').attr('r', function () { return +this.dataset.scale / k; });
  },
  flyPhys(fid) {
    const f = this.physFeature(fid); let b;
    if (f.geometry.type === 'Point') { const [x, y] = f.geometry.coordinates; b = [[x - 1, y - 1], [x + 1, y + 1]]; } else b = D.path.bounds(f);
    const cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2; const s = Math.max(b[1][0] - b[0][0], b[1][1] - b[0][1], 40) * 1.5;
    MAP.fit([[cx - s, cy - s * 0.62], [cx + s, cy + s * 0.62]], { maxK: 10 });
  },
  physLabel(fid) { const it = D.pitems[fid]; const L = it.L && it.L.x != null ? [it.L.x, it.L.y] : D.proj([it.x, it.y]); MAP.gTop.append('text').attr('class', 'lbl').attr('x', L[0]).attr('y', L[1] - (D.pgeo[fid] ? 0 : 1.2 * 13 / MAP.k)).attr('font-size', '1.15em').style('font-weight', 700).text(it.n + (it.e ? ` (${nf.format(it.e)} m)` : '')); MAP.onZoom(); },
  /* ---------- respuesta ---------- */
  click(id, ev, w) {
    const q = this.q; if (!q || q.done || !q.click) return;
    if (q.cat === 'pol') {
      if (!id) return;
      const f = D.byId[id]; const real = f && f.properties && f.properties.kind === 'far' ? f.properties.sov : id;
      const ok = real === q.id;
      q.clicked = real;
      this.finish(ok, ok ? '' : `Has pulsado <b>${esc(nameOf(real))}</b>.`);
    } else if (q.cat === 'phy') {
      const d = this.distTo(q.target, w); const tol = 16 / MAP.k;
      const ok = d <= tol;
      MAP.gTop.append('circle').attr('class', 'click-mk').attr('cx', w[0]).attr('cy', w[1]).attr('r', 7 / MAP.k);
      this.finish(ok, ok ? '' : 'Tu clic quedó lejos.');
    }
  },
  distTo(fid, w) {
    const f = this.physFeature(fid), g = f.geometry; const [px, py] = w;
    const segD = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const l = dx * dx + dy * dy; let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
    const lineD = l => { let m = Infinity; for (let i = 1; i < l.length; i++) m = Math.min(m, segD(l[i - 1], l[i])); return m; };
    if (g.type === 'Point') return Math.hypot(px - g.coordinates[0], py - g.coordinates[1]);
    if (g.type === 'LineString') return lineD(g.coordinates);
    if (g.type === 'MultiLineString') return Math.min(...g.coordinates.map(lineD));
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    let m = Infinity;
    for (const p of polys) { if (d3.polygonContains(p[0], [px, py]) && !p.slice(1).some(h => d3.polygonContains(h, [px, py]))) return 0; for (const r of p) m = Math.min(m, lineD(r)); }
    return m;
  },
  choose(v) {
    const q = this.q; if (!q || q.done) return;
    q.chosen = v; const ok = v === q.correctV;
    this.finish(ok, '');
  },
  submitText(txt) {
    const q = this.q; if (!q || q.done) return;
    const a = norm(txt); if (!a) return;
    const acc = uniq(q.accept.map(norm)).filter(Boolean);
    if (acc.includes(a)) return this.finish(true, '');
    const close = acc.some(x => lev(x, a) <= (x.length > 7 ? 2 : 1));
    if (close && q.tries === 0) { q.tries = 1; q.hint = true; this.flash('Casi: revisa la ortografía e inténtalo otra vez.', 'warn'); return; }
    if (close) return this.finish(true, 'Aceptado con una pequeña errata.');
    q.typed = txt; this.finish(false, `Has escrito «${esc(txt)}».`);
  },
  giveHint() { const q = this.q; if (!q || q.done) return; q.hint = true; const a = q.answer || ''; this.flash(`Empieza por <b>${esc(a.slice(0, 2))}</b>… y tiene ${a.replace(/\s/g, '').length} letras.`, 'warn'); },
  flash(html, kind) { const el = $('#qfb'); if (el) { el.className = 'fb ' + kind; el.innerHTML = html; el.hidden = false; } },
  finish(ok, extra) {
    const q = this.q; q.done = true; q.ok = ok;
    const ms = now() - q.t0; const fastT = q.mc ? 4000 : q.click ? 5000 : 7000;
    let g = ok ? (q.hint || q.tries || ms > 20000 ? 1 : ms < fastT ? 3 : 2) : 0;
    const r = STORE.grade(q.key, g, ms);
    q.grade = g; q.box = r[0];
    this.sc.n++; if (ok) { this.sc.ok++; this.sc.streak++; this.sc.best = Math.max(this.sc.best, this.sc.streak); } else this.sc.streak = 0;
    q.extra = extra;
    // mapa: revelar
    if (q.cat === 'pol') {
      MAP.cty.classed('f-q', false); MAP.mk.classed('f-q', false);
      this.markCountry(q.id, ok ? 'f-ok' : 'f-q');
      if (q.clicked && !ok) { this.markCountry(q.clicked, 'f-bad'); MAP.fit(boundsOf([rectF(homeBounds(q.clicked)), rectF(homeBounds(q.id))]), { maxK: 20 }); }
      else if (!['mapn', 'cap'].includes(q.m)) this.flyContext(q.id, 4);
      const e = D.info[q.id]; const p = e.lab ? D.proj([e.lab[0], e.lab[1]]) : D.path.centroid(D.byId[q.id]);
      MAP.gTop.append('text').attr('class', 'lbl').attr('x', p[0]).attr('y', p[1]).attr('font-size', '1.15em').style('font-weight', 700).text(e.name); MAP.onZoom();
    }
    if (q.cat === 'phy') {
      if (q.m === 'pl') { MAP.gHL.selectAll('*').remove(); this.drawPhys(q.target); this.flyPhys(q.target); }
      if (q.m === 'ps') { this.drawPhys(q.target); }
      this.physLabel(q.target);
    }
    this.render();
  },
  skip() { const q = this.q; if (!q || q.done) return; this.finish(false, 'Pregunta saltada.'); },
  key(e) {
    if (APP.tab !== 'examen' || !this.q) return;
    const inInput = e.target && e.target.tagName === 'INPUT';
    if (e.key === 'Enter' && this.q.done) { e.preventDefault(); this.next(); return; }
    if (!inInput && !this.q.done && this.q.mc && /^[1-4]$/.test(e.key)) { const o = this.q.opts[+e.key - 1]; if (o) this.choose(o.v); }
  },
  /* ---------- panel ---------- */
  render() {
    const q = this.q, c = this.conf();
    const lvl = q ? STORE.level(q.key) : 0;
    const typeName = q ? ([...POL_TYPES, ...PHY_TYPES, ...CAR_TYPES].find(t => t.m === q.m) || {}).n : '';
    const seg = `<div class="seg" role="group" aria-label="Categoría">${[['pol', 'Países'], ['phy', 'Accidentes'], ['car', 'Cartografía']].map(([k, n]) => `<button data-cat="${k}" aria-pressed="${this.cat === k}">${n}</button>`).join('')}</div>`;
    const score = `<div class="score"><span>Aciertos <b>${this.sc.ok}/${this.sc.n}</b></span><span>Racha <b>${this.sc.streak}</b></span><span>Mejor <b>${this.sc.best}</b></span></div>`;
    let body = '';
    if (!q) body = `<div class="card"><p><b>No hay preguntas con estos ajustes.</b></p><p class="small muted">${c.review ? 'No tienes nada pendiente de repaso aquí: desactiva «Solo repasar» o amplía la selección.' : 'Marca al menos un tipo de pregunta y una categoría.'}</p></div>`;
    else {
      let ans = '';
      if (q.flagOpts) ans = `<div class="opts flags">${q.opts.map((o, i) => `<button class="opt flagopt ${q.done ? (o.v === q.correctV ? 'ok' : o.v === q.chosen ? 'bad' : '') : ''}" data-v="${o.v}" ${q.done ? 'disabled' : ''} aria-label="Opción ${i + 1}"><div class="flagbox">${flagSvg(o.v)}</div>${q.done ? `<div class="small" style="margin-top:4px">${esc(nameOf(o.v))}</div>` : ''}</button>`).join('')}</div>`;
      else if (q.mc) ans = `<div class="opts">${q.opts.map((o, i) => `<button class="opt ${q.done ? (o.v === q.correctV ? 'ok' : o.v === q.chosen ? 'bad' : '') : ''}" data-v="${esc(o.v)}" ${q.done ? 'disabled' : ''}><span class="k">${i + 1}</span>${esc(o.t)}</button>`).join('')}</div>`;
      else if (q.click) ans = q.done ? '' : `<p class="muted small">Puedes acercar el mapa antes de hacer clic.</p>`;
      else ans = `<form class="answer-in" id="qform"><input id="qin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe ${q.label === 'capital' ? 'la capital' : 'el nombre'}…" ${q.done ? 'disabled' : ''} aria-label="Respuesta"><button class="btn primary" ${q.done ? 'disabled' : ''}>Responder</button></form>`;
      let fb = '';
      if (q.done) {
        const verdict = q.ok ? (q.grade === 3 ? '¡Correcto y rápido!' : q.grade === 1 ? 'Correcto, con ayuda o algo lento.' : '¡Correcto!') : 'No es correcto.';
        const right = q.cat === 'pol' ? (q.m === 'cap' ? `La capital de ${esc(D.info[q.id].name)} es <b>${esc(D.info[q.id].cap)}</b>.` : `Es <b>${esc(D.info[q.id].name)}</b>${q.m === 'capc' || q.m === 'flag' || q.m === 'flagc' ? ` (capital: ${esc(D.info[q.id].cap)})` : ''}.`) : `Respuesta: <b>${esc(q.answer)}</b>.`;
        const more = q.cat === 'car' && q.m !== 'cl' && q.m !== 'cc' ? `<div class="small" style="margin-top:4px">${esc(PROJS.find(p => p.id === q.id).n)}: ${esc(PROJS.find(p => p.id === q.id).keeps)}</div>` : '';
        const nextIn = q.box != null ? `<div class="small muted" style="margin-top:4px">Nivel: ${LEVELS[STORE.level(q.key)].n}${q.ok ? ` · volverá dentro de ${fmtIv(INTERVALS_MIN[q.box] * (q.grade === 1 ? 0.4 : 1))}` : ' · volverá pronto'}</div>` : '';
        fb = `<div class="fb ${q.ok ? 'ok' : 'bad'}"><b>${verdict}</b> ${q.extra || ''} ${right}${more}${nextIn}</div>`;
      }
      const media = q.flag ? flagBox(q.flag, isLandPhone() ? 110 : 180, "qflag") : q.proj ? `<div class="figure" style="padding:6px">${projThumb(q.proj, 360, 220)}</div>` : '';
      body = `<div class="qcard">
        <div class="row" style="justify-content:space-between"><span class="eyebrow">${esc(typeName)}</span><span class="lvl"><span class="dot" style="background:${LEVELS[lvl].c}"></span>${LEVELS[lvl].n}</span></div>
        <div class="qprompt">${q.prompt}</div>
        ${media}${ans}
        <div class="fb" id="qfb" hidden></div>
        ${fb}
        <div class="row">${q.done ? `<button class="btn primary" id="qnext">Siguiente <span class="kbd">↵</span></button>${q.cat === 'pol' ? `<button class="btn" id="qinfo">Ver ficha</button>` : ''}` : `${!q.mc && !q.click ? '<button class="btn" id="qhint">Pista</button>' : ''}<button class="btn" id="qskip">No lo sé</button>`}</div>
        ${!q.done && q.mc ? '<div class="kbd">Atajo: teclas 1–4</div>' : ''}
      </div>`;
    }
    setPanel(`<div class="stack">
      <div class="row" style="justify-content:space-between">${seg}</div>
      ${score}
      ${body}
      <details class="sec" id="qset" ${STORE.d.set.qsetOpen ? 'open' : ''}><summary style="cursor:pointer;font-weight:700">Ajustes de esta categoría</summary><div class="setup" style="margin-top:10px">${this.setupHtml()}</div></details>
    </div>`);
    this.bind();
  },
  setupHtml() {
    const c = this.conf();
    const types = this.cat === 'pol' ? POL_TYPES : this.cat === 'phy' ? PHY_TYPES : CAR_TYPES;
    const regChips = `<fieldset><legend>Región</legend><div class="chips"><button class="chip" data-reg="" aria-pressed="${!c.regs.length}">Todo el mundo</button>${REGIONS.map(r => `<button class="chip" data-reg="${r}" aria-pressed="${c.regs.includes(r)}">${r}</button>`).join('')}</div></fieldset>`;
    const modeSeg = `<fieldset><legend>Forma de responder</legend><div class="seg"><button data-mode="mc" aria-pressed="${c.mode === 'mc'}">Test (4 opciones)</button><button data-mode="txt" aria-pressed="${c.mode === 'txt'}">Escrita</button></div></fieldset>`;
    let h = `<fieldset><legend>Tipos de pregunta</legend><div class="typegrid">${types.map(t => `<label><input type="checkbox" data-type="${t.m}" ${c.types.includes(t.m) ? 'checked' : ''}><span>${t.n}${t.d ? `<br><span class="muted small">${t.d}</span>` : ''}</span></label>`).join('')}</div></fieldset>`;
    if (this.cat === 'pol') h += regChips + modeSeg + `<label class="toggle"><input type="checkbox" id="qlim" ${c.limited ? 'checked' : ''}>Incluir Kosovo, Palestina y Taiwán</label>`;
    if (this.cat === 'phy') h += `<fieldset><legend>Accidentes</legend><div class="chips">${PHY_GROUPS.map(g => `<button class="chip" data-grp="${g.k}" aria-pressed="${c.groups.includes(g.k)}">${g.n}</button>`).join('')}</div></fieldset>
      <fieldset><legend>Dificultad</legend><div class="seg">${DIFF.map(d => `<button data-diff="${d.k}" aria-pressed="${c.diff === d.k}">${d.n}</button>`).join('')}</div></fieldset>` + regChips + modeSeg;
    h += `<label class="toggle"><input type="checkbox" id="qrev" ${c.review ? 'checked' : ''}>Solo repasar lo pendiente y lo que más fallo</label>`;
    const n = this.pool().length;
    h += `<p class="small muted">${n} preguntas posibles con estos ajustes. Lo nuevo y lo fallado sale a menudo; lo que dominas, de vez en cuando.</p>`;
    return h;
  },
  bind() {
    const B = $('#panelBody'), c = this.conf();
    const changed = () => { this.saveConf(); this.recent = []; this.next(); };
    $$('[data-cat]', B).forEach(b => b.onclick = () => { if (this.cat === b.dataset.cat) return; this.cat = b.dataset.cat; this.saveConf(); this.recent = []; this.applyMapMode(); this.next(); });
    $$('[data-v]', B).forEach(b => b.onclick = () => this.choose(b.dataset.v));
    const f = $('#qform', B); if (f) { f.onsubmit = e => { e.preventDefault(); this.submitText($('#qin').value); }; if (!this.q.done && !isMobile()) setTimeout(() => { const i = $('#qin'); i && i.focus(); }, 30); }
    const nx = $('#qnext', B); if (nx) { nx.onclick = () => this.next(); if (!isMobile()) nx.focus(); }
    const hi = $('#qhint', B); if (hi) hi.onclick = () => this.giveHint();
    const sk = $('#qskip', B); if (sk) sk.onclick = () => this.skip();
    const inf = $('#qinfo', B); if (inf) inf.onclick = () => { switchTab('explorar'); EXPLORE.select(this.q.id); };
    const det = $('#qset', B); if (det) det.ontoggle = () => { STORE.d.set.qsetOpen = det.open; STORE.saveLocal(); };
    $$('[data-type]', B).forEach(i => i.onchange = () => { c.types = $$('[data-type]', B).filter(x => x.checked).map(x => x.dataset.type); changed(); });
    $$('[data-reg]', B).forEach(b => b.onclick = () => { const r = b.dataset.reg; if (!r) c.regs = []; else c.regs = c.regs.includes(r) ? c.regs.filter(x => x !== r) : [...c.regs, r]; changed(); });
    $$('[data-mode]', B).forEach(b => b.onclick = () => { c.mode = b.dataset.mode; changed(); });
    $$('[data-grp]', B).forEach(b => b.onclick = () => { const k = b.dataset.grp; c.groups = c.groups.includes(k) ? c.groups.filter(x => x !== k) : [...c.groups, k]; changed(); });
    $$('[data-diff]', B).forEach(b => b.onclick = () => { c.diff = +b.dataset.diff; changed(); });
    const lim = $('#qlim', B); if (lim) lim.onchange = () => { c.limited = lim.checked; changed(); };
    const rv = $('#qrev', B); if (rv) rv.onchange = () => { c.review = rv.checked; changed(); };
  }
};
function rectF(b) { return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[b[0], [b[0][0], b[1][1]], b[1], [b[1][0], b[0][1]], b[0]]] } }; }
function fmtIv(min) { if (min < 60) return Math.max(1, Math.round(min)) + ' min'; if (min < 60 * 24) return Math.round(min / 60) + ' h'; const d = Math.round(min / 1440); return d + (d === 1 ? ' día' : ' días'); }
const FEM = ['cordillera', 'península', 'isla', 'meseta', 'llanura', 'cuenca', 'tundra', 'bahía', 'laguna', 'depresión'];
function fem(c) { return FEM.includes(c); }
function art(c) { return (fem(c) ? 'la ' : 'el ') + c; }
APP.tabs.examen = QUIZ;
