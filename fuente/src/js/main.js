/* ============ arranque ============ */
(async function boot() {
  STORE.load();
  try { await loadData(); } catch (e) { $('#loading').textContent = 'No se pudieron cargar los datos del atlas (' + e.message + '). Recarga la página.'; return; }
  initShell(); MAP.init();
  MAP.on('click', (id, ev, w) => { const t = APP.tabs[APP.tab]; if (t && t.click) t.click(id, ev, w); });
  MAP.on('hover', (id, ev) => { const t = APP.tabs[APP.tab]; if (t && t.hover) t.hover(id, ev); else tooltip(null); });
  MAP.on('resize', () => { const t = APP.tabs[APP.tab]; if (t && t.resized) t.resized(); });
  document.addEventListener('keydown', e => { const t = APP.tabs[APP.tab]; if (t && t.key) t.key(e); });
  APP.refresh = () => { const t = APP.tabs[APP.tab]; if (t && t.refresh) t.refresh(); };
  $('#loading').remove();
  const h = location.hash.slice(1);
  switchTab(APP.tabs[h] ? h : (APP.tabs[lsGet('atlas-tab')] ? lsGet('atlas-tab') : 'explorar'));
  REMOTE.init();
})();
