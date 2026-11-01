/* ============ FÍSICO ============ */
const PCLS = { 'océano': 'ocean-l', mar: 'water', golfo: 'water', 'bahía': 'water', estrecho: 'water', canal: 'water', fiordo: 'water', laguna: 'water', arrecife: 'water', lago: 'water', embalse: 'water', 'río': 'water', cordillera: 'range', pico: 'peak', 'volcán': 'peak', 'depresión': 'peak', 'península': 'land', istmo: 'land', isla: 'land', 'archipiélago': 'land', delta: 'land', desierto: 'region', meseta: 'region', llanura: 'region', cuenca: 'region', tundra: 'region', valle: 'region', humedal: 'region' };
const PGRP = Object.fromEntries(PHY_GROUPS.flatMap(g => g.c.map(c => [c, g.k])));
const PPRI = { 'ocean-l': 0, water: 1, range: 2, region: 3, land: 4, peak: 5 };
const PHYS = {
  sel: null, feat: null, built: false,
  o: Object.assign(Object.fromEntries(PHY_GROUPS.map(g => [g.k, true])), { borders: true }),
  enter() {
    MAP.setMode('physical'); $('#searchbox').hidden = false; $('#legend').hidden = false;
    this.build(); this.legend(); this.labels();
    MAP.layoutHook = () => this.layout(); MAP.zoomHook = k => this.zoomed(k);
    this.zoomed(MAP.k); this.layout();
    if (this.feat) this.selectFeature(this.feat, false); else if (this.sel) this.select(this.sel, false); else this.intro();
  },
  leave() { MAP.gPhys.attr('display', 'none'); MAP.cty.style('display', null); },
  build() {
    if (this.built) return; this.built = true;
    const g = MAP.gPhys;
    const lakes = Object.keys(D.pitems).filter(id => id[0] === 'l' && D.pgeo[id]);
    g.append('g').selectAll('path').data(lakes).join('path').attr('class', 'lake').attr('d', id => D.path(D.pgeo[id]));
    const rivers = Object.keys(D.pitems).filter(id => id[0] === 'v' && D.pgeo[id]).sort((a, b) => D.pitems[b].r - D.pitems[a].r);
    this.riv = g.append('g').selectAll('path').data(rivers).join('path').attr('class', 'river').attr('d', id => D.path(D.pgeo[id]))
      .style('stroke-width', id => { const r = D.pitems[id].r; return (r <= 2 ? 2.2 : r <= 4 ? 1.5 : r <= 6 ? 1.1 : 0.8) + 'px'; })
      .on('click', (ev, id) => { ev.stopPropagation(); this.selectFeature(id); })
      .on('pointerenter', (ev, id) => tooltip(`<b>${esc(D.pitems[id].n)}</b><span class="muted">río</span>`, ev)).on('pointerleave', () => tooltip(null));
  },
  zoomed(k) {
    const rel = MAP.rel();
    if (this.riv) this.riv.attr('display', id => this.o.rivers && D.pitems[id].r <= 3 + 2.2 * Math.log2(Math.max(1, rel)) ? null : 'none');
    MAP.gHL.selectAll('circle[data-scale]').attr('r', function () { return +this.dataset.scale / k; });
  },
  labels() {
    const data = [];
    for (const [id, it] of Object.entries(D.pitems)) {
      if (!D.pRev[id] && it.c !== 'océano' && it.c !== 'mar') continue;
      const cls = PCLS[it.c]; if (!cls) continue;
      if (it.c === 'isla' && it.r > 3) continue;
      let x, y, a = 0;
      if (it.L && it.L.x != null) { x = it.L.x; y = it.L.y; a = it.L.a; }
      else { if (it.x == null) continue; [x, y] = D.proj([it.x, it.y]); if (it.L && it.L.a) a = cls === 'range' || cls === 'region' ? it.L.a : 0; }
      if (cls === 'water' && it.c !== 'río') a = 0;
      const r = it.r;
      const em = cls === 'ocean-l' ? 1.55 : cls === 'water' ? (it.c === 'río' ? 0.78 : r <= 1 ? 1.05 : 0.86) : cls === 'range' ? (r <= 1 ? 0.92 : 0.78) : cls === 'peak' ? 0.82 : cls === 'region' ? (r <= 1 ? 0.95 : 0.8) : 0.85;
      const minK = cls === 'ocean-l' ? 0 : r <= 1 ? 1 : Math.pow(2, (r - 1) * 0.85);
      const text = it.n;
      const ls = cls === 'ocean-l' ? 0.3 : cls === 'range' ? 0.22 : cls === 'region' ? 0.18 : 0;
      data.push({ id, x, y, a, text, em, minK, pri: r * 10 + PPRI[cls], cls, ls, grp: PGRP[it.c], lines: cls === 'peak' ? 2.3 : 1.2, w: cls === 'peak' ? Math.max(text.length, 8) * 0.56 : null });
    }
    const g = MAP.gLabels;
    this.lab = g.selectAll('text.plab').data(data).join('text').attr('class', d => 'plab ' + d.cls).attr('data-id', d => d.id).attr('font-size', d => d.em + 'em')
      .attr('transform', d => `translate(${d.x},${d.y}) rotate(${d.a || 0})`)
      .html(d => d.cls === 'peak' ? `<tspan x="0" dy="0">▲</tspan><tspan x="0" dy="1.1em">${esc(d.text)}</tspan>${D.pitems[d.id].e ? `<tspan x="0" dy="1.05em" style="font-size:.85em;font-family:var(--f-mono)">${nf.format(D.pitems[d.id].e)} m</tspan>` : ''}` : esc(d.text))
      .on('click', (ev, d) => { ev.stopPropagation(); this.selectFeature(d.id); });
    this.lab.filter(d => d.cls === 'peak').attr('transform', d => `translate(${d.x},${d.y})`).style('dominant-baseline', 'central');
  },
  layout() {
    if (!this.lab) return;
    const o = this.o;
    const sel = this.lab.filter(d => o[d.grp] !== false);
    this.lab.filter(d => o[d.grp] === false).attr('display', 'none');
    MAP.layoutLabels(sel, { always: d => d.id === this.feat });
    this.lab.classed('on', d => d.id === this.feat);
  },
  legend() {
    const o = this.o;
    $('#legend').innerHTML = `<summary>Capas del mapa físico</summary><div class="rows">
      ${PHY_GROUPS.map(g => `<label><input type="checkbox" data-k="${g.k}" ${o[g.k] ? 'checked' : ''}><span></span><span>${g.n}</span></label>`).join('')}
      <label><input type="checkbox" data-k="borders" ${o.borders ? 'checked' : ''}><span></span><span>Fronteras</span></label>
      <div class="note">Relieve sombreado y tintas hipsométricas (Natural Earth) con batimetría (ETOPO1). Acerca el mapa para ver más nombres; pulsa un nombre o un río para resaltarlo.</div></div>`;
    $$('#legend input[data-k]').forEach(i => i.onchange = () => { o[i.dataset.k] = i.checked; if (i.dataset.k === 'borders') MAP.cty.style('stroke-opacity', i.checked ? null : 0); this.zoomed(MAP.k); this.layout(); });
    if (isMobile()) $('#legend').open = false;
  },
  hover(id, ev) { if (!id) return tooltip(null); const e = D.info[id]; if (e) tooltip(`<b>${esc(e.name)}</b><span class="muted small">Pulsa para ver sus accidentes</span>`, ev); },
  click(id) { if (!id) return; this.select(baseId(id)); },
  intro() {
    setPanel(`<div class="stack"><div class="eyebrow">Mapa físico</div><h2>Mares, cordilleras, ríos y picos</h2>
      <p>Pulsa un país para ver la lista de sus accidentes geográficos, o pulsa cualquier nombre del mapa para resaltarlo.</p>
      <p class="muted small">${Object.keys(D.pitems).length} accidentes: ${PHY_GROUPS.map(g => g.n.toLowerCase()).join(', ')}.</p>
      <div class="sec"><h4>Prueba con</h4><div class="chips">${['ESP', 'ITA', 'CHL', 'NPL', 'EGY', 'IDN', 'USA', 'NOR'].map(c => `<button class="chip" data-go="${c}">${esc(nameOf(c))}</button>`).join('')}</div></div>
      <div class="sec"><h4>Grandes accidentes</h4><div class="chips">${Object.entries(D.pitems).filter(([id, it]) => it.r === 0 && ['cordillera', 'río', 'desierto', 'océano'].includes(it.c)).slice(0, 14).map(([id, it]) => `<button class="chip" data-f="${id}">${esc(it.n)}</button>`).join('')}</div></div></div>`);
    $$('[data-go]', $('#panelBody')).forEach(b => b.onclick = () => this.select(b.dataset.go));
    $$('[data-f]', $('#panelBody')).forEach(b => b.onclick = () => this.selectFeature(b.dataset.f));
  },
  select(id, fly = true) {
    if (!D.info[id]) return;
    this.sel = id; this.feat = null; MAP.gHL.selectAll('*').remove();
    const f = D.byId[id]; MAP.gHL.append('path').attr('class', 'ln ln-sel-halo').attr('d', D.path(f)); MAP.gHL.append('path').attr('class', 'ln ln-sel').attr('d', D.path(f));
    for (const t of (D.parts[id] || []).filter(t => D.byId[t].properties.kind === 'far')) MAP.gHL.append('path').attr('class', 'ln ln-terr').attr('d', D.path(D.byId[t]));
    if (fly) MAP.fit(homeBounds(id), { maxK: 9 });
    this.panel(); this.layout();
  },
  listFor(id) { const ids = [id, ...(D.parts[id] || []).filter(t => D.byId[t].properties.kind === 'far')]; return uniq(ids.flatMap(i => D.pidx[i] || [])); },
  panel() {
    const id = this.sel, e = D.info[id]; const list = this.listFor(id);
    const groups = PHY_GROUPS.map(g => ({ g, items: list.filter(f => g.c.includes(D.pitems[f].c)).sort((a, b) => (D.pitems[a].r - D.pitems[b].r) || ((D.pitems[b].e || 0) - (D.pitems[a].e || 0))) })).filter(x => x.items.length);
    setPanel(`<div class="stack">
      <div class="eyebrow">Accidentes geográficos</div>
      <div class="row" style="gap:12px;flex-wrap:nowrap">${flagBox(id, 34, "inl")}<h2>${esc(e.name)}</h2></div>
      ${groups.map(({ g, items }) => `<div class="sec"><h4>${g.n} <span class="muted">${items.length}</span></h4><ul class="list">${items.map(f => { const it = D.pitems[f]; return `<li><button data-f="${f}"><span>${esc(it.n)}</span><span class="meta">${it.e ? nf.format(it.e) + ' m' : esc(it.c)}</span></button></li>`; }).join('')}</ul></div>`).join('') || '<p class="muted">No hay accidentes registrados para este territorio a esta escala.</p>'}
      <div class="row"><button class="btn sm" id="toPol">Ver ficha política</button></div>
    </div>`);
    $$('[data-f]', $('#panelBody')).forEach(b => b.onclick = () => this.selectFeature(b.dataset.f, true, true));
    $('#toPol').onclick = () => { switchTab('explorar'); EXPLORE.select(id); };
  },
  selectFeature(fid, fly = true, keepPanel = false) {
    this.feat = fid; MAP.gHL.selectAll('.hl-poly,.hl-line,.hl-line2,.hl-pt').remove();
    QUIZ.drawPhys.call(QUIZ, fid); MAP.zoomHook = k => this.zoomed(k);
    if (fly) QUIZ.flyPhys(fid);
    this.layout();
    if (keepPanel && this.sel) { this.featCard(fid, true); return; }
    this.featCard(fid, false);
  },
  featCard(fid, inline) {
    const it = D.pitems[fid]; const cs = [...(D.pRev[fid] || [])].filter(c => D.info[c] && (D.info[c].state || D.info[c].kind === 'territory')).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'es'));
    const html = `<div class="card stack" style="gap:8px"><div class="eyebrow">${esc(it.c)}</div><h3>${esc(it.n)}</h3>
      ${it.e ? `<div>Altitud: <b class="kv">${nf.format(it.e)} m</b></div>` : ''}
      ${cs.length ? `<div class="small muted">${it.c === 'océano' || it.c === 'mar' ? 'Baña' : 'Se extiende por'} ${cs.length} ${cs.length === 1 ? 'país o territorio' : 'países o territorios'}:</div><div class="chips">${cs.slice(0, 40).map(c => `<button class="chip" data-go="${c}">${esc(nameOf(c))}</button>`).join('')}</div>` : ''}
      <div class="small muted">Importancia: ${it.r <= 1 ? 'muy alta' : it.r <= 3 ? 'alta' : it.r <= 5 ? 'media' : 'local'} (rango ${it.r} de Natural Earth)</div></div>`;
    if (inline) { const old = $('#featCard'); if (old) old.remove(); const d = document.createElement('div'); d.id = 'featCard'; d.innerHTML = html; $('#panelBody .stack').insertBefore(d, $('#panelBody .stack').children[2]); $('#panel').scrollTop = 0; }
    else setPanel(`<div class="stack"><div class="eyebrow">Accidente geográfico</div>${html}${this.sel ? `<button class="btn sm" id="backC">Volver a ${esc(nameOf(this.sel))}</button>` : ''}</div>`);
    $$('[data-go]', $('#panelBody')).forEach(b => b.onclick = () => this.select(b.dataset.go));
    const bk = $('#backC'); if (bk) bk.onclick = () => this.select(this.sel);
  }
};
APP.tabs.fisico = PHYS;
