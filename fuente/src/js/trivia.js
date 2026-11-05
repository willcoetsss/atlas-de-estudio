/* ============ TRIVIA ============ */
// Juegos cortos de comparar y adivinar países. Lo de aquí no entra en la repetición espaciada del examen:
// guarda récords, partidas, el reto del día y los países que más se fallan en STORE.d.set.trivia.
const TRV_METRICS = [
  { k: 'area', n: 'Superficie', q: '¿Cuál tiene más superficie?', ord: 'de mayor a menor superficie', more: 1 },
  { k: 'pop', n: 'Población', q: '¿Cuál tiene más habitantes?', ord: 'de más a menos habitantes', more: 1 },
  { k: 'dens', n: 'Densidad', q: '¿Cuál tiene más densidad de población?', ord: 'de más a menos densidad', more: 1 },
  { k: 'north', n: 'Más al norte', q: '¿Cuál tiene la capital más al norte?', ord: 'de norte a sur (por su capital)', more: 1 },
  { k: 'south', n: 'Más al sur', q: '¿Cuál tiene la capital más al sur?', ord: 'de sur a norte (por su capital)', more: -1 },
  { k: 'east', n: 'Más al este', q: '¿Cuál tiene la capital más al este?', ord: 'de este a oeste (por su capital)', more: 1 },
  { k: 'west', n: 'Más al oeste', q: '¿Cuál tiene la capital más al oeste?', ord: 'de oeste a este (por su capital)', more: -1 },
  { k: 'nb', n: 'Vecinos', q: '¿Cuál tiene más países vecinos por tierra?', ord: 'de más a menos vecinos', more: 1 },
  { k: 'cappop', n: 'Población de la capital', q: '¿Cuál tiene la capital más poblada?', ord: 'de la capital más poblada a la menos', more: 1 }];
const TRV_GAMES = [
  { k: 'hl', n: '¿Más o menos?', d: 'Dos países: toca el que tiene más. El que gana se queda.', rec: v => `racha de ${v}` },
  { k: 'ord', n: 'Ordena', d: 'Cinco países: tócalos en orden, del primero al último.', rec: v => `${v} puntos` },
  { k: 'route', n: 'Recorrido', d: 'Une dos países pasando solo por fronteras terrestres.', rec: v => `${v} puntos` },
  { k: 'sil', n: 'Silueta con pistas', d: 'Seis intentos; tras cada fallo, la distancia y la dirección.', rec: v => `${v} puntos` },
  { k: 'globle', n: 'Frío o caliente', d: 'Un país secreto: cuanto más cerca, más cálido se pinta.', rec: v => `${v} intentos` },
  { k: 'clock', n: 'Contrarreloj', d: 'Capitales, banderas o países de un continente contra el reloj.', rec: v => `${v} aciertos` }];
const TRV_DIFF = [{ k: 1, n: 'Fácil' }, { k: 2, n: 'Media' }, { k: 3, n: 'Difícil' }];
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const capLL = id => { const e = D.info[id]; return e.capPt || (e.ll ? [e.ll[1], e.ll[0]] : null); };
function trvVal(m, id) {
  const e = D.info[id]; if (!e) return null;
  switch (m) {
    case 'area': return e.area ? +e.area : null;
    case 'pop': return e.pop != null ? +e.pop : null;
    case 'dens': return e.pop != null && e.area ? e.pop * 1e6 / e.area : null;
    case 'north': case 'south': { const c = capLL(id); return c ? c[1] : null; }
    case 'east': case 'west': { const c = capLL(id); return c ? c[0] : null; }
    case 'nb': return (e.borders || []).filter(b => D.info[b] && D.info[b].state).length;
    case 'cappop': { const c = (e.cities || []).find(c => c[3] === 1 || c[0] === e.cap); return c && c[4] ? c[4] : null; }
  }
  return null;
}
const nb1 = x => nf.format(+x.toFixed(1));
function trvFmt(m, v) {
  if (v == null) return '—';
  switch (m) {
    case 'area': return fmtArea(v);
    case 'pop': return fmtPop(v);
    case 'dens': return nf.format(Math.round(v)) + ' hab./km²';
    case 'north': case 'south': return nb1(Math.abs(v)) + '° ' + (v >= 0 ? 'N' : 'S');
    case 'east': case 'west': return nb1(Math.abs(v)) + '° ' + (v >= 0 ? 'E' : 'O');
    case 'nb': return v + (v === 1 ? ' vecino' : ' vecinos');
    case 'cappop': return nf.format(Math.round(v / 1000) * 1000) + ' hab.';
  }
}
// la puntuación de comparar: mayor es mejor salvo en sur y oeste
const trvScore = (m, id) => { const v = trvVal(m, id); const M = TRV_METRICS.find(x => x.k === m); return v == null ? null : v * M.more; };
function trvApart(m, a, b) {
  const x = trvVal(m, a), y = trvVal(m, b); if (x == null || y == null) return false;
  if (m === 'north' || m === 'south' || m === 'east' || m === 'west') return Math.abs(x - y) >= 1;
  if (m === 'nb') return x !== y;
  return Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y)) >= 0.03;
}
// distancia en km entre capitales y rumbo inicial (grados desde el norte)
function capDist(a, b) { const p = capLL(a), q = capLL(b); return p && q ? d3.geoDistance(p, q) * 6371 : null; }
function bearing(a, b) {
  const p = capLL(a), q = capLL(b); if (!p || !q) return 0; const r = Math.PI / 180;
  const y = Math.sin((q[0] - p[0]) * r) * Math.cos(q[1] * r), x = Math.cos(p[1] * r) * Math.sin(q[1] * r) - Math.sin(p[1] * r) * Math.cos(q[1] * r) * Math.cos((q[0] - p[0]) * r);
  return (Math.atan2(y, x) / r + 360) % 360;
}
const DIRS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
const arrowSvg = deg => `<svg width="18" height="18" viewBox="0 0 24 24" style="transform:rotate(${Math.round(deg)}deg);flex:none" aria-label="Hacia el ${DIRS[Math.round(deg / 45) % 8]}"><path d="M12 3l5 7h-3.5v11h-3V10H7z" fill="currentColor"/></svg>`;
// distancia mínima entre fronteras (puntos de los contornos generales), con caché
const _pts = {};
function borderPts(id) {
  if (_pts[id]) return _pts[id];
  const f = D.byId[id]; const g = HD.lo[id] || (f && f.geometry); if (!g) return (_pts[id] = []);
  const all = []; const walk = c => typeof c[0] === 'number' ? all.push(c) : c.forEach(walk); walk(g.coordinates);
  const step = Math.max(1, Math.floor(all.length / 500));
  return (_pts[id] = all.filter((_, i) => i % step === 0).map(p => D.proj.invert(p)).filter(Boolean));
}
function borderDist(a, b) {
  if (a === b) return 0;
  if ((D.info[a].borders || []).includes(b)) return 0;
  const A = borderPts(a), B = borderPts(b); if (!A.length || !B.length) return capDist(a, b) || 0;
  let m = Infinity; for (const p of A) for (const q of B) { const d = d3.geoDistance(p, q); if (d < m) m = d; }
  return m * 6371;
}
const HEAT = ['#f6e7c8', '#f2c48a', '#ea9455', '#d9622e', '#b8361d', '#7e1a10'];
const heat = km => km <= 0 ? HEAT[5] : km < 500 ? HEAT[4] : km < 1500 ? HEAT[3] : km < 3000 ? HEAT[2] : km < 6000 ? HEAT[1] : HEAT[0];

