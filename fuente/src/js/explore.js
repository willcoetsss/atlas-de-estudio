/* ============ EXPLORAR ============ */
const TERR_DISPUTE = { FLK: ['malvinas'], GIB: ['gibraltar'], IOT: ['chagos'], SGS: ['georgias'], 'FRA-MYT': ['mayotte'], 'ESP-CEU': ['ceuta-melilla'], 'ESP-MEL': ['ceuta-melilla'], HKG: [], MAC: [] };
const CENTURIES = [15, 16, 17, 18, 19, 20];
const roman = c => ({ 11: 'XI', 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV', 16: 'XVI', 17: 'XVII', 18: 'XVIII', 19: 'XIX', 20: 'XX', 21: 'XXI' }[c] || c);
const swatch = cls => `<svg class="swatch-line" viewBox="0 0 30 10"><line class="ln ${cls}" x1="2" y1="5" x2="28" y2="5"/></svg>`;
const EXPLORE = {
  sel: null, openDispute: null,
  o: { terr: true, disp: true, chg: true, col: true, labels: true, allDisp: false, fitTerr: false, cents: new Set(CENTURIES) },
  enter() {
    MAP.setMode('political'); $('#legend').hidden = false; $('#searchbox').hidden = false;
    this.legend(); this.countryLabels();
    MAP.layoutHook = () => this.layout();
    if (this.sel) this.select(this.sel, false); else { this.intro(); this.draw(); }
    this.layout();
  },
  leave() { },
  legend() {
    const o = this.o;
    const row = (k, cls, label) => `<label><input type="checkbox" data-k="${k}" ${o[k] ? 'checked' : ''}>${swatch(cls)}<span>${label}</span></label>`;
    $('#legend').innerHTML = `<summary>Leyenda</summary><div class="rows">
      <label style="cursor:default"><span></span>${swatch('ln-sel')}<span>País seleccionado</span></label>
      ${row('terr', 'ln-terr', 'Territorio lejano del mismo país')}
      ${row('disp', 'ln-red', 'Zona en disputa · conflicto activo')}
      <label style="cursor:default"><span></span>${swatch('ln-orange')}<span>Zona en disputa · diplomática</span></label>
      ${row('chg', 'ln-change', 'Cambio de frontera reciente (desde 1990)')}
      ${row('col', 'ln-colony', 'Antigua colonia o territorio que le perteneció')}
      <label><input type="checkbox" data-k="allDisp" ${o.allDisp ? 'checked' : ''}><span></span><span>Ver todas las disputas del mundo</span></label>
      <label><input type="checkbox" data-k="labels" ${o.labels ? 'checked' : ''}><span></span><span>Nombres de países</span></label>
      <label><input type="checkbox" data-k="fitTerr" ${o.fitTerr ? 'checked' : ''}><span></span><span>Encuadrar con todos sus territorios</span></label>
      <div class="note">Las antiguas colonias se marcan solo en la parte que perteneció al país, con límites regionales actuales como aproximación.</div></div>`;
    $$('#legend input[data-k]').forEach(i => i.onchange = () => {
      o[i.dataset.k] = i.checked;
      if (i.dataset.k === 'labels') { MAP.gLabels.attr('display', i.checked ? null : 'none'); return; }
      if (i.dataset.k === 'fitTerr' && this.sel) { this.fly(); return; }
      this.draw(); if (this.sel) this.panel();
    });
    if (isMobile()) $('#legend').open = false;
  },
  countryLabels() {
    const data = Object.entries(D.info).filter(([id, e]) => e.lab && (e.state || e.kind === 'territory') && D.byId[id]).map(([id, e]) => {
      const p = D.proj([e.lab[0], e.lab[1]]); const ml = e.lab[2] || 5;
      return { id, x: p[0], y: p[1], text: e.name, minK: Math.pow(2, ml - 3.2), pri: ml + (e.state ? 0 : 2), em: ml < 3 ? 0.88 : ml < 4 ? 0.8 : 0.74, ls: 0.06 };
    });
    this.lab = MAP.gLabels.selectAll('text.lbl-cty').data(data).join('text').attr('class', 'lbl lbl-cty').attr('x', d => d.x).attr('y', d => d.y).attr('font-size', d => d.em + 'em').text(d => d.text);
    MAP.gLabels.attr('display', this.o.labels ? null : 'none');
  },
  layout() { if (this.lab) MAP.layoutLabels(this.lab); if (this.cityLab) MAP.layoutLabels(this.cityLab, { always: d => d.cap }); },
  hover(id, ev) {
    if (!id) return tooltip(null);
    const e = D.info[id]; if (!e) return tooltip(null);
    const sov = e.kind === 'far' || e.kind === 'territory' ? `<span class="muted small">${e.kind === 'far' ? 'Parte de' : 'Territorio de'} ${esc(nameOf(e.sov))}</span>` : `<span class="muted small">${esc(e.reg || '')}</span>`;
    tooltip(`<b>${esc(e.name)}</b>${sov}`, ev);
  },
  click(id) { if (!id) return; const f = D.byId[id]; const p = f && f.properties || {}; this.select(p.kind === 'far' ? p.sov : id, true); },
  select(id, fly = true) {
    if (!D.info[id]) return;
    this.sel = id; this.openDispute = null; this.panel(); this.draw(); if (fly) this.fly();
  },
  fly() {
    const id = this.sel; let b = homeBounds(id);
    if (this.o.fitTerr) b = unionBounds([id, ...(D.parts[id] || [])]);
    MAP.fit(b, { maxK: 40 });
  },
  disputesFor(id) {
    const all = D.special.disputes;
    if (!id) return [];
    const extra = TERR_DISPUTE[id] || [];
    return all.filter(d => d.parties.includes(id) || extra.includes(d.id) || d.geo.includes('c:' + id));
  },
  changesFor(id) { return id ? D.special.changes.filter(c => c.parties.includes(id) || c.geo.includes('c:' + id)) : []; },
  coloniesFor(id) {
    const list = D.special.colonies[id] || [];
    return list.filter(e => { for (const c of this.o.cents) { const s = (c - 1) * 100, t = c * 100; if (e.a < t && e.b >= s) return true; } return false; });
  },
  draw() {
    MAP.clearOverlays();
    const id = this.sel, o = this.o, gS = MAP.gSpecial, gH = MAP.gHL;
    const P = D.path;
    const lines = (feats, cls, data) => { for (const f of feats) if (f) gS.append('path').attr('class', 'ln ' + cls).attr('d', P(f)); };
    const hit = (feats, info) => { for (const f of feats) if (f) gS.append('path').attr('class', 'fill-hit').attr('d', P(f)).on('pointerenter', ev => tooltip(info, ev)).on('pointermove', ev => tooltip(info, ev)).on('pointerleave', () => tooltip(null)).on('click', ev => { ev.stopPropagation(); }); };
    // colonias
    if (id && o.col) for (const e of this.coloniesFor(id)) { const fs = e.geo.map(geoRef); lines(fs, 'ln-colony'); hit(fs, `<b>${esc(e.n)}</b>${esc(e.t)} · ${e.a}–${e.b}<br><span class="muted">${esc(e.end)}</span>`); }
    // cambios
    if (id && o.chg) for (const c of this.changesFor(id)) { const fs = c.geo.map(geoRef); lines(fs, 'ln-change'); hit(fs, `<b>${esc(c.name)} (${esc(c.year)})</b><span class="muted">${esc(c.why.slice(0, 160))}${c.why.length > 160 ? '…' : ''}</span>`); }
    // disputas
    const ds = o.allDisp ? D.special.disputes : (o.disp ? this.disputesFor(id) : []);
    for (const d of ds) { const fs = d.geo.map(geoRef); lines(fs, d.nivel === 'rojo' ? 'ln-red' : 'ln-orange'); hit(fs, `<b>${esc(d.name)}</b>Entre: ${d.parties.map(nameOf).map(esc).join(' · ')}<br><span class="muted">Control de facto: ${esc(d.control)}</span>`); }
    if (!id) return;
    // territorios del mismo país (misma línea, discontinua)
    const e = D.info[id];
    if (o.terr) for (const t of (D.parts[id] || [])) { const f = D.byId[t]; gH.append('path').attr('class', 'ln ln-terr').attr('d', P(f)); }
    // contorno del país
    const f = D.byId[id];
    gH.append('path').attr('class', 'ln ln-sel-halo').attr('d', P(f));
    gH.append('path').attr('class', 'ln ln-sel').attr('d', P(f));
    if (D.tiny.find(t => t.id === id)) { const t = D.tiny.find(t => t.id === id); gH.append('circle').attr('class', 'ln ln-sel').attr('cx', t.x).attr('cy', t.y).attr('r', 0.9); }
    // ciudades
    this.cities();
  },
  cities() {
    const e = D.info[this.sel]; const g = MAP.gTop; g.selectAll('*').remove(); this.cityLab = null;
    if (!e || !e.cities) return;
    const data = e.cities.map(c => { const p = D.proj([c[1], c[2]]); const cap = c[3] === 1 || c[0] === e.cap; return { x: p[0], y: p[1], text: c[0], cap, pri: cap ? 0 : 1, em: cap ? 1 : 0.9, w: c[0].length * 0.55 + 1.6 }; });
    this.cityLab = g.selectAll('text').data(data).join('text').attr('class', 'lbl lbl-city').attr('x', d => d.x).attr('y', d => d.y).attr('font-size', d => d.em + 'em').style('text-anchor', 'start')
      .html(d => `<tspan class="${d.cap ? 'city-cap' : 'city-dot'}" dx="-0.35em" style="font-size:${d.cap ? 1.2 : 0.8}em">${d.cap ? '★' : '●'}</tspan><tspan dx="0.25em" style="${d.cap ? 'font-weight:700' : ''}">${esc(d.text)}</tspan>`);
    MAP.onZoom(); this.layout();
  },
  intro() {
    const n = D.states.length;
    setPanel(`<div class="stack">
      <div class="eyebrow">Explorar</div><h2>Elige cualquier país</h2>
      <p>Haz clic en el mapa o búscalo arriba. Verás su ficha completa y, sobre el mapa, sus territorios lejanos, zonas en disputa, cambios de frontera recientes y antiguas colonias.</p>
      <p class="muted small">${n} Estados (193 de la ONU, más Ciudad del Vaticano, Palestina, Kosovo y Taiwán) y unos 50 territorios. Los países diminutos tienen un círculo para poder pulsarlos.</p>
      <div class="sec"><h4>Prueba con</h4><div class="chips">${['DNK', 'ESP', 'GBR', 'FRA', 'IND', 'UKR', 'MAR', 'ISR', 'CHN', 'ARG'].map(c => `<button class="chip" data-go="${c}">${esc(nameOf(c))}</button>`).join('')}</div></div>
    </div>`);
    $$('[data-go]').forEach(b => b.onclick = () => this.select(b.dataset.go));
  },
  panel() {
    const id = this.sel, e = D.info[id]; if (!e) return;
    const isState = !!e.state, o = this.o;
    const lvls = ['cap', 'capc', 'mapn', 'mapc', 'flag', 'flagc'].map(m => STORE.level(m + '|' + id));
    const mast = isState && lvls.some(l => l > 0) ? `<div class="sec"><h4>Tu progreso con este país</h4><ul class="list">${lvls.map((l, i) => `<li><div class="li"><span class="dot" style="background:${LEVELS[l].c};margin-top:6px"></span><span>${POL_TYPES[i].n}</span><span class="meta">${LEVELS[l].n}</span></div></li>`).join('')}</ul></div>` : '';
    const facts = [];
    if (e.cap) facts.push(['Capital', esc(e.cap) + (e.capn ? `<br><span class="muted small">${esc(e.capn)}</span>` : '')]);
    if (e.pop != null) facts.push(['Población', fmtPop(e.pop)]);
    if (e.area) facts.push(['Superficie', fmtArea(e.area)]);
    if (e.langN) facts.push(['Idioma oficial', verif(e.langN)]);
    if (e.langR) facts.push(['Cooficiales regionales', verif(e.langR)]);
    if (!e.langN && e.lang && e.lang.length) facts.push(['Idiomas', esc(e.lang.join(', '))]);
    if (e.cur && e.cur.length) facts.push(['Moneda', esc(e.cur.join(', '))]);
    const sov = !isState && e.sov && e.sov !== id ? `<p>Pertenece a <button class="linkbtn" data-go="${e.sov}">${esc(nameOf(e.sov))}</button>${e.kind === 'territory' ? ' (territorio dependiente o de ultramar)' : ''}.</p>` : '';
    const terrs = (D.parts[id] || []).map(t => `<li><button data-go="${t}">${swatch('ln-terr')}<span>${esc(nameOf(t))}</span><span class="meta">${D.byId[t].properties.kind === 'far' ? 'parte integrante' : 'dependencia'}</span></button></li>`).join('');
    const disp = this.disputesFor(id);
    const chg = this.changesFor(id);
    const cols = D.special.colonies[id] || [];
    const colsF = this.coloniesFor(id);
    const cities = (e.cities || []).map((c, i) => `<li><button data-city="${i}"><span>${c[3] === 1 || c[0] === e.cap ? '★' : '·'}</span><span>${esc(c[0])}</span><span class="meta">${c[4] ? nf.format(Math.round(c[4] / 1000) * 1000) : ''}</span></button></li>`).join('');
    const nbs = (e.borders || []).filter(b => D.info[b]).map(b => `<button class="chip" data-go="${b}">${esc(nameOf(b))}</button>`).join('');
    const dItem = d => `<li><button data-disp="${d.id}"><span class="dot" style="background:var(--dispute-${d.nivel === 'rojo' ? 'red' : 'orange'})"></span><span>${esc(d.name)}</span><span class="meta">${d.parties.filter(p => p !== id).map(nameOf).slice(0, 2).join(', ')}</span></button>${this.openDispute === d.id ? `<div class="card small" style="margin:4px 0 8px;display:grid;gap:6px"><div><b>Países implicados:</b> ${d.parties.map(p => D.info[p] ? `<button class="linkbtn" data-go="${p}">${esc(nameOf(p))}</button>` : esc(p)).join(', ')}</div><div><b>Control de facto:</b> ${esc(d.control)}</div><div>${esc(d.why)}</div></div>` : ''}</li>`;
    setPanel(`<div class="stack">
      <div class="eyebrow">${esc(isState ? [e.reg, e.state && D.info[id].kind !== 'state' ? '' : ''].filter(Boolean).join(' · ') : (e.kind === 'far' ? 'Parte lejana de un país' : 'Territorio'))}</div>
      <div><h2>${esc(e.name)}</h2>${e.off && e.off !== e.name ? `<div class="muted small">${esc(e.off)}</div>` : ''}</div>
      ${flagBox(id, isLandPhone() ? 90 : 140, "flag-big")}
      ${sov}
      ${e.note ? `<p class="small">${esc(e.note)}</p>` : ''}
      <dl class="facts">${facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('')}</dl>
      ${cities ? `<div class="sec"><h4>Ciudades importantes</h4><ul class="list">${cities}</ul></div>` : ''}
      ${isState ? `
      <div class="sec"><h4>Situación política</h4><p><b>${esc(e.gov)}</b></p><p>${verif(e.lead)}</p></div>
      <div class="sec"><h4>Guerra y conflictos</h4><p>${verif(e.war)}</p></div>
      <div class="sec"><h4>Pasado colonial</h4><p>${verif(e.col)}</p></div>
      <div class="sec"><h4>Religión</h4><p>${verif(e.rel)}</p></div>
      <div class="sec"><h4>Lo más famoso de aquí</h4><p><b>Persona:</b> ${esc(e.per)}</p><p><b>Cosa:</b> ${esc(e.thing)}</p></div>` : ''}
      ${terrs ? `<div class="sec"><h4>Territorios lejanos ${o.terr ? '' : '<span class="muted">(ocultos)</span>'}</h4><ul class="list">${terrs}</ul></div>` : ''}
      ${disp.length ? `<div class="sec"><h4>Zonas en disputa ${o.disp || o.allDisp ? '' : '<span class="muted">(ocultas)</span>'}</h4><ul class="list">${disp.map(dItem).join('')}</ul></div>` : ''}
      ${chg.length ? `<div class="sec"><h4>Cambios de frontera desde 1990</h4><ul class="list">${chg.map(c => `<li><div class="li">${swatch('ln-change')}<span><b>${esc(c.name)}</b> <span class="muted">(${esc(c.year)})</span><br><span class="small">${esc(c.why)}</span></span></div></li>`).join('')}</ul></div>` : ''}
      ${cols.length ? `<div class="sec"><h4>Antiguas colonias y territorios <span class="muted">${colsF.length}/${cols.length}</span></h4>
        <div class="chips">${CENTURIES.map(c => `<button class="chip" data-cent="${c}" aria-pressed="${o.cents.has(c)}">s. ${roman(c)}</button>`).join('')}</div>
        <ul class="list">${colsF.map((c, i) => `<li><button data-col="${cols.indexOf(c)}">${swatch('ln-colony')}<span>${esc(c.n)}<br><span class="small muted">${esc(c.t)} · ${c.a}–${c.b} · ${esc(c.end)}</span></span></button></li>`).join('')}</ul></div>` : ''}
      ${mast}
      ${nbs ? `<div class="sec"><h4>Países vecinos</h4><div class="chips">${nbs}</div></div>` : ''}
      <p class="muted small">Datos políticos y de conflictos con referencia a ${REF_DATE}. Lo marcado con <span class="chk">verificar</span> puede haber cambiado.</p>
    </div>`);
    const body = $('#panelBody');
    $$('[data-go]', body).forEach(b => b.onclick = () => { const t = b.dataset.go; const f = D.byId[t]; if (f && f.properties && f.properties.kind === 'far') { MAP.fit(D.bbox[t], { maxK: 40 }); } else this.select(t); });
    $$('[data-city]', body).forEach(b => b.onclick = () => { const c = e.cities[+b.dataset.city]; const p = D.proj([c[1], c[2]]); MAP.fit([[p[0] - 4, p[1] - 3], [p[0] + 4, p[1] + 3]], { maxK: 30 }); });
    $$('[data-disp]', body).forEach(b => b.onclick = () => { const d = D.special.disputes.find(x => x.id === b.dataset.disp); this.openDispute = this.openDispute === d.id ? null : d.id; this.panel(); if (this.openDispute) { if (!o.disp && !o.allDisp) { o.disp = true; this.legend(); this.draw(); } MAP.fit(boundsOf(d.geo.map(geoRef)), { maxK: 40 }); } });
    $$('[data-cent]', body).forEach(b => b.onclick = () => { const c = +b.dataset.cent; o.cents.has(c) ? o.cents.delete(c) : o.cents.add(c); this.panel(); this.draw(); });
    $$('[data-col]', body).forEach(b => b.onclick = () => { const c = cols[+b.dataset.col]; if (!o.col) { o.col = true; this.legend(); this.draw(); } MAP.fit(boundsOf(c.geo.map(geoRef)), { maxK: 30 }); });
  }
};
APP.tabs.explorar = EXPLORE;
