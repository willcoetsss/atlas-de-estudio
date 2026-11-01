/* ============ PROGRESO ============ */
const POLM = POL_TYPES.map(t => t.m), PHYM = PHY_TYPES.map(t => t.m), CARM = CAR_TYPES.map(t => t.m);
const PROG = {
  page: true, type: 'all', confirm: null,
  enter() { this.render(); },
  refresh() { if (APP.tab === 'progreso') this.render(); },
  lvlOf(id) {
    if (this.type !== 'all') return STORE.level(this.type + '|' + id);
    const ls = POLM.map(m => STORE.level(m + '|' + id)); if (ls.every(l => l === 0)) return 0;
    return Math.round(ls.reduce((a, b) => a + b, 0) / ls.length) || 1;
  },
  counts(keys) { const c = [0, 0, 0, 0]; keys.forEach(k => c[STORE.level(k)]++); return c; },
  render() {
    const items = STORE.d.items; const keys = Object.keys(items);
    const tot = STORE.d.tot; const acc = tot.n ? Math.round(tot.ok / tot.n * 100) : 0;
    const polKeys = D.states.flatMap(id => (this.type === 'all' ? POLM : [this.type]).map(m => m + '|' + id));
    const dom = keys.filter(k => STORE.level(k) === 3).length;
    // barras por región
    const bars = REGIONS.map(r => { const ids = D.states.filter(id => D.info[id].reg === r); const ks = ids.flatMap(id => (this.type === 'all' ? POLM : [this.type]).map(m => m + '|' + id)); const c = this.counts(ks); const n = ks.length; return { r, c, n, pct: n ? Math.round(c[3] / n * 100) : 0 }; });
    // más fallados
    const byC = {}; for (const [k, r] of Object.entries(items)) { const [m, id] = k.split('|'); if (!POLM.includes(m)) continue; const o = byC[id] = byC[id] || { bad: 0, ok: 0, modes: {} }; o.bad += r[4]; o.ok += r[3]; if (r[4]) o.modes[m] = (o.modes[m] || 0) + r[4]; }
    const worst = Object.entries(byC).filter(([id, o]) => o.bad > 0).sort((a, b) => (b[1].bad - b[1].ok * 0.5) - (a[1].bad - a[1].ok * 0.5)).slice(0, 12);
    const phyK = keys.filter(k => PHYM.includes(k.split('|')[0])), carK = keys.filter(k => CARM.includes(k.split('|')[0]));
    const pc = this.counts(phyK), cc = this.counts(carK);
    const physWorst = phyK.filter(k => items[k][4] > items[k][3]).sort((a, b) => items[b][4] - items[a][4]).slice(0, 8);
    const tname = this.type === 'all' ? 'todos los tipos' : POL_TYPES.find(t => t.m === this.type).n;
    const stackBar = c => { const n = c.reduce((a, b) => a + b, 0) || 1; return `<div class="track">${[3, 2, 1, 0].map(l => `<span style="width:${c[l] / n * 100}%;background:${LEVELS[l].c}" title="${LEVELS[l].n}: ${c[l]}"></span>`).join('')}</div>`; };
    $('#page').innerHTML = `<div class="page-inner stack" style="gap:22px">
      <header class="stack" style="gap:6px"><div class="eyebrow">Progreso</div><h2>Lo que ya dominas</h2><p class="muted">La app guarda cada país por tipo de pregunta: saberte la capital de Malí no cuenta como saberte su bandera.</p></header>
      <div class="statrow">
        <div class="card bigstat"><span class="eyebrow">Respuestas</span><b>${nf.format(tot.n)}</b><span class="small muted">${acc} % de aciertos</span></div>
        <div class="card bigstat"><span class="eyebrow">Racha</span><b>${STORE.streak()}</b><span class="small muted">${STORE.streak() === 1 ? 'día seguido' : 'días seguidos'} estudiando</span></div>
        <div class="card bigstat"><span class="eyebrow">Dominados</span><b>${nf.format(dom)}</b><span class="small muted">elementos en total</span></div>
        <div class="card bigstat"><span class="eyebrow">Días de estudio</span><b>${STORE.d.days.length}</b><span class="small muted">desde el principio</span></div>
      </div>
      <div class="card stack">
        <div class="row" style="justify-content:space-between"><h3>Mapa de progreso</h3><select id="ptype" aria-label="Tipo de pregunta" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--panel)"><option value="all">Media de los 6 tipos</option>${POL_TYPES.map(t => `<option value="${t.m}" ${this.type === t.m ? 'selected' : ''}>${t.n}</option>`).join('')}</select></div>
        <div style="overflow:hidden"><svg id="pmap" viewBox="0 0 ${D.W} ${D.H}" style="width:100%;height:auto;display:block"></svg></div>
        <div class="row small">${LEVELS.map(l => `<span class="pill"><span class="dot" style="background:${l.c}"></span>${l.n}</span>`).join('')}<span class="muted">Pasa el ratón por un país para ver su nivel.</span></div>
      </div>
      <div class="grid2">
        <div class="card stack"><h3>Dominado por continente</h3><p class="small muted">${esc(tname)}</p><div class="bars">${bars.map(b => `<div class="barrow"><span>${b.r}</span>${stackBar(b.c)}<span class="num">${b.pct} %</span></div>`).join('')}</div></div>
        <div class="card stack"><h3>Los países que más fallas</h3>${worst.length ? `<ul class="list">${worst.map(([id, o]) => `<li><button data-go="${id}">${flagBox(id, 18, "inl")}<span>${esc(nameOf(id))}<br><span class="small muted">${Object.keys(o.modes).map(m => POL_TYPES.find(t => t.m === m).n).join(' · ')}</span></span><span class="meta">${o.bad} fallos</span></button></li>`).join('')}</ul>` : '<p class="muted small">Todavía no hay fallos registrados. Empieza en la pestaña Examen.</p>'}</div>
      </div>
      <div class="grid2">
        <div class="card stack"><h3>Accidentes geográficos</h3>${stackBar(pc)}<p class="small muted">${pc[3]} dominados, ${pc[2]} repasando, ${pc[1]} aprendiendo.</p>${physWorst.length ? `<div class="small"><b>Más fallados:</b> ${physWorst.map(k => { const [m, id] = k.split('|'); return esc(m === 'ps' ? 'mares de ' + nameOf(id) : (D.pitems[id] || {}).n || id); }).join(', ')}</div>` : ''}</div>
        <div class="card stack"><h3>Cartografía</h3>${stackBar(cc)}<p class="small muted">${cc[3]} dominados, ${cc[2]} repasando, ${cc[1]} aprendiendo.</p></div>
      </div>
      <div class="card stack">
        <h3>Copia de seguridad</h3>
        <p class="small">Tu progreso se guarda en este navegador${REMOTE.ready ? ' y en tu cuenta (privado)' : ''}. Exporta un archivo JSON para no perderlo nunca o para pasarlo a otro dispositivo.</p>
        <div class="row"><button class="btn" id="exp">Exportar progreso</button><label class="btn" style="cursor:pointer">Importar archivo<input type="file" id="impF" accept=".json,application/json" hidden></label><button class="btn" id="expTxt">Ver como texto</button></div>
        <div id="expBox" hidden><textarea id="expTa" aria-label="Progreso en formato JSON"></textarea><div class="row" style="margin-top:6px"><button class="btn sm" id="copyTa">Copiar</button><button class="btn sm" id="impTa">Importar este texto</button></div></div>
        <div class="sec"><h4>Reiniciar</h4><div class="row">${[['all', 'Todo'], ['pol', 'Países'], ['phy', 'Accidentes'], ['car', 'Cartografía']].map(([k, n]) => `<button class="btn sm danger" data-reset="${k}">${n}</button>`).join('')}</div>
        ${this.confirm ? `<div class="confirm"><b>¿Borrar el progreso de ${{ all: 'todo', pol: 'países', phy: 'accidentes', car: 'cartografía' }[this.confirm]}?</b><span class="small">No se puede deshacer. Exporta antes una copia si la quieres conservar.</span><div class="row"><button class="btn sm danger" id="doReset">Sí, borrar</button><button class="btn sm" id="noReset">Cancelar</button></div></div>` : ''}</div>
      </div>
    </div>`;
    this.map();
    const P = $('#page');
    $('#ptype').onchange = e => { this.type = e.target.value; this.render(); };
    $$('[data-go]', P).forEach(b => b.onclick = () => { switchTab('explorar'); EXPLORE.select(b.dataset.go); });
    const json = () => JSON.stringify(STORE.d);
    $('#exp').onclick = async () => {
      const fn = 'atlas-progreso-' + new Date().toISOString().slice(0, 10) + '.json';
      try { const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (dl) { await dl.save({ filename: fn, data: json() }); toast('Progreso exportado'); return; } } catch (e) { if (e && e.code === 'declined') return; }
      if (!window.claude) { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json()], { type: 'application/json' })); a.download = fn; document.body.appendChild(a); a.click(); a.remove(); toast('Progreso exportado'); return; } catch (e) { } }
      $('#expBox').hidden = false; $('#expTa').value = json(); toast('Copia el texto para guardarlo');
    };
    $('#expTxt').onclick = () => { $('#expBox').hidden = !$('#expBox').hidden; $('#expTa').value = json(); };
    $('#copyTa').onclick = async () => { const ta = $('#expTa'); try { await navigator.clipboard.writeText(ta.value); toast('Copiado'); } catch (e) { ta.select(); toast('Selecciona y copia con Ctrl+C'); } };
    const imp = txt => { try { const o = JSON.parse(txt); if (!o || !o.items) throw 0; STORE.merge(o); STORE.save(); toast('Progreso importado y combinado'); this.render(); } catch (e) { toast('El archivo no tiene un formato válido'); } };
    $('#impTa').onclick = () => imp($('#expTa').value);
    $('#impF').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => imp(r.result); r.readAsText(f); };
    $$('[data-reset]', P).forEach(b => b.onclick = () => { this.confirm = b.dataset.reset; this.render(); $('.confirm').scrollIntoView({ block: 'center' }); });
    const dr = $('#doReset'); if (dr) dr.onclick = () => { const k = this.confirm; STORE.reset(k === 'all' ? null : (k === 'pol' ? POLM : k === 'phy' ? PHYM : CARM).map(m => m + '|')); this.confirm = null; toast('Progreso borrado'); this.render(); };
    const nr = $('#noReset'); if (nr) nr.onclick = () => { this.confirm = null; this.render(); };
  },
  map() {
    const svg = d3.select('#pmap');
    svg.append('path').attr('d', D.ppath({ type: 'Sphere' })).attr('fill', 'var(--ocean)');
    const feats = D.cfeat.filter(f => f.id !== 'ATA');
    const lv = id => { const b = baseId(id); return D.info[b] && D.info[b].state ? this.lvlOf(b) : -1; };
    svg.append('g').selectAll('path').data(feats).join('path').attr('d', D.path).attr('fill', d => { const l = lv(d.id); return l < 0 ? 'var(--panel2)' : LEVELS[l].c; }).attr('stroke', 'var(--panel)').attr('stroke-width', 0.4)
      .append('title').text(d => { const b = baseId(d.id), l = lv(d.id); return nameOf(b) + (l >= 0 ? ': ' + LEVELS[l].n : ''); });
    svg.append('g').selectAll('circle').data(D.tiny.filter(t => D.info[t.id] && D.info[t.id].state)).join('circle').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', 3.2).attr('fill', d => LEVELS[this.lvlOf(d.id)].c).attr('stroke', 'var(--panel)').attr('stroke-width', .6).append('title').text(d => nameOf(d.id) + ': ' + LEVELS[this.lvlOf(d.id)].n);
  }
};
APP.tabs.progreso = PROG;