const TRIVIA = {
  view: 'home', g: null, _t: null,
  st() { const s = STORE.d.set.trivia = STORE.d.set.trivia || {}; s.cfg = Object.assign({ regs: [], diff: 2, terr: false, metric: 'area', clock: 'cap', secs: 60 }, s.cfg || {}); s.rec = s.rec || {}; s.plays = s.plays || {}; s.fails = s.fails || { hl: {}, route: {} }; s.daily = s.daily || {}; return s; },
  save() { STORE.save(); },
  enter() { MAP.setMode('political'); MAP.hoverEnabled = false; this.reset(); if (this.view === 'game' && this.g && !this.g.over) this.render(); else { this.view = 'home'; this.home(); } },
  leave() { this.stop(); QUIZ.silo(null); MAP.paintPolitical(); MAP.hoverEnabled = true; },
  reset() { this.stop(); MAP.clearOverlays(); MAP.paintPolitical(); MAP.cty.classed('f-q f-ok f-bad', false); MAP.mk.classed('f-q f-ok f-bad', false); },
  stop() { clearTimeout(this._t); this._t = null; clearInterval(this._clk); const b = $('#tnext'); if (b) b.classList.remove('timer'); },
  hover() { tooltip(null); },
  resized() { const g = this.g; if (this.view === 'game' && g && g.k === 'sil' && !g.done) QUIZ.silo(g.id); },
  /* ---------- conjunto de países según los ajustes ---------- */
  pool(opts = {}) {
    const c = this.st().cfg, I = D.info;
    let ids = D.states.filter(id => D.byId[id]);
    if (opts.terr && c.terr && !(this.g && this.g.daily)) ids = ids.concat(Object.keys(I).filter(id => I[id].kind === 'territory' && D.byId[id]));
    const regs = this.g && this.g.daily ? [] : c.regs; // el reto del día es igual para todos
    if (regs.length) ids = ids.filter(id => regs.includes(I[id].reg) || (I[id].sov && I[I[id].sov] && regs.includes(I[I[id].sov].reg)));
    const diff = opts.diff || c.diff;
    if (diff < 3) ids = ids.filter(id => !D.tinySet.has(id));
    if (diff === 1 && !regs.length) { const top = new Set(D.states.slice().sort((a, b) => (I[b].pop || 0) - (I[a].pop || 0)).slice(0, 100)); ids = ids.filter(id => top.has(id)); }
    return ids;
  },
  rnd() { return this.g && this.g.rng ? this.g.rng() : Math.random(); },
  pick(a) { return a[Math.floor(this.rnd() * a.length)]; },
  shuf(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  /* ---------- portada ---------- */
  home() {
    this.view = 'home'; this.g = null; this.reset(); QUIZ.silo(null); MAP.home();
    const s = this.st(), c = s.cfg, today = new Date().toISOString().slice(0, 10), d = s.daily[today];
    const rec = k => s.rec[k] != null ? `<span class="muted">Récord</span> ${TRV_GAMES.find(g => g.k === k).rec(s.rec[k])}` : '<span class="muted">Sin jugar</span>';
    setPanel(`<div class="stack">
      <div><h1>Trivia</h1><p class="muted" style="margin-top:6px">Partidas cortas para comparar países y moverte por el mapa.</p></div>
      <div class="card daily">
        <div class="row" style="justify-content:space-between;align-items:baseline"><h3>Reto del día</h3><span class="small muted">${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span></div>
        ${d ? `<p class="dgrid" aria-label="Resultado del reto">${d.res.map(r => `<span class="dsq ${r}"></span>`).join('')}<b>${d.res.filter(r => r === 'g').length}/5</b></p><div class="row"><button class="btn" id="dshare">Copiar resultado</button><span class="small muted">Vuelve mañana para el siguiente. Racha: ${this.dailyStreak()} ${this.dailyStreak() === 1 ? 'día' : 'días'}.</span></div>`
          : `<p class="small muted">Cinco preguntas iguales para todo el mundo hoy: dos comparaciones, una ordenación, un recorrido y una silueta. Solo se juega una vez.</p><button class="btn primary" id="dplay">Jugar el reto de hoy</button>`}
      </div>
      <ul class="games">${TRV_GAMES.map(g => `<li><button data-game="${g.k}"><span><b>${g.n}</b><span class="small muted">${g.d}</span></span><span class="small rec">${rec(g.k)}</span></button></li>`).join('')}</ul>
      <details class="sec" id="tset"><summary>Ajustes de los juegos</summary><div class="setup" style="margin-top:12px">
        <fieldset><legend>Región</legend><div class="chips"><button class="chip" data-treg="" aria-pressed="${!c.regs.length}">Todo el mundo</button>${REGIONS.map(r => `<button class="chip" data-treg="${r}" aria-pressed="${c.regs.includes(r)}">${r}</button>`).join('')}</div></fieldset>
        <fieldset><legend>Dificultad</legend><div class="seg">${TRV_DIFF.map(x => `<button data-tdiff="${x.k}" aria-pressed="${c.diff === x.k}">${x.n}</button>`).join('')}</div><p class="small muted">Fácil: los 100 países más poblados (o los de tu región). Media: todos menos los microestados. Difícil: todos.</p></fieldset>
        <label class="toggle"><input type="checkbox" id="tterr" ${c.terr ? 'checked' : ''}>Incluir territorios dependientes en los juegos de comparar</label>
      </div></details>
    </div>`);
    const B = $('#panelBody');
    $$('[data-game]', B).forEach(b => b.onclick = () => this.setup(b.dataset.game));
    const dp = $('#dplay', B); if (dp) dp.onclick = () => this.dailyStart();
    const ds = $('#dshare', B); if (ds) ds.onclick = () => this.share(today);
    $$('[data-treg]', B).forEach(b => b.onclick = () => { const r = b.dataset.treg; c.regs = !r ? [] : c.regs.includes(r) ? c.regs.filter(x => x !== r) : [...c.regs, r]; this.save(); this.home(); $('#tset').open = true; });
    $$('[data-tdiff]', B).forEach(b => b.onclick = () => { c.diff = +b.dataset.tdiff; this.save(); this.home(); $('#tset').open = true; });
    $('#tterr', B).onchange = e => { c.terr = e.target.checked; this.save(); };
  },
  head(title, sub) { return `<div class="panel-top"><button class="xbtn" id="tback"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>Juegos</button>${sub ? `<span class="small muted num">${sub}</span>` : ''}</div><div class="eyebrow">${title}</div>`; },
  bindHead() { const b = $('#tback'); if (b) b.onclick = () => { if (this.g && this.g.daily && !this.g.over) { if (!confirmLeave()) return; } this.home(); }; },
  /* ---------- preparación de cada juego ---------- */
  setup(k) {
    const c = this.st().cfg, G = TRV_GAMES.find(g => g.k === k);
    if (k === 'route' || k === 'sil' || k === 'globle') return this.start(k);
    this.view = 'setup'; this.reset(); MAP.home();
    let body = '';
    if (k === 'hl' || k === 'ord') body = `<fieldset class="setup"><legend>Qué se compara</legend><div class="chips">${TRV_METRICS.map(m => `<button class="chip" data-met="${m.k}" aria-pressed="${c.metric === m.k}">${m.n}</button>`).join('')}</div></fieldset>`;
    if (k === 'clock') body = `<fieldset class="setup"><legend>Modalidad</legend><div class="chips">${[['cap', 'Capitales'], ['flag', 'Banderas'], ['name', 'Nombra los países de un continente']].map(([v, n]) => `<button class="chip" data-clk="${v}" aria-pressed="${c.clock === v}">${n}</button>`).join('')}</div></fieldset>
      <fieldset class="setup"><legend>Tiempo</legend><div class="seg">${[60, 180, 300].map(t => `<button data-secs="${t}" aria-pressed="${c.secs === t}">${t / 60} min</button>`).join('')}</div></fieldset>
      ${c.clock === 'name' ? `<fieldset class="setup"><legend>Continente</legend><div class="chips">${REGIONS.map(r => `<button class="chip" data-creg="${r}" aria-pressed="${(c.creg || 'Europa') === r}">${r}</button>`).join('')}</div></fieldset>` : ''}`;
    setPanel(`<div class="stack">${this.head('')}<h1>${G.n}</h1><p class="muted">${G.d}</p>${body}<button class="btn primary" id="tgo" style="justify-self:start;height:44px;padding:0 22px">Empezar</button></div>`);
    this.bindHead();
    const B = $('#panelBody');
    $$('[data-met]', B).forEach(b => b.onclick = () => { c.metric = b.dataset.met; this.save(); this.setup(k); });
    $$('[data-clk]', B).forEach(b => b.onclick = () => { c.clock = b.dataset.clk; this.save(); this.setup(k); });
    $$('[data-secs]', B).forEach(b => b.onclick = () => { c.secs = +b.dataset.secs; this.save(); this.setup(k); });
    $$('[data-creg]', B).forEach(b => b.onclick = () => { c.creg = b.dataset.creg; this.save(); this.setup(k); });
    $('#tgo', B).onclick = () => this.start(k);
  },
  start(k, opts = {}) {
    this.stop(); this.reset(); QUIZ.silo(null);
    const c = this.st().cfg;
    this.view = 'game';
    this.g = Object.assign({ k, score: 0, over: false, rng: opts.seed != null ? mulberry32(opts.seed) : null, daily: !!opts.daily }, opts.g || {});
    const g = this.g;
    if (k === 'hl') { g.m = opts.metric || c.metric; g.ids = this.pool({ terr: true, diff: opts.diff }).filter(id => trvVal(g.m, id) != null); g.a = this.pick(g.ids); this.hlNext(); }
    if (k === 'ord') { g.m = opts.metric || c.metric; g.ids = this.pool({ terr: true, diff: opts.diff }).filter(id => trvVal(g.m, id) != null); g.round = 0; g.rounds = opts.rounds || 5; this.ordNext(); }
    if (k === 'route') { g.round = 0; this.routeNew(opts); }
    if (k === 'sil') { g.round = 0; g.rounds = opts.rounds || 5; this.silNext(opts); }
    if (k === 'globle') { this.globleNew(); }
    if (k === 'clock') { this.clockNew(); }
  },
  /* resultado común: auto-avance con cuenta atrás que se para tocando el mensaje */
  auto(ok, fn, fbSel = '.fb.ok, .fb.bad') {
    const dur = ok ? 1200 : 2500;
    const b = $('#tnext'); if (b) { b.style.setProperty('--dur', dur + 'ms'); b.classList.add('timer'); b.onclick = () => { this.stop(); fn(); }; }
    const fb = $(fbSel); if (fb) { fb.classList.add('pausable'); fb.title = 'Toca para quedarte aquí'; fb.onclick = () => { this.stop(); fb.classList.remove('pausable'); }; }
    const g = this.g; this._t = setTimeout(() => { this._t = null; if (this.g === g && APP.tab === 'trivia') fn(); }, dur);
  },
  record(k, v, better = (a, b) => a > b) { const s = this.st(); s.plays[k] = (s.plays[k] || 0) + 1; const nw = s.rec[k] == null || better(v, s.rec[k]); if (nw) s.rec[k] = v; this.save(); return nw; },
  fail(game, ids) { const f = this.st().fails[game]; for (const id of ids) f[id] = (f[id] || 0) + 1; this.save(); },
  chipsGo(ids) { return `<div class="chips">${ids.map(id => `<button class="chip" data-go="${id}">${esc(nameOf(id))}</button>`).join('')}</div>`; },
  bindGo() { $$('[data-go]', $('#panelBody')).forEach(b => b.onclick = () => { this.stop(); switchTab('explorar'); EXPLORE.select(b.dataset.go); }); },
  over(html) {
    const g = this.g; g.over = true; this.stop();
    if (g.daily) return this.dailyStep(g.dres);
    setPanel(`<div class="stack">${this.head(TRV_GAMES.find(x => x.k === g.k).n)}${html}<div class="row"><button class="btn primary" id="tagain" style="height:44px">Jugar otra vez</button><button class="btn" id="thome" style="height:44px">Otros juegos</button></div><p class="small muted">Toca un país del mapa o de la lista para ver su ficha.</p></div>`);
    this.bindHead(); this.bindGo();
    $('#tagain').onclick = () => this.start(g.k, { metric: g.m }); $('#thome').onclick = () => this.home();
  },
  click(id) {
    const g = this.g; if (!id) return;
    const f = D.byId[id]; const real = f && f.properties && f.properties.kind === 'far' ? f.properties.sov : id;
    if (this.view !== 'game' || !g) return;
    if (g.over && !g.daily) { switchTab('explorar'); EXPLORE.select(real); return; }
    if (g.k === 'route' && !g.done) this.routeGuess(real);
  },
  key(e) {
    if (APP.tab !== 'trivia' || !this.g) return; const g = this.g; if (e.target && e.target.tagName === 'INPUT') return;
    if (!g.done && (g.k === 'hl') && (e.key === '1' || e.key === '2')) { const b = $$('[data-hl]')[+e.key - 1]; if (b) b.click(); }
  },
  /* ---------- 1. ¿Más o menos? ---------- */
  hlNext() {
    const g = this.g; g.done = false; this.reset(); MAP.home();
    let b = null; for (let i = 0; i < 400 && !b; i++) { const x = this.pick(g.ids); if (x !== g.a && trvApart(g.m, g.a, x) && !(g.seen || []).includes(x)) b = x; }
    if (!b) b = g.ids.find(x => x !== g.a && trvApart(g.m, g.a, x));
    g.b = b; g.seen = (g.seen || []).concat(b).slice(-30); g.pair = this.rnd() < 0.5 ? [g.a, g.b] : [g.b, g.a];
    this.hlRender();
  },
  hlRender() {
    const g = this.g, M = TRV_METRICS.find(x => x.k === g.m);
    const card = (id, i) => { const win = g.done && id === g.win, lose = g.done && id === g.chosen && id !== g.win;
      return `<button class="vs ${win ? 'ok' : lose ? 'bad' : ''}" data-hl="${id}" ${g.done ? 'disabled' : ''}>${flagBox(id, isLandPhone() ? 40 : 56, 'vsflag')}<b>${esc(nameOf(id))}</b>${g.done ? `<span class="small">${trvFmt(g.m, trvVal(g.m, id))}</span>` : (isMobile() ? '' : `<span class="small muted">${i ? '2' : '1'}</span>`)}</button>`; };
    const fb = g.done ? `<div class="fb ${g.ok ? 'ok' : 'bad'}"><b>${g.ok ? '¡Bien!' : 'No.'}</b> ${esc(nameOf(g.pair[0]))}: ${trvFmt(g.m, trvVal(g.m, g.pair[0]))} · ${esc(nameOf(g.pair[1]))}: ${trvFmt(g.m, trvVal(g.m, g.pair[1]))}.</div>` : '';
    setPanel(`<div class="stack">${g.daily ? this.dailyHead() : this.head('¿Más o menos?', `Racha ${g.score}`)}
      <h2 class="qprompt">${M.q}</h2>
      <div class="vsrow${g.done ? '' : ' fresh'}">${card(g.pair[0], 0)}${card(g.pair[1], 1)}</div>
      ${fb}${g.done && g.ok && !g.daily ? '<button class="btn primary" id="tnext" style="justify-self:start">Siguiente</button>' : ''}
      <p class="small muted">${['area', 'pop', 'dens'].includes(g.m) ? `Datos de población y superficie con referencia a ${REF_DATE}.` : g.m === 'cappop' ? 'Población de la ciudad, no de su área metropolitana.' : g.m === 'nb' ? 'Solo fronteras terrestres con otros Estados.' : 'Se compara la posición de la capital.'}</p>
    </div>`);
    this.bindHead();
    $$('[data-hl]').forEach(b => b.onclick = () => this.hlAnswer(b.dataset.hl));
    $$('.vsrow.fresh').forEach(o => o.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') o.classList.remove('fresh'); }, { once: true }));
  },
  hlAnswer(id) {
    const g = this.g; if (g.done) return;
    const [x, y] = g.pair; g.win = trvScore(g.m, x) > trvScore(g.m, y) ? x : y; g.chosen = id; g.ok = id === g.win; g.done = true;
    MAP.cty.filter(d => d.id === g.win).classed('f-ok', true); MAP.cty.filter(d => d.id !== g.win && (d.id === x || d.id === y)).classed(g.ok ? 'f-q' : 'f-bad', true);
    MAP.fit(boundsOf([rectF(homeBounds(x)), rectF(homeBounds(y))]), { maxK: 8 });
    if (g.daily) { g.dres = g.ok ? 'g' : 'r'; this.hlRender(); return this.auto(g.ok, () => this.over()); }
    if (g.ok) { g.score++; this.hlRender(); this.auto(true, () => { g.a = g.win; this.hlNext(); }); }
    else {
      this.fail('hl', [id]); const nw = this.record('hl', g.score); this.hlRender();
      this.auto(false, () => this.over(`<div class="result"><span class="big num">${g.score}</span><span>${g.score === 1 ? 'acierto seguido' : 'aciertos seguidos'}${nw && g.score ? ' · nuevo récord' : ''}</span></div>
        <p>${esc(nameOf(g.win))} (${trvFmt(g.m, trvVal(g.m, g.win))}) contra ${esc(nameOf(id))} (${trvFmt(g.m, trvVal(g.m, id))}).</p>${this.chipsGo([g.win, id])}`));
    }
  },
  /* ---------- 2. Ordena ---------- */
  ordNext() {
    const g = this.g; g.done = false; g.sel = []; this.reset(); MAP.home();
    let set = null;
    for (let t = 0; t < 300 && !set; t++) { const s = this.shuf(g.ids).slice(0, 5); let ok = true; for (let i = 0; i < 5 && ok; i++) for (let j = i + 1; j < 5 && ok; j++) if (!trvApart(g.m, s[i], s[j])) ok = false; if (ok) set = s; }
    g.set = set; g.truth = set.slice().sort((a, b) => trvScore(g.m, b) - trvScore(g.m, a));
    this.ordRender();
  },
  ordRender() {
    const g = this.g, M = TRV_METRICS.find(x => x.k === g.m);
    const pos = id => g.sel.indexOf(id);
    const rows = g.done
      ? g.truth.map((id, i) => { const ok = g.sel[i] === id; return `<li class="ordrow ${ok ? 'ok' : 'bad'}"><span class="pos num">${i + 1}</span>${flagBox(id, 22, 'inl')}<span>${esc(nameOf(id))}${ok ? '' : `<span class="small" style="display:block">la pusiste en ${g.sel.indexOf(id) + 1}.º lugar</span>`}</span><span class="meta num">${trvFmt(g.m, trvVal(g.m, id))}</span></li>`; }).join('')
      : g.set.map(id => `<li><button class="ordrow${pos(id) >= 0 ? ' on' : ''}" data-ord="${id}"><span class="pos num">${pos(id) >= 0 ? pos(id) + 1 : ''}</span>${flagBox(id, 22, 'inl')}<span>${esc(nameOf(id))}</span></button></li>`).join('');
    const right = g.done ? g.truth.filter((id, i) => g.sel[i] === id).length : 0;
    setPanel(`<div class="stack">${g.daily ? this.dailyHead() : this.head('Ordena', `Ronda ${g.round + 1} de ${g.rounds} · ${g.score} puntos`)}
      <h2 class="qprompt">Ordénalos ${M.ord}</h2>
      ${g.done ? '' : '<p class="small muted">Toca los países en orden. Para corregir, vuelve a tocar el último.</p>'}
      <ol class="ordlist${g.done ? '' : ' fresh'}">${rows}</ol>
      ${g.done ? `<div class="fb ${right === 5 ? 'ok' : 'bad'}"><b>${right} de 5 en su sitio.</b></div>${g.daily ? '' : `<button class="btn primary" id="tnext" style="justify-self:start">${g.round + 1 < g.rounds ? 'Siguiente' : 'Ver resultado'}</button>`}` : ''}
    </div>`);
    this.bindHead();
    $$('[data-ord]').forEach(b => b.onclick = () => { const id = b.dataset.ord; const i = g.sel.indexOf(id); if (i >= 0) { if (i === g.sel.length - 1) g.sel.pop(); else return; } else g.sel.push(id); if (g.sel.length === 5) this.ordCheck(); else this.ordRender(); });
  },
  ordCheck() {
    const g = this.g; g.done = true; const right = g.truth.filter((id, i) => g.sel[i] === id).length; g.score += right;
    MAP.cty.filter(d => g.set.includes(d.id)).classed('f-q', true); MAP.fit(boundsOf(g.set.map(id => rectF(homeBounds(id)))), { maxK: 6 });
    this.ordRender();
    if (g.daily) { g.dres = right === 5 ? 'g' : right >= 3 ? 'y' : 'r'; return this.auto(right === 5, () => this.over()); }
    const nextFn = () => { g.round++; if (g.round < g.rounds) this.ordNext(); else { const nw = this.record('ord', g.score); this.over(`<div class="result"><span class="big num">${g.score}</span><span>de ${g.rounds * 5} posiciones${nw ? ' · nuevo récord' : ''}</span></div>`); } };
    this.auto(right === 5, nextFn);
  },
  /* ---------- 3. Recorrido ---------- */
  graph() {
    if (this._gr) return this._gr; const G = {};
    for (const id of D.states) G[id] = (D.info[id].borders || []).filter(b => D.info[b] && D.info[b].state && D.byId[b]);
    for (const id of Object.keys(G)) for (const b of G[id]) if (!G[b].includes(id)) G[b].push(id);
    return (this._gr = G);
  },
  bfs(s, allowed) { const G = this.graph(); const dist = { [s]: 0 }, q = [s]; while (q.length) { const x = q.shift(); for (const y of G[x] || []) if (dist[y] == null && (!allowed || allowed.has(y))) { dist[y] = dist[x] + 1; q.push(y); } } return dist; },
  routeNew(opts = {}) {
    const g = this.g, c = this.st().cfg, diff = opts.diff || c.diff; this.reset();
    const [lo, hi] = diff === 1 ? [3, 4] : diff === 2 ? [4, 5] : [5, 7];
    const pool = this.pool({ diff: Math.max(2, diff) }).filter(id => this.graph()[id] && this.graph()[id].length);
    let s, e;
    for (let t = 0; t < 500 && !e; t++) { s = this.pick(pool); const d = this.bfs(s); const cands = Object.keys(d).filter(x => d[x] >= lo && d[x] <= hi && pool.includes(x)); if (cands.length) e = this.pick(cands); }
    const ds = this.bfs(s), de = this.bfs(e); const L = ds[e];
    g.s = s; g.e = e; g.L = L; g.need = L - 1; g.max = g.need + (diff === 1 ? 5 : 4);
    g.onPath = new Set(Object.keys(ds).filter(x => de[x] != null && ds[x] + de[x] === L && x !== s && x !== e));
    g.near = new Set(Object.keys(ds).filter(x => de[x] != null && ds[x] + de[x] <= L + 2));
    g.guesses = []; g.done = false; g.hints = 0;
    MAP.paint(id => id === s || id === e ? 'var(--hue)' : 'var(--m0)'); MAP.cty.attr('class', 'cty');
    const ids = [s, e, ...g.onPath]; MAP.fit(boundsOf(ids.map(id => rectF(homeBounds(id)))), { maxK: 8 });
    this.routeRender();
  },
  routeLinked() { const g = this.g; const allow = new Set([...g.guesses, g.e]); const d = this.bfs(g.s, allow); return d[g.e] != null; },
  routeStatus(id) { const g = this.g; return g.onPath.has(id) ? 'ok' : g.near.has(id) ? 'warn' : 'bad'; },
  routeGuess(id) {
    const g = this.g; if (g.done || !id || !D.info[id] || id === g.s || id === g.e || g.guesses.includes(id)) return;
    if (!D.info[id].state) { toast('Solo cuentan los Estados'); return; }
    g.guesses.push(id);
    const st = this.routeStatus(id); MAP.cty.filter(d => d.id === id).style('fill', st === 'ok' ? 'var(--positive)' : st === 'warn' ? 'var(--dispute-orange)' : 'var(--negative)');
    if (this.routeLinked()) { g.done = true; g.win = true; }
    else if (g.guesses.length >= g.max) { g.done = true; g.win = false; }
    if (g.done) this.routeEnd(); else this.routeRender();
  },
  routeHint() { const g = this.g; const allow = new Set([...g.guesses, g.s]); const reach = this.bfs(g.s, new Set([...allow])); const de = this.bfs(g.e);
    // siguiente país del camino más corto desde lo ya conectado
    let best = null, bd = Infinity; for (const x of g.onPath) if (!g.guesses.includes(x)) { const touch = (this.graph()[x] || []).some(y => reach[y] != null || y === g.s); if (touch && de[x] < bd) { bd = de[x]; best = x; } }
    if (!best) best = [...g.onPath].find(x => !g.guesses.includes(x));
    if (best) { g.hints++; this.routeGuess(best); }
  },
  routeEnd() {
    const g = this.g; const extra = g.guesses.length - g.need; const pts = g.win ? Math.max(1, 10 - Math.max(0, extra) * 2 - g.hints * 2) : 0;
    const path = [...g.onPath]; MAP.cty.filter(d => path.includes(d.id) && !g.guesses.includes(d.id)).style('fill', 'var(--m2)');
    if (g.daily) { g.dres = g.win ? (extra <= 1 && !g.hints ? 'g' : 'y') : 'r'; this.routeRender(); return this.auto(g.win, () => this.over()); }
    if (!g.win) this.fail('route', path.filter(x => !g.guesses.includes(x)));
    g.score += pts; g.round++; this.routeRender();
    if (g.round >= 5) { const nw = this.record('route', g.score); this.auto(g.win, () => this.over(`<div class="result"><span class="big num">${g.score}</span><span>puntos en 5 recorridos${nw ? ' · nuevo récord' : ''}</span></div>`)); }
    else this.auto(g.win, () => this.routeNew());
  },
  routeRender() {
    const g = this.g; const st = id => this.routeStatus(id);
    const shortest = [...g.onPath];
    setPanel(`<div class="stack">${g.daily ? this.dailyHead() : this.head('Recorrido', `Ruta ${Math.min(g.round + 1, 5)} de 5 · ${g.score} puntos`)}
      <h2 class="qprompt">De ${esc(nameOf(g.s))} a ${esc(nameOf(g.e))}</h2>
      <p class="small muted">El camino más corto pasa por ${g.need} ${g.need === 1 ? 'país' : 'países'}. Escríbelos o tócalos en el mapa. Te quedan ${g.max - g.guesses.length} intentos.</p>
      ${g.done ? '' : `<div class="cin"><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe un país…" aria-label="País"><div class="sugg" id="tsugg" hidden></div></div>`}
      <ul class="glist">${g.guesses.map(id => `<li class="${st(id)}"><span class="dot"></span>${esc(nameOf(id))}<span class="meta">${st(id) === 'ok' ? 'en el camino' : st(id) === 'warn' ? 'cerca' : 'lejos'}</span></li>`).join('')}</ul>
      ${g.done ? `<div class="fb ${g.win ? 'ok' : 'bad'}"><b>${g.win ? '¡Conectados!' : 'Se acabaron los intentos.'}</b> Un camino más corto: ${[g.s, ...this.onePath(), g.e].map(nameOf).map(esc).join(' → ')}.</div>${g.daily ? '' : `<button class="btn primary" id="tnext" style="justify-self:start">${g.round >= 5 ? 'Ver resultado' : 'Siguiente ruta'}</button>`}`
        : `<div class="row"><button class="btn" id="thint">Pista: el siguiente país</button><button class="btn" id="tgive">Rendirme</button></div>`}
      <div class="legendrow small muted"><span><i style="background:var(--positive)"></i>En un camino más corto</span><span><i style="background:var(--dispute-orange)"></i>Cerca</span><span><i style="background:var(--negative)"></i>Lejos</span></div>
    </div>`);
    this.bindHead();
    if (!g.done) { this.countryInput($('#tin'), $('#tsugg'), id => this.routeGuess(id)); const h = $('#thint'); h.onclick = () => this.routeHint(); $('#tgive').onclick = () => { g.done = true; g.win = false; this.routeEnd(); }; if (!isMobile()) $('#tin').focus(); }
  },
  onePath() { const g = this.g; const de = this.bfs(g.e); const out = []; let x = g.s; const G = this.graph(); while (x !== g.e) { const n = (G[x] || []).filter(y => de[y] === de[x] - 1); const pick = n.find(y => g.guesses.includes(y)) || n[0]; if (!pick || pick === g.e) break; out.push(pick); x = pick; } return out; },
  /* campo de texto con sugerencias de países */
  countryInput(inp, sg, onPick, filter = id => D.info[id].state) {
    let hits = [], cur = 0;
    const render = () => { sg.hidden = !hits.length; sg.innerHTML = hits.map((h, i) => `<button type="button" data-id="${h.id}" class="${i === cur ? 'on' : ''}"><img alt="" src="${flagUrl(h.id)}">${esc(h.name)}</button>`).join(''); };
    inp.oninput = () => { const q = norm(inp.value); cur = 0; hits = !q ? [] : D.searchIdx.filter(x => !x.id.includes('-') && filter(x.id) && (x.n.startsWith(q) || x.n.includes(' ' + q) || x.alts.some(a => a.startsWith(q)))).sort((a, b) => (b.n.startsWith(q) - a.n.startsWith(q)) || a.n.localeCompare(b.n)).slice(0, 6); render(); };
    const pick = id => { hits = []; render(); inp.value = ''; onPick(id); };
    inp.onkeydown = e => { if (e.key === 'ArrowDown') { cur = Math.min(hits.length - 1, cur + 1); render(); e.preventDefault(); } else if (e.key === 'ArrowUp') { cur = Math.max(0, cur - 1); render(); e.preventDefault(); } else if (e.key === 'Enter') { e.preventDefault(); if (hits[cur]) pick(hits[cur].id); else { const q = norm(inp.value); const ex = D.searchIdx.find(x => filter(x.id) && (x.n === q || x.alts.includes(q))); if (ex) pick(ex.id); else if (q) toast('No encuentro ese país'); } } };
    sg.onclick = e => { const b = e.target.closest('button'); if (b) pick(b.dataset.id); };
  },
  /* ---------- 4. Silueta con pistas ---------- */
  silNext(opts = {}) {
    const g = this.g; this.reset(); g.done = false; g.tries = [];
    const pool = this.pool({ diff: opts.diff }).filter(id => !D.tinySet.has(id) && capLL(id));
    let id; for (let t = 0; t < 50; t++) { id = this.pick(pool); if (!(g.seen || []).includes(id)) break; } g.id = id; g.seen = (g.seen || []).concat(id);
    QUIZ.silo(id); MAP.home(0); this.silRender();
  },
  silRender() {
    const g = this.g;
    const rows = g.tries.map(t => t.id === g.id ? `<li class="ok"><span class="dot"></span>${esc(nameOf(t.id))}<span class="meta">¡Es este!</span></li>` : `<li><span>${esc(nameOf(t.id))}</span><span class="meta num">${nf.format(Math.round(t.km / 10) * 10)} km</span>${arrowSvg(t.b)}</li>`).join('');
    setPanel(`<div class="stack">${g.daily ? this.dailyHead() : this.head('Silueta con pistas', `Ronda ${g.round + 1} de ${g.rounds} · ${g.score} puntos`)}
      <h2 class="qprompt">¿Qué país es?</h2>
      ${g.done ? '' : `<div class="cin"><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Intento ${g.tries.length + 1} de 6…" aria-label="País"><div class="sugg" id="tsugg" hidden></div></div>`}
      <ul class="glist tries">${rows}${Array.from({ length: Math.max(0, 6 - g.tries.length) }, () => '<li class="empty"><span>&nbsp;</span></li>').join('')}</ul>
      ${g.done ? `<div class="fb ${g.win ? 'ok' : 'bad'}"><b>${g.win ? `¡Acertado en ${g.tries.length}!` : 'No era fácil.'}</b> Es ${esc(nameOf(g.id))}${D.info[g.id].cap ? `, capital ${esc(D.info[g.id].cap)}` : ''}.</div>${this.chipsGo([g.id])}${g.daily ? '' : `<button class="btn primary" id="tnext" style="justify-self:start">${g.round + 1 < g.rounds ? 'Siguiente' : 'Ver resultado'}</button>`}`
        : '<p class="small muted">Tras cada fallo verás la distancia entre las capitales y la dirección en la que está el país que buscas.</p>'}
    </div>`);
    this.bindHead(); this.bindGo();
    if (!g.done) { this.countryInput($('#tin'), $('#tsugg'), id => this.silGuess(id)); if (!isMobile()) $('#tin').focus(); }
  },
  silGuess(id) {
    const g = this.g; if (g.done || g.tries.some(t => t.id === id)) return;
    g.tries.push({ id, km: capDist(id, g.id) || 0, b: bearing(id, g.id) });
    if (id === g.id || g.tries.length >= 6) {
      g.done = true; g.win = id === g.id; QUIZ.silo(null);
      this.markReveal(g.id, g.win);
      const pts = g.win ? 7 - g.tries.length : 0;
      if (g.daily) { g.dres = g.win ? (g.tries.length <= 3 ? 'g' : 'y') : 'r'; this.silRender(); return this.auto(g.win, () => this.over()); }
      g.score += pts; this.silRender();
      const nx = () => { g.round++; if (g.round < g.rounds) this.silNext(); else { const nw = this.record('sil', g.score); this.over(`<div class="result"><span class="big num">${g.score}</span><span>de ${g.rounds * 6} puntos${nw ? ' · nuevo récord' : ''}</span></div>`); } };
      return this.auto(g.win, nx);
    }
    this.silRender();
  },
  markReveal(id, ok) {
    MAP.cty.filter(d => d.id === id || (d.properties && d.properties.kind === 'far' && d.properties.sov === id)).classed(ok ? 'f-ok' : 'f-q', true);
    QUIZ.flyContext(id, 4);
    const e = D.info[id]; const p = e.lab ? D.proj([e.lab[0], e.lab[1]]) : D.path.centroid(D.byId[id]);
    MAP.gTop.append('text').attr('class', 'lbl').attr('x', p[0]).attr('y', p[1]).attr('font-size', '1.15em').style('font-weight', 600).text(e.name); MAP.onZoom();
  },
  /* ---------- 5. Frío o caliente ---------- */
  globleNew() {
    const g = this.g; this.reset(); g.id = this.pick(this.pool().filter(id => !D.tinySet.has(id))); g.tries = []; g.done = false;
    MAP.paint(() => 'var(--m0)'); MAP.home(); this.globleRender();
  },
  globleGuess(id) {
    const g = this.g; if (g.done || g.tries.some(t => t.id === id)) return;
    const km = id === g.id ? -1 : borderDist(id, g.id); g.tries.push({ id, km });
    MAP.cty.filter(d => d.id === id || (d.properties && d.properties.kind === 'far' && d.properties.sov === id)).style('fill', id === g.id ? 'var(--positive)' : heat(km));
    if (id === g.id) {
      g.done = true; this.markReveal(id, true); const n = g.tries.length; const nw = this.record('globle', n, (a, b) => a < b);
      this.globleRender();
      return this.auto(true, () => this.over(`<div class="result"><span class="big num">${n}</span><span>${n === 1 ? 'intento' : 'intentos'}${nw ? ' · nuevo récord' : ''}</span></div><p>Era ${esc(nameOf(id))}.</p>${this.chipsGo([id, ...g.tries.slice().sort((a, b) => a.km - b.km).slice(1, 6).map(t => t.id)])}`));
    }
    this.globleRender();
  },
  globleRender() {
    const g = this.g; const sorted = g.tries.slice().sort((a, b) => a.km - b.km);
    const close = sorted.length ? sorted[0] : null;
    setPanel(`<div class="stack">${this.head('Frío o caliente', `${g.tries.length} ${g.tries.length === 1 ? 'intento' : 'intentos'}`)}
      <h2 class="qprompt">Encuentra el país secreto</h2>
      ${g.done ? '' : `<div class="cin"><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe un país…" aria-label="País"><div class="sugg" id="tsugg" hidden></div></div>`}
      ${close && !g.done ? `<p class="small">Lo más cerca hasta ahora: <b>${esc(nameOf(close.id))}</b>, ${close.km <= 0 ? 'que hace frontera con él' : `a ${nf.format(Math.round(close.km / 10) * 10)} km de su frontera`}.</p>` : '<p class="small muted">Cada país que escribas se pinta en el mapa: cuanto más oscuro y rojo, más cerca está del secreto. La distancia se mide entre fronteras.</p>'}
      <ul class="glist">${sorted.map(t => `<li><span class="dot" style="background:${t.km < 0 ? 'var(--positive)' : heat(t.km)}"></span>${esc(nameOf(t.id))}<span class="meta num">${t.km < 0 ? '¡Es este!' : t.km <= 0 ? 'vecino' : nf.format(Math.round(t.km / 10) * 10) + ' km'}</span></li>`).join('')}</ul>
      ${g.done ? '' : '<div class="row"><button class="btn" id="tgive">Rendirme</button></div>'}
      <div class="heatkey small muted"><span>Lejos</span>${HEAT.map(c => `<i style="background:${c}"></i>`).join('')}<span>Cerca</span></div>
    </div>`);
    this.bindHead();
    if (!g.done) { this.countryInput($('#tin'), $('#tsugg'), id => this.globleGuess(id)); if (!isMobile()) $('#tin').focus(); $('#tgive').onclick = () => { g.done = true; this.markReveal(g.id, false); this.over(`<p>Era <b>${esc(nameOf(g.id))}</b>.</p>${this.chipsGo([g.id])}`); }; }
  },
  /* ---------- 6. Contrarreloj ---------- */
  clockNew() {
    const g = this.g, c = this.st().cfg; g.mode = c.clock; g.secs = c.secs; g.left = c.secs; g.ok = 0; g.n = 0; g.done = false; this.reset();
    if (g.mode === 'name') { g.reg = c.creg || 'Europa'; g.targets = D.states.filter(id => D.info[id].reg === g.reg); g.found = []; MAP.paint(id => g.targets.includes(id) ? 'var(--m0)' : 'var(--raised)'); MAP.fit(boundsOf(g.targets.map(id => rectF(homeBounds(id)))), { maxK: 6 }); }
    else { g.ids = this.pool(); MAP.home(); this.clockQ(); }
    g.t0 = now();
    this._clk = setInterval(() => { g.left = Math.max(0, g.secs - Math.floor((now() - g.t0) / 1000)); const el = $('#tclock'); if (el) el.textContent = this.mmss(g.left); if (!g.left) this.clockEnd(); }, 250);
    this.clockRender();
  },
  mmss(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
  clockQ() { const g = this.g; const id = this.pick(g.ids.filter(x => x !== g.id)); g.id = id; const I = D.info; const peers = this.shuf(g.ids.filter(x => x !== id && I[x].reg === I[id].reg)).slice(0, 3); while (peers.length < 3) { const x = this.pick(g.ids); if (x !== id && !peers.includes(x)) peers.push(x); } g.opts = this.shuf([id, ...peers]); g.ans = null; },
  clockRender() {
    const g = this.g;
    let body = '';
    if (g.mode === 'name') {
      const miss = g.done ? g.targets.filter(id => !g.found.includes(id)) : [];
      body = `${g.done ? '' : `<div class="cin"><input id="tin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe un país de ${esc(g.reg)}…" aria-label="País"><div class="sugg" id="tsugg" hidden></div></div>`}
        <p class="small muted">${g.found.length} de ${g.targets.length} países.</p>
        ${g.done && miss.length ? `<div class="sec"><h4>Te faltaron</h4>${this.chipsGo(miss)}</div>` : ''}
        <div class="chips found">${g.found.map(id => `<span class="chip">${esc(nameOf(id))}</span>`).join('')}</div>`;
    } else if (!g.done) {
      body = g.mode === 'flag' ? `${flagBox(g.id, isLandPhone() ? 80 : 120, 'qflag')}<div class="opts fresh">${g.opts.map((o, i) => `<button class="opt ${g.ans ? (o === g.id ? 'ok' : o === g.ans ? 'bad' : '') : ''}" data-co="${o}" ${g.ans ? 'disabled' : ''}><span class="k">${i + 1}</span>${esc(nameOf(o))}</button>`).join('')}</div>`
        : `<h2 class="qprompt">${esc(nameOf(g.id))}</h2><div class="opts fresh">${g.opts.map((o, i) => `<button class="opt ${g.ans ? (o === g.id ? 'ok' : o === g.ans ? 'bad' : '') : ''}" data-co="${o}" ${g.ans ? 'disabled' : ''}><span class="k">${i + 1}</span>${esc(D.info[o].cap)}</button>`).join('')}</div>`;
    }
    setPanel(`<div class="stack">${this.head('Contrarreloj', g.mode === 'name' ? esc(g.reg) : g.mode === 'flag' ? 'Banderas' : 'Capitales')}
      <div class="clockrow"><span class="clock num" id="tclock">${this.mmss(g.left)}</span><span class="small muted">${g.mode === 'name' ? '' : `${g.ok} aciertos de ${g.n}`}</span></div>
      ${body}
      ${g.done && g.mode !== 'name' ? `<div class="result"><span class="big num">${g.ok}</span><span>aciertos de ${g.n}</span></div>` : ''}
      ${g.done ? `<div class="row"><button class="btn primary" id="tagain" style="height:44px">Jugar otra vez</button><button class="btn" id="thome" style="height:44px">Otros juegos</button></div>` : ''}
    </div>`);
    this.bindHead(); this.bindGo();
    if (g.done) { $('#tagain').onclick = () => this.start('clock'); $('#thome').onclick = () => this.home(); return; }
    if (g.mode === 'name') { this.countryInput($('#tin'), $('#tsugg'), id => this.clockName(id), id => D.info[id].state); if (!isMobile()) $('#tin').focus(); }
    $$('[data-co]').forEach(b => b.onclick = () => this.clockAns(b.dataset.co));
  },
  clockAns(v) { const g = this.g; if (g.done || g.ans) return; g.ans = v; g.n++; if (v === g.id) g.ok++; this.clockRender(); setTimeout(() => { if (this.g === g && !g.done) { this.clockQ(); this.clockRender(); } }, v === g.id ? 350 : 900); },
  clockName(id) {
    const g = this.g; if (g.done) return;
    if (!g.targets.includes(id)) { toast(`${nameOf(id)} no está en ${g.reg}`); return; }
    if (g.found.includes(id)) { toast('Ya lo tienes'); return; }
    g.found.push(id); MAP.cty.filter(d => d.id === id).style('fill', 'var(--hue)');
    if (g.found.length === g.targets.length) return this.clockEnd();
    this.clockRender(); $('#tin') && $('#tin').focus();
  },
  clockEnd() {
    const g = this.g; if (g.done) return; g.done = true; clearInterval(this._clk);
    const key = 'clock-' + g.mode + (g.mode === 'name' ? '-' + g.reg : '') + '-' + g.secs; const v = g.mode === 'name' ? g.found.length : g.ok;
    const s = this.st(); s.plays.clock = (s.plays.clock || 0) + 1; if (s.rec[key] == null || v > s.rec[key]) s.rec[key] = v; if (s.rec.clock == null || v > s.rec.clock) s.rec.clock = v; this.save();
    if (g.mode === 'name') MAP.cty.filter(d => g.targets.includes(d.id) && !g.found.includes(d.id)).style('fill', 'var(--negative)').style('fill-opacity', .55);
    g.over = true; this.clockRender();
  },
  /* ---------- reto del día ---------- */
  todayKey() { return new Date().toISOString().slice(0, 10); },
  dailyStreak() { const d = this.st().daily; let s = 0; const t = new Date(); if (!d[t.toISOString().slice(0, 10)]) t.setDate(t.getDate() - 1); while (d[t.toISOString().slice(0, 10)]) { s++; t.setDate(t.getDate() - 1); } return s; },
  dailyStart() {
    const k = this.todayKey(); if (this.st().daily[k]) return this.home();
    const seed = +k.replace(/-/g, ''); const r = mulberry32(seed);
    const pickM = arr => arr[Math.floor(r() * arr.length)];
    this.D = { k, seed, step: 0, res: [], plan: [['hl', pickM(['area', 'pop', 'north', 'south'])], ['hl', pickM(['dens', 'east', 'west', 'nb'])], ['ord', pickM(['area', 'pop', 'north', 'cappop'])], ['route'], ['sil']] };
    this.dailyStep();
  },
  dailyHead() { const D_ = this.D; return `<div class="panel-top"><button class="xbtn" id="tback"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>Juegos</button><span class="dgrid small">${[0, 1, 2, 3, 4].map(i => `<span class="dsq ${D_.res[i] || (i === D_.step ? 'cur' : '')}"></span>`).join('')}</span></div><div class="eyebrow">Reto del día · ${D_.step + 1} de 5</div>`; },
  dailyStep(res) {
    const D_ = this.D; if (!D_) return this.home();
    if (res) { D_.res.push(res); D_.step++; }
    if (D_.step >= 5) { const s = this.st(); s.daily[D_.k] = { res: D_.res }; this.save(); this.D = null; this.g = null; return this.home(); }
    const [k, m] = D_.plan[D_.step];
    this.start(k, { seed: D_.seed * 10 + D_.step, daily: true, metric: m, diff: 2, rounds: 1 });
  },
  /* tarjeta para la pestaña Progreso */
  progressCard() {
    const s = this.st(); const played = Object.values(s.plays).reduce((a, b) => a + b, 0) + Object.keys(s.daily).length;
    const worst = g => Object.entries(s.fails[g] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const wl = g => { const w = worst(g); return w.length ? w.map(([id, n]) => `${esc(nameOf(id))} <span class="muted">(${n})</span>`).join(', ') : '<span class="muted">Sin fallos todavía</span>'; };
    return `<div class="card stack"><div class="row" style="justify-content:space-between"><h3>Trivia</h3><span class="small muted">${played} ${played === 1 ? 'partida' : 'partidas'} · reto del día: racha de ${this.dailyStreak()} ${this.dailyStreak() === 1 ? 'día' : 'días'}</span></div>
      <dl class="facts">${TRV_GAMES.map(g => `<dt>${g.n}</dt><dd>${s.rec[g.k] != null ? g.rec(s.rec[g.k]) : '<span class="muted">Sin jugar</span>'}${s.plays[g.k] ? ` <span class="small muted">· ${s.plays[g.k]} ${s.plays[g.k] === 1 ? 'partida' : 'partidas'}</span>` : ''}</dd>`).join('')}</dl>
      <p class="small"><b>Más fallados en ¿Más o menos?:</b> ${wl('hl')}</p>
      <p class="small"><b>Más fallados en Recorrido:</b> ${wl('route')}</p></div>`;
  },
  share(k) {
    const d = this.st().daily[k]; if (!d) return; const [y, mo, da] = k.split('-');
    const txt = `Ultimate Atlas · Reto ${+da}/${+mo}/${y}\n${d.res.map(r => r === 'g' ? '🟩' : r === 'y' ? '🟨' : '🟥').join('')}  ${d.res.filter(r => r === 'g').length}/5`;
    const done = () => toast('Resultado copiado');
    try { navigator.clipboard.writeText(txt).then(done, () => toast(txt, 5000)); } catch (e) { toast(txt, 5000); }
  }
};
function confirmLeave() { return true; }
APP.tabs.trivia = TRIVIA;
