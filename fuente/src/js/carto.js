/* ============ CARTOGRAFÍA ============ */
const clampLat = (r, lim) => (l, p) => r(l, Math.max(-lim, Math.min(lim, p)));
const PROJS = [
  { id: 'mercator', n: 'Mercator', f: () => d3.geoMercator(), raw: clampLat(d3.geoMercatorRaw, 1.45), surf: 'cilindrica', prop: 'conforme', au: 'Gerardus Mercator', yr: '1569', keeps: 'Conserva los ángulos y las formas locales; las líneas de rumbo constante (loxodromias) son rectas.', dist: 'Las áreas se inflan hacia los polos: Groenlandia parece tan grande como África, que es 14 veces mayor. Los polos no se pueden representar.', use: 'Navegación marítima y mapas web (Google Maps y OpenStreetMap usan una variante).', lim: 85 },
  { id: 'utm', n: 'Mercator transversa (UTM)', f: () => d3.geoTransverseMercator(), surf: 'cilindrica', prop: 'conforme', au: 'Johann Heinrich Lambert; sistema UTM de 1947', yr: '1772', keeps: 'Conserva los ángulos; es casi perfecta cerca del meridiano central.', dist: 'La deformación crece al alejarse del meridiano central; por eso el sistema UTM divide el mundo en 60 husos de 6°.', use: 'Mapas topográficos (en España, el Mapa Topográfico Nacional), GPS y catastro.', anim: false },
  { id: 'gall', n: 'Gall-Peters', f: () => d3.geoCylindricalEqualArea().parallel(45), raw: d3.geoCylindricalEqualAreaRaw(Math.PI / 4), surf: 'cilindrica', prop: 'equivalente', au: 'James Gall (1855); popularizada por Arno Peters', yr: '1855 / 1973', keeps: 'Conserva las áreas: los tamaños relativos de los países son reales.', dist: 'Deforma mucho las formas: los países tropicales se ven estirados en vertical y los de latitudes altas, aplastados.', use: 'Divulgación sobre el tamaño real del hemisferio sur; algunos colegios y ONG.' },
  { id: 'plate', n: 'Equirrectangular (placa cuadrada)', f: () => d3.geoEquirectangular(), raw: d3.geoEquirectangularRaw, surf: 'cilindrica', prop: 'equidistante', au: 'Atribuida a Marino de Tiro', yr: 'c. 100', keeps: 'Conserva las distancias a lo largo de los meridianos; la retícula es una cuadrícula perfecta.', dist: 'Ni áreas ni formas: las regiones polares se estiran en horizontal.', use: 'Imágenes de satélite e imágenes de relieve en SIG (este atlas usa una como fuente).' },
  { id: 'mollweide', n: 'Mollweide', f: () => d3.geoMollweide(), raw: d3.geoMollweideRaw, surf: 'pseudocilindrica', prop: 'equivalente', au: 'Karl Brandan Mollweide', yr: '1805', keeps: 'Conserva las áreas; el mundo cabe en una elipse.', dist: 'Las formas se deforman en los bordes, sobre todo en latitudes altas.', use: 'Mapas temáticos de distribución mundial y mapas del cielo (radiación de fondo cósmico).' },
  { id: 'robinson', n: 'Robinson', f: () => d3.geoRobinson(), raw: d3.geoRobinsonRaw, surf: 'pseudocilindrica', prop: 'afilactica', au: 'Arthur H. Robinson', yr: '1963', keeps: 'Ninguna propiedad exacta: busca que el mundo «se vea bien».', dist: 'Deformaciones moderadas de todo tipo; los polos son líneas.', use: 'Atlas escolares y National Geographic (1988-1998).' },
  { id: 'winkel', n: 'Winkel Tripel', f: () => d3.geoWinkel3(), raw: d3.geoWinkel3Raw, surf: 'otra', prop: 'afilactica', au: 'Oswald Winkel', yr: '1921', keeps: 'Compromiso que minimiza a la vez la deformación de áreas, ángulos y distancias.', dist: 'Pequeñas deformaciones repartidas; los meridianos se curvan.', use: 'National Geographic desde 1998 y muchos atlas.' },
  { id: 'equalearth', n: 'Equal Earth', f: () => d3.geoEqualEarth(), raw: d3.geoEqualEarthRaw, surf: 'pseudocilindrica', prop: 'equivalente', au: 'Bojan Šavrič, Tom Patterson y Bernhard Jenny', yr: '2018', keeps: 'Conserva las áreas con un aspecto parecido a Robinson.', dist: 'Formas algo comprimidas cerca de los polos.', use: 'Mapas temáticos modernos; la NASA y este atlas.' },
  { id: 'lcc', n: 'Cónica conforme de Lambert', f: () => d3.geoConicConformal().parallels([30, 60]).rotate([-10, 0]), ext: [[-180, -30], [180, 84]], anim: false, surf: 'conica', prop: 'conforme', au: 'Johann Heinrich Lambert', yr: '1772', keeps: 'Conserva los ángulos; muy precisa en la franja entre sus dos paralelos estándar.', dist: 'Lejos de esos paralelos, las áreas se deforman mucho; el hemisferio sur crece hasta el infinito, por eso aquí se corta a 30° S. No sirve para el mundo entero.', use: 'Cartas aeronáuticas y mapas oficiales de Europa (ETRS89-LCC).', rot: -10 },
  { id: 'albers', n: 'Cónica equivalente de Albers', f: () => d3.geoConicEqualArea().parallels([20, 50]).rotate([-10, 0]), raw: d3.geoConicEqualAreaRaw(Math.PI / 9, Math.PI * 5 / 18), surf: 'conica', prop: 'equivalente', au: 'Heinrich C. Albers', yr: '1805', keeps: 'Conserva las áreas.', dist: 'Las formas se deforman lejos de los paralelos estándar.', use: 'Mapas de EE. UU. del Servicio Geológico (USGS) y mapas temáticos de países extensos.', rot: -10 },
  { id: 'azeq', n: 'Azimutal equidistante', f: () => d3.geoAzimuthalEquidistant().rotate([0, -90]), raw: d3.geoAzimuthalEquidistantRaw, surf: 'azimutal', prop: 'equidistante', au: 'Usada por al-Biruni; Guillaume Postel', yr: 'c. 1000 / 1581', keeps: 'Las distancias y direcciones desde el centro son exactas.', dist: 'Fuera del centro todo se deforma; el punto opuesto se convierte en el círculo exterior.', use: 'Emblema de la ONU, radioaficionados y sismología (distancias desde un punto).', clip: 179.9, phi: -90 },
  { id: 'stereo', n: 'Estereográfica', f: () => d3.geoStereographic().rotate([0, -90]).clipAngle(130), raw: d3.geoStereographicRaw, surf: 'azimutal', prop: 'conforme', au: 'Hiparco de Nicea', yr: 'c. 150 a. C.', keeps: 'Conserva los ángulos y transforma los círculos en círculos.', dist: 'Las áreas crecen muy rápido al alejarse del centro.', use: 'Mapas de las regiones polares, astrolabios y cristalografía.', clip: 130, phi: -90 },
  { id: 'gnomonic', n: 'Gnomónica', f: () => d3.geoGnomonic().rotate([0, -90]).clipAngle(60), surf: 'azimutal', prop: 'afilactica', au: 'Atribuida a Tales de Mileto', yr: 'c. 600 a. C.', keeps: 'Todos los círculos máximos son rectas: la ruta más corta entre dos puntos es una línea recta.', dist: 'Deformación enorme; no puede mostrar ni medio mundo.', use: 'Navegación: se traza la ruta ortodrómica con una regla.', clip: 60, phi: -90, anim: false },
  { id: 'ortho', n: 'Ortográfica', f: () => d3.geoOrthographic().rotate([0, -30]), raw: d3.geoOrthographicRaw, surf: 'azimutal', prop: 'afilactica', au: 'Hiparco de Nicea (uso en Durero)', yr: 'c. 150 a. C.', keeps: 'Muestra la Tierra como se ve desde el espacio lejano.', dist: 'Solo un hemisferio; los bordes se comprimen mucho.', use: 'Ilustraciones del globo y vistas en perspectiva.', clip: 90, phi: -30 },
  { id: 'goode', n: 'Goode homolosena interrumpida', f: () => d3.geoInterruptedHomolosine(), surf: 'otra', prop: 'equivalente', au: 'John Paul Goode', yr: '1923', keeps: 'Conserva las áreas y, al cortar los océanos, también bastante bien las formas de los continentes.', dist: 'Los océanos quedan partidos en gajos.', use: 'Mapas de distribución de usos del suelo, clima o población.', anim: false }
];
function extOf(def, p) { const c = p ? -p.rotate()[0] : 0; const e = def.ext || (def.lim ? [[-180, -def.lim], [180, def.lim]] : null); return e ? [[c + Math.max(e[0][0], -179.99), e[0][1]], [c + Math.min(e[1][0], 179.99), e[1][1]]] : null; }
function gratOf(def, p, step) { const e = extOf(def, p); const g = d3.geoGraticule(); if (e) g.extent(e); if (step) g.step(step); return g; }
function targetOf(def, p) { return def && def.surf !== 'azimutal' && extOf(def, p) ? gratOf(def, p).outline() : { type: 'Sphere' }; }
function projFit(p, w, h, pad = 8) { const def = PROJS.find(x => x.id === p.id); p._proj.fitExtent([[pad, pad], [w - pad, h - pad]], targetOf(def, p._proj)); }
function makeProj(def) { const p = def.f(); if (def.lim || def.ext) p.clipExtent(null); return p; }
function projThumb(def, w = 360, h = 220) {
  const p = makeProj(def); const o = { id: def.id, _proj: p }; projFit(o, w, h);
  const path = d3.geoPath(p); const land = CARTO.land();
  const tg = targetOf(def, p), gr = gratOf(def, p, [30, 30])();
  const cid = 'tc' + def.id;
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Mapa en proyección"><defs><clipPath id="${cid}"><path d="${path(tg)}"/></clipPath></defs><path d="${path(tg)}" fill="var(--ocean)" stroke="var(--muted)" stroke-width=".8"/><g clip-path="url(#${cid})"><path d="${path(gr)}" fill="none" stroke="var(--grat)" stroke-width=".6"/><path d="${path(land)}" fill="var(--p2)" stroke="var(--muted)" stroke-width=".4"/></g></svg>`;
}
const CARTO = {
  page: true, built: false,
  land() { if (!this._land) { this._land = topojson.feature(D.sphere, D.sphere.objects.land); this._cty = topojson.feature(D.sphere, D.sphere.objects.countries); } return this._land; },
  enter() {
    const pg = $('#page');
    if (!this.built || !pg.querySelector('.carto')) { pg.innerHTML = this.html(); this.built = true; this.init(); }
    else pg.scrollTop = 0;
  },
  leave() { if (this.raf) cancelAnimationFrame(this.raf); },
  html() {
    return `<div class="page-inner carto">
    <header style="display:grid;gap:10px;padding-bottom:10px">
      <h1>Cómo se dibuja la Tierra en un plano</h1>
      <p class="lead">Coordenadas para situar cualquier punto, y proyecciones para pasar una esfera a un papel. Todo lo de esta página entra también en el examen de cartografía.</p>
      <nav class="toc">${[['coord', 'Coordenadas'], ['lineas', 'Líneas notables'], ['husos', 'Husos horarios'], ['ortodromia', 'Círculos máximos'], ['naranja', 'La piel de naranja'], ['superficies', 'Superficies de proyección'], ['propiedades', 'Qué conserva cada una'], ['explorador', 'Explorador de proyecciones'], ['tamano', 'Tamaño real']].map(([a, n]) => `<a class="chip" href="#cartografia" data-jump="${a}">${n}</a>`).join('')}</nav>
    </header>
    <section id="s-coord">
      <h2>Coordenadas geográficas</h2>
      <h3>Paralelos y meridianos</h3>
      <div class="split">
        <div class="figure"><svg id="globe" viewBox="0 0 520 520" style="touch-action:none;cursor:grab"></svg><figcaption>Arrastra para girar el globo. Haz clic para leer las coordenadas de un punto. La línea rosa discontinua que se tuerce no es un meridiano: es la línea internacional de cambio de fecha (ver «Líneas notables»).</figcaption></div>
        <div class="stack">
          <p><b>Los paralelos</b> son círculos horizontales paralelos al ecuador. Indican la <b>latitud</b>: el ángulo al norte o al sur del ecuador, de 0° a 90° N o S. Son <i>círculos menores</i>, salvo el ecuador, y se encogen hacia los polos.</p>
          <p><b>Los meridianos</b> son semicírculos que unen los polos. Indican la <b>longitud</b>: el ángulo al este o al oeste del meridiano de Greenwich, de 0° a 180° E u O. Todos miden lo mismo y son mitades de <i>círculos máximos</i>.</p>
          <div class="card" id="coordOut" style="display:grid;gap:4px"><div class="eyebrow">Punto seleccionado</div><div class="muted">Haz clic en el globo.</div></div>
          <div class="card stack" style="gap:8px"><div class="eyebrow">Grados, minutos y segundos ⇄ decimales</div>
            <p class="small">1° = 60′ y 1′ = 60″. Así, 40,4168° equivale a 40° 25′ 0,5″. La forma decimal es la que usan el GPS y los mapas web.</p>
            <div class="row"><input id="decIn" class="kv" value="40.4168" style="width:110px;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--panel)" aria-label="Grados decimales"><span>→</span><b class="kv" id="dmsOut"></b></div>
          </div>
        </div>
      </div>
    </section>
    <section id="s-lineas">
      <h2>Líneas notables</h2>
      <h3>Por qué los trópicos y los círculos polares están donde están</h3>
      <div class="split">
        <div class="stack">
          <p>El eje de la Tierra está inclinado unos <b>23,44°</b> respecto a la perpendicular de su órbita. Esa inclinación fija las líneas notables:</p>
          <ul class="list" id="lineList"></ul>
          <p class="small muted">Pulsa una línea para resaltarla en el globo.</p>
        </div>
        <div class="figure">${tiltSvg()}<figcaption>Solsticio de junio: el Sol cae vertical sobre el trópico de Cáncer y no se pone dentro del círculo polar ártico.</figcaption></div>
      </div>
    </section>
    <section id="s-husos">
      <h2>Husos horarios</h2>
      <h3>15° de longitud = 1 hora</h3>
      <p>La Tierra gira 360° en 24 horas, así que cada hora gira 15°. Por eso hay 24 husos teóricos de 15°, centrados en múltiplos de 15° desde Greenwich (UTC). En la práctica los países ajustan los husos a sus fronteras: China usa una sola hora para un país que abarca casi cinco husos, y España usa UTC+1 aunque casi toda la Península está en el huso de Greenwich.</p>
      <div class="figure">
        <div class="row" style="justify-content:space-between"><div class="seg" id="tzMode"><button data-m="map" aria-pressed="true">Mapa</button><button data-m="globe" aria-pressed="false">Globo</button></div><label class="toggle small"><input type="checkbox" id="tzTheo" checked>Husos teóricos de 15°</label></div>
        <svg id="tzMap" viewBox="0 0 900 480" style="touch-action:none" role="img" aria-label="Mapa de husos horarios"></svg>
        <div class="card small" id="tzInfo">Pasa el ratón o pulsa sobre una zona para ver su hora y los países que la usan.</div>
        <figcaption>Colores: las zonas horarias reales, que siguen fronteras. Líneas discontinuas: los límites teóricos cada 15°, que son meridianos. Se muestra la hora estándar, sin horario de verano. Fuente: Natural Earth, corregida con los cambios hasta 2024 (Rusia, Kazajistán, Turquía, Venezuela, Sudán, Marruecos…).</figcaption>
      </div>
      <div class="figure" style="overflow-x:auto">${tzSvg()}<figcaption>Husos teóricos. La línea internacional de cambio de fecha sigue el antimeridiano (180°) con desvíos para no partir países en dos días distintos, como Kiribati, que en 1995 la desplazó al este de sus islas.</figcaption></div>
    </section>
    <section id="s-ortodromia">
      <h2>Círculos máximos</h2>
      <h3>Por qué la ruta más corta parece curva</h3>
      <div class="split">
        <div class="figure"><svg id="gcMap" viewBox="0 0 560 400"></svg><figcaption><span style="color:var(--sel)">━</span> ortodromia (círculo máximo, la ruta más corta) · <span style="color:var(--dispute-orange)">┅</span> loxodromia (rumbo constante, recta en Mercator)</figcaption></div>
        <div class="stack">
          <p>Un <b>círculo máximo</b> es cualquier círculo cuyo centro es el centro de la Tierra: el ecuador y todos los meridianos lo son. El arco de círculo máximo entre dos puntos es la ruta más corta (<b>ortodromia</b>). Los demás paralelos son <b>círculos menores</b>.</p>
          <p>En la proyección de Mercator, la ortodromia se ve curvada hacia el polo porque el mapa estira las latitudes altas. Por eso los vuelos de Madrid a Tokio pasan por Siberia.</p>
          <div class="row"><select id="gcA" aria-label="Origen"></select><span>→</span><select id="gcB" aria-label="Destino"></select></div>
          <div class="card small" id="gcOut"></div>
        </div>
      </div>
    </section>
    <section id="s-naranja">
      <h2>Proyecciones</h2>
      <h3>La piel de naranja: no se puede aplanar una esfera sin deformarla</h3>
      <p>Si pelas una naranja y aplastas la piel, se rompe o se estira. Con la Tierra pasa lo mismo (lo demostró Gauss en 1827): <b>ningún mapa plano conserva a la vez áreas, ángulos y distancias</b>. Cuantos más cortes, menos deformación, pero más huecos.</p>
      <div class="figure"><svg id="peel" viewBox="0 0 900 440"></svg><div class="row"><span class="small muted">Gajos:</span><div class="seg" id="peelSeg">${[1, 4, 8, 12, 24].map(n => `<button data-g="${n}" aria-pressed="${n === 12}">${n}</button>`).join('')}</div></div><figcaption>Proyección sinusoidal interrumpida en gajos, como la piel de una naranja.</figcaption></div>
    </section>
    <section id="s-superficies">
      <h2>Clasificación por superficie</h2>
      <h3>Cilindro, cono o plano</h3>
      <p>Muchas proyecciones se entienden imaginando una superficie desarrollable que envuelve o toca el globo, sobre la que se proyecta y que después se «desenrolla».</p>
      <div class="grid2">${surfFigs()}</div>
    </section>
    <section id="s-propiedades">
      <h2>Clasificación por propiedad</h2>
      <h3>Cada proyección sacrifica algo</h3>
      <div class="grid2">
        ${[['Conformes', 'Conservan los <b>ángulos</b> y las formas en zonas pequeñas. Deforman las áreas.', 'Mercator, Mercator transversa, Lambert cónica, estereográfica', 'var(--sel)'], ['Equivalentes', 'Conservan las <b>áreas</b> (los tamaños relativos). Deforman las formas.', 'Gall-Peters, Mollweide, Equal Earth, Albers, Goode', 'var(--ok)'], ['Equidistantes', 'Conservan las <b>distancias</b> desde un punto o a lo largo de ciertas líneas.', 'Azimutal equidistante, equirrectangular', 'var(--dispute-orange)'], ['Afilácticas (de compromiso)', 'No conservan nada exacto, pero <b>reparten</b> la deformación para que el conjunto se vea equilibrado.', 'Robinson, Winkel Tripel, ortográfica, gnomónica', 'var(--colony)']].map(([t, d, ex, c]) => `<div class="card stack" style="gap:6px;border-top:4px solid ${c}"><h3>${t}</h3><p>${d}</p><p class="small muted">Ejemplos: ${ex}</p></div>`).join('')}
      </div>
      <p class="small muted">Una proyección no puede ser a la vez conforme y equivalente.</p>
    </section>
    <section id="s-explorador">
      <h2>Explorador de proyecciones</h2>
      <h3>Mira cómo deforma cada una</h3>
      <div class="split">
        <div class="figure"><canvas id="projCv" width="720" height="440" aria-label="Mapa del mundo en la proyección elegida"></canvas>
          <div class="row"><label class="toggle"><input type="checkbox" id="tissot" checked>Indicatriz de Tissot</label><label class="toggle"><input type="checkbox" id="heat">Deformación de áreas</label></div>
          <div class="row small"><span class="muted">Centro</span><label>long. <input type="range" id="rotL" min="-180" max="180" value="0" aria-label="Longitud central"></label><label>lat. <input type="range" id="rotP" min="-90" max="90" value="0" aria-label="Latitud central"></label></div>
          <figcaption id="projCap">Los círculos de Tissot tienen todos el mismo tamaño real sobre el globo: en el mapa revelan cómo se deforman áreas y formas en cada lugar.</figcaption></div>
        <div class="stack"><select id="projSel" aria-label="Proyección" style="padding:8px;border-radius:9px;border:1px solid var(--line);background:var(--panel)">${PROJS.map(p => `<option value="${p.id}">${p.n}</option>`).join('')}</select><div class="card" id="projInfo"></div><div id="heatLeg" class="small muted" hidden></div></div>
      </div>
    </section>
    <section id="s-tamano" style="border-bottom:0">
      <h2>Tamaño real</h2>
      <h3>Arrastra un país hacia el ecuador</h3>
      <div class="split">
        <div class="figure"><svg id="tsMap" viewBox="0 0 600 520" style="touch-action:none"></svg><figcaption>Mercator. África, en gris oscuro, sirve de referencia. Arrastra el país y mira cómo «encoge» al acercarse al ecuador: su tamaño real no cambia.</figcaption></div>
        <div class="stack"><div class="chips" id="tsPick"></div><div class="card" id="tsOut"></div><button class="btn sm" id="tsReset">Devolver a su sitio</button></div>
      </div>
    </section></div>`;
  },
  init() {
    this.land();
    $$('[data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); $('#s-' + a.dataset.jump).scrollIntoView({ behavior: 'smooth' }); });
    this.initGlobe(); this.initDms(); this.initGC(); this.initTZ(); this.initPeel(); this.initExplorer(); this.initTrueSize();
  },
  /* ----- globo ----- */
  lines() {
    const lat = (n, v, d) => ({ n, d, g: { type: 'LineString', coordinates: d3.range(-180, 180.1, 2).map(x => [x, v]) } });
    const lon = (n, v, d) => ({ n, d, g: { type: 'LineString', coordinates: d3.range(-90, 90.1, 2).map(y => [v, y]) } });
    return [lat('Ecuador', 0, '0°. Divide la Tierra en hemisferios norte y sur; es el círculo máximo de los paralelos.'), lat('Trópico de Cáncer', 23.44, '23° 26′ N. El punto más al norte donde el Sol cae vertical (solsticio de junio).'), lat('Trópico de Capricornio', -23.44, '23° 26′ S. El punto más al sur donde el Sol cae vertical (solsticio de diciembre).'), lat('Círculo polar ártico', 66.56, '66° 34′ N (= 90° − 23,44°). Al norte hay al menos un día de sol de medianoche y una noche polar al año.'), lat('Círculo polar antártico', -66.56, '66° 34′ S. Lo mismo en el hemisferio sur.'), lon('Meridiano de Greenwich', 0, '0°. Meridiano de referencia desde la Conferencia de Washington (1884); pasa por el observatorio de Greenwich (Londres) y por Castellón.'), lon('Antimeridiano', 180, '180°. El opuesto de Greenwich, en mitad del Pacífico.'), { n: 'Línea internacional de cambio de fecha', d: 'No es un meridiano, aunque lo parezca: es una frontera acordada entre países, no una línea geométrica. Sigue más o menos el antimeridiano (180°), pero se tuerce a propósito para que ningún país quede partido en dos fechas distintas: rodea el extremo de Siberia (Chukotka sigue en el mismo día que el resto de Rusia), deja las Aleutianas con Alaska, hace un gran saliente al este para que todo Kiribati comparta fecha (1995) y pasa al este de Samoa, que en 2011 se saltó el 30 de diciembre para tener el mismo día que Australia y Nueva Zelanda. Al cruzarla hacia el oeste se suma un día; hacia el este se resta. Trazado aproximado.', g: { type: 'LineString', coordinates: [[180, 90], [180, 75], [-169, 68.3], [-169, 65], [180, 52], [180, 5], [-150, 5], [-150, -10], [-170.9, -10], [-170.9, -25], [180, -45], [180, -90]] } }];
  },
  initGlobe() {
    const svg = d3.select('#globe'), W = 520, proj = d3.geoOrthographic().scale(240).translate([W / 2, W / 2]).rotate([10, -25]).clipAngle(90), path = d3.geoPath(proj);
    const lines = this.lines(); let hl = 0;
    svg.append('circle').attr('cx', W / 2).attr('cy', W / 2).attr('r', 240).attr('fill', 'var(--ocean)').attr('stroke', 'var(--muted)');
    const grat = svg.append('path').attr('fill', 'none').attr('stroke', 'var(--grat)').attr('stroke-width', .7);
    const land = svg.append('path').attr('fill', 'var(--p2)').attr('stroke', 'var(--muted)').attr('stroke-width', .4);
    const lg = svg.append('g'); const pt = svg.append('g');
    const colors = ['var(--dispute-red)', 'var(--dispute-orange)', 'var(--dispute-orange)', 'var(--change)', 'var(--change)', 'var(--sel)', 'var(--colony)', '#d63384'];
    let clickP = null;
    const draw = () => {
      grat.attr('d', path(d3.geoGraticule().step([15, 15])())); land.attr('d', path(this._land));
      lg.selectAll('path').data(lines).join('path').attr('fill', 'none').attr('stroke', (d, i) => colors[i]).attr('stroke-width', (d, i) => i === hl ? 4 : 1.6).attr('stroke-dasharray', (d, i) => i === 7 ? '6 4' : null).attr('opacity', (d, i) => i === hl ? 1 : .55).attr('d', d => path(d.g));
      pt.selectAll('*').remove(); if (clickP) { const p = proj(clickP); const vis = d3.geoDistance(clickP, [-proj.rotate()[0], -proj.rotate()[1]]) < Math.PI / 2; if (vis) pt.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 6).attr('fill', '#ffde3b').attr('stroke', 'var(--ink)').attr('stroke-width', 2); }
    };
    let r0, p0, moved = false;
    svg.call(d3.drag().on('start', ev => { r0 = proj.rotate(); p0 = [ev.x, ev.y]; moved = false; svg.style('cursor', 'grabbing'); }).on('drag', ev => { const dx = ev.x - p0[0], dy = ev.y - p0[1]; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; proj.rotate([r0[0] + dx * 0.35, Math.max(-90, Math.min(90, r0[1] - dy * 0.35))]); draw(); }).on('end', ev => { svg.style('cursor', 'grab'); if (!moved) { const [x, y] = d3.pointer(ev.sourceEvent, svg.node()); const ll = proj.invert([x * 1, y * 1]); if (ll && Math.hypot(x - W / 2, y - W / 2) < 240) { clickP = ll; this.showCoord(ll); draw(); } } }));
    draw(); this.globeDraw = draw;
    const ul = $('#lineList'); ul.innerHTML = lines.map((l, i) => `<li><button data-l="${i}"><span class="dot" style="background:${colors[i]}"></span><span><b>${l.n}</b><br><span class="small">${l.d}</span></span></button></li>`).join('');
    $$('[data-l]', ul).forEach(b => b.onclick = () => { hl = +b.dataset.l; const l = lines[hl]; const c = l.g.coordinates[Math.floor(l.g.coordinates.length / 2)]; proj.rotate([-(hl === 7 ? 180 : c[0]), hl >= 5 ? -20 : -c[1] * 0.7]); draw(); $('#s-coord').scrollIntoView({ behavior: 'smooth' }); });
  },
  showCoord([lon, lat]) {
    const dms = (v, p, n) => { const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 60 - m) * 60; return `${d}° ${m}′ ${s.toFixed(0)}″ ${v >= 0 ? p : n}`; };
    const h = lon / 15; const sign = h >= 0 ? '+' : '−';
    $('#coordOut').innerHTML = `<div class="eyebrow">Punto seleccionado</div><div class="kv" style="font-size:16px">${dms(lat, 'N', 'S')}, ${dms(lon, 'E', 'O')}</div><div class="kv muted">${lat.toFixed(4)}, ${lon.toFixed(4)}</div><div class="small">Latitud ${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? 'norte' : 'sur'} · longitud ${Math.abs(lon).toFixed(1)}° ${lon >= 0 ? 'este' : 'oeste'}. Hora solar: UTC ${sign}${Math.abs(h).toFixed(1).replace('.', ',')} h (huso teórico ${sign}${Math.round(Math.abs(h))}).</div>`;
  },
  initDms() { const i = $('#decIn'), o = $('#dmsOut'); const f = () => { const v = parseFloat(String(i.value).replace(',', '.')); if (isNaN(v)) { o.textContent = '—'; return; } const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d) * 60 - m) * 60; o.textContent = `${v < 0 ? '−' : ''}${d}° ${m}′ ${s.toFixed(1).replace('.', ',')}″`; }; i.oninput = f; f(); },
  /* ----- husos horarios ----- */
  async initTZ() {
    let t; try { t = await fetch('data/tz.json').then(r => r.json()); } catch (e) { $('#tzInfo').textContent = 'No se pudo cargar el mapa de husos.'; return; }
    const zones = topojson.feature(t, t.objects.tz).features;
    const borders = topojson.mesh(D.sphere, D.sphere.objects.countries, (a, b) => a !== b);
    const svg = d3.select('#tzMap'), W = 900, H = 480;
    const pal = ['var(--p1)', 'var(--p6)', 'var(--p3)', 'var(--p2)', 'var(--p4)', 'var(--p5)'];
    const col = z => z !== Math.floor(z) ? 'var(--accent-soft)' : pal[((Math.floor(z) % 6) + 6) % 6];
    const fmtZ = z => { const s = z >= 0 ? '+' : '−', a = Math.abs(z), h = Math.floor(a), m = Math.round((a - h) * 60); return 'UTC' + (z === 0 ? '±0' : s + h + (m ? ':' + String(m).padStart(2, '0') : '')); };
    let mode = 'map', rot = [-10, -20], proj, path, sel = null;
    const gS = svg.append('path'), gZ = svg.append('g'), gLand = svg.append('path'), gB = svg.append('path'), gM = svg.append('g'), gL = svg.append('g'), gH = svg.append('g');
    const info = d => {
      if (!d) return;
      const p = d.properties, now = new Date(), loc = new Date(now.getTime() + p.z * 3600000);
      const hh = String(loc.getUTCHours()).padStart(2, '0') + ':' + String(loc.getUTCMinutes()).padStart(2, '0');
      const day = loc.getUTCDate() !== now.getUTCDate() ? (loc > now ? ' (ya es mañana)' : ' (todavía es ayer)') : '';
      const cs = (p.c || []).filter(c => D.info[c[0]] && c[0] !== 'ATA').map(c => esc(nameOf(c[0])) + (c[1] ? ' <span class="muted">(parte)</span>' : ''));
      const same = zones.filter(z => z.properties.z === p.z).length;
      $('#tzInfo').innerHTML = `<div class="row" style="gap:14px"><b class="kv" style="font-size:18px">${fmtZ(p.z)}</b><span>Ahora allí: <b class="kv">${hh}</b>${day}</span></div>
        <div style="margin-top:6px">${cs.length ? cs.join(', ') : 'Solo océano o regiones deshabitadas'}</div>
        ${/[a-záéíóú]/.test(p.p) && /\(/.test(p.p) && /Rusia|Kazaj|Turqu|Venez|Sud|Marrue|México/.test(p.p) ? `<div class="small muted" style="margin-top:4px">${esc(p.p)}</div>` : ''}
        ${p.z !== Math.round(p.z) ? '<div class="small muted" style="margin-top:4px">Huso con media hora o tres cuartos: algunos países ajustan su hora a su longitud real.</div>' : ''}`;
    };
    const setProj = () => {
      if (mode === 'map') proj = d3.geoEqualEarth().fitExtent([[6, 26], [W - 6, H - 6]], { type: 'Sphere' });
      else proj = d3.geoOrthographic().rotate(rot).clipAngle(90).fitExtent([[W / 2 - 228, 6], [W / 2 + 228, H - 6]], { type: 'Sphere' });
      path = d3.geoPath(proj);
    };
    const draw = () => {
      setProj();
      gS.attr('d', path({ type: 'Sphere' })).attr('fill', 'var(--ocean)').attr('stroke', 'var(--muted)').attr('stroke-width', .8);
      gZ.selectAll('path').data(zones).join('path').attr('d', path).attr('fill', d => col(d.properties.z)).attr('stroke', 'var(--panel)').attr('stroke-width', .5).style('cursor', 'pointer')
        .on('pointerenter', (ev, d) => { sel = d; info(d); hl(); }).on('click', (ev, d) => { sel = d; info(d); hl(); });
      gLand.attr('d', path(this._land)).attr('fill', 'var(--ink)').attr('fill-opacity', .12).attr('stroke', 'var(--ink)').attr('stroke-opacity', .45).attr('stroke-width', .6).style('pointer-events', 'none');
      gB.attr('d', path(borders)).attr('fill', 'none').attr('stroke', 'var(--ink)').attr('stroke-opacity', .35).attr('stroke-width', .5).style('pointer-events', 'none');
      gM.selectAll('*').remove(); gL.selectAll('*').remove();
      if ($('#tzTheo').checked) {
        for (let k = -12; k <= 12; k++) { const lon = k * 15 + 7.5; if (lon > 180) continue; gM.append('path').attr('d', path({ type: 'LineString', coordinates: d3.range(-90, 90.1, 3).map(y => [lon, y]) })).attr('fill', 'none').attr('stroke', 'var(--ink)').attr('stroke-opacity', .5).attr('stroke-dasharray', '3 3').attr('stroke-width', .8).style('pointer-events', 'none'); }
        if (mode === 'map') for (let k = -12; k <= 12; k++) { const p = proj([Math.max(-179, Math.min(179, k * 15)), 0]); gL.append('text').attr('class', 'svgmut').attr('x', p[0]).attr('y', 16).attr('font-size', 10.5).attr('text-anchor', 'middle').attr('font-family', 'IBM Plex Mono,monospace').text((k > 0 ? '+' : k < 0 ? '−' : '±') + Math.abs(k)); }
      }
      hl();
    };
    const hl = () => { gH.selectAll('*').remove(); if (sel) gH.append('path').attr('d', path(sel)).attr('fill', 'none').attr('stroke', 'var(--sel)').attr('stroke-width', 2.2).style('pointer-events', 'none'); };
    let r0, p0;
    svg.call(d3.drag().filter(() => mode === 'globe').on('start', ev => { r0 = rot.slice(); p0 = [ev.x, ev.y]; }).on('drag', ev => { rot = [r0[0] + (ev.x - p0[0]) * 0.35, Math.max(-80, Math.min(80, r0[1] - (ev.y - p0[1]) * 0.35))]; draw(); }));
    $$('#tzMode button').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('#tzMode button').forEach(x => x.setAttribute('aria-pressed', x === b)); svg.style('cursor', mode === 'globe' ? 'grab' : null); draw(); });
    $('#tzTheo').onchange = draw;
    draw();
    // zona de España peninsular por defecto
    sel = zones.find(z => z.properties.z === 1 && (z.properties.c || []).some(c => c[0] === 'ESP')) || null; info(sel); hl();
    this.tzTimer = setInterval(() => { if (sel && APP.tab === 'cartografia') info(sel); }, 30000);
  },
  /* ----- ortodromia ----- */
  initGC() {
    const A = $('#gcA'), B = $('#gcB'); const opts = CAR_CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join(''); A.innerHTML = opts; B.innerHTML = opts; A.value = 0; B.value = 2;
    const svg = d3.select('#gcMap'), proj = d3.geoMercator().fitExtent([[6, 6], [554, 394]], d3.geoGraticule().extentMajor([[-180, -75], [180, 82]]).outline()), path = d3.geoPath(proj);
    svg.append('path').attr('d', path(d3.geoGraticule().extentMajor([[-180, -75], [180, 82]]).outline())).attr('fill', 'var(--ocean)');
    svg.append('path').attr('d', path(d3.geoGraticule().extentMajor([[-180, -75], [180, 82]]).step([30, 15])())).attr('fill', 'none').attr('stroke', 'var(--grat)').attr('stroke-width', .6);
    svg.append('path').attr('d', path(this._land)).attr('fill', 'var(--p2)').attr('stroke', 'var(--muted)').attr('stroke-width', .3);
    const g = svg.append('g');
    const draw = () => {
      const a = CAR_CITIES[+A.value], b = CAR_CITIES[+B.value]; const pa = [a[1], a[2]], pb = [b[1], b[2]];
      g.selectAll('*').remove();
      const gc = { type: 'LineString', coordinates: d3.range(0, 1.0001, 0.01).map(d3.geoInterpolate(pa, pb)) };
      // loxodromia: recta en Mercator (por el lado corto en longitud)
      let dl = pb[0] - pa[0]; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
      const lox = { type: 'LineString', coordinates: d3.range(0, 1.0001, 0.01).map(t => { const y0 = Math.log(Math.tan(Math.PI / 4 + pa[1] * Math.PI / 360)), y1 = Math.log(Math.tan(Math.PI / 4 + pb[1] * Math.PI / 360)); const y = y0 + (y1 - y0) * t; let lon = pa[0] + dl * t; if (lon > 180) lon -= 360; if (lon < -180) lon += 360; return [lon, (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI]; }) };
      g.append('path').attr('d', path(lox)).attr('fill', 'none').attr('stroke', 'var(--dispute-orange)').attr('stroke-width', 2.2).attr('stroke-dasharray', '5 4');
      g.append('path').attr('d', path(gc)).attr('fill', 'none').attr('stroke', 'var(--sel)').attr('stroke-width', 2.8);
      [a, b].forEach(c => { const p = proj([c[1], c[2]]); g.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 4.5).attr('fill', 'var(--ink)'); g.append('text').attr('x', p[0] + 7).attr('y', p[1] - 6).attr('class', 'svgtxt').attr('font-size', 13).attr('font-weight', 700).attr('paint-order', 'stroke').attr('stroke', 'var(--panel)').attr('stroke-width', 3).text(c[0]); });
      const R = 6371; const dGC = d3.geoDistance(pa, pb) * R;
      const p1 = pa[1] * Math.PI / 180, p2 = pb[1] * Math.PI / 180, dphi = p2 - p1, dpsi = Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2)); const qq = Math.abs(dpsi) > 1e-12 ? dphi / dpsi : Math.cos(p1); const dLox = Math.sqrt(dphi * dphi + qq * qq * (dl * Math.PI / 180) ** 2) * R;
      $('#gcOut').innerHTML = `Ortodromia: <b class="kv">${nf.format(Math.round(dGC))} km</b> · loxodromia: <b class="kv">${nf.format(Math.round(dLox))} km</b>${dLox > dGC + 5 ? ` · ahorro: <b>${nf.format(Math.round(dLox - dGC))} km</b> (${Math.round((dLox - dGC) / dLox * 100)} %)` : ''}`;
    };
    A.onchange = B.onchange = draw; draw();
  },
  /* ----- piel de naranja ----- */
  initPeel() {
    const svg = d3.select('#peel'); const land = this._land;
    const draw = n => {
      svg.selectAll('*').remove();
      let proj;
      if (n === 1) proj = d3.geoSinusoidal();
      else { const w = 360 / n; const lobes = [[], []]; for (let i = 0; i < n; i++) { const a = -180 + i * w, b = a + w / 2, c = a + w; lobes[0].push([[a, 0], [b, 90], [c, 0]]); lobes[1].push([[a, 0], [b, -90], [c, 0]]); } proj = d3.geoInterrupt(d3.geoSinusoidalRaw, lobes); }
      proj.fitExtent([[8, 8], [892, 432]], { type: 'Sphere' }); const path = d3.geoPath(proj);
      svg.append('path').attr('d', path({ type: 'Sphere' })).attr('fill', '#f3a03a').attr('stroke', '#c06a12').attr('stroke-width', 1.2);
      svg.append('path').attr('d', path(d3.geoGraticule().step([15, 15])())).attr('fill', 'none').attr('stroke', 'rgba(255,255,255,.35)').attr('stroke-width', .6);
      svg.append('path').attr('d', path(land)).attr('fill', '#fde3b8').attr('stroke', '#b0601a').attr('stroke-width', .4);
    };
    draw(12);
    $$('#peelSeg button').forEach(b => b.onclick = () => { $$('#peelSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(+b.dataset.g); });
  },
  /* ----- explorador ----- */
  initExplorer() {
    const cv = $('#projCv'), ctx = cv.getContext('2d'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = 720, H = 440; cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
    let cur = PROJS.find(p => p.id === 'mercator'); let proj = makeProj(cur); let rot = [0, 0];
    const tissot = () => { const out = []; for (let y = -60; y <= 60; y += 30) for (let x = -150; x <= 180; x += 30) out.push(d3.geoCircle().center([x, y]).radius(4.5)()); for (const y of [-75, 75]) for (let x = -150; x <= 180; x += 60) out.push(d3.geoCircle().center([x, y]).radius(4.5)()); return { type: 'GeometryCollection', geometries: out }; };
    const TIS = tissot();
    const cells = []; for (let y = -80; y < 80; y += 5) for (let x = -180; x < 180; x += 5) cells.push({ type: 'Polygon', coordinates: [[[x, y], [x, y + 5], [x + 5, y + 5], [x + 5, y], [x, y]]] });
    const draw = (p, def) => {
      const path = d3.geoPath(p, ctx); ctx.clearRect(0, 0, W, H);
      const tg = def ? targetOf(def, p) : { type: 'Sphere' };
      ctx.beginPath(); path(tg); ctx.fillStyle = css('--ocean'); ctx.fill();
      ctx.save(); ctx.beginPath(); path(tg); ctx.clip();
      if ($('#heat').checked && def) {
        const areas = cells.map(c => { const pa = path.area(c), sa = d3.geoArea(c); return pa > 0 && isFinite(pa) ? pa / sa : null; });
        const v = areas.filter(x => x).sort((a, b) => a - b); const ref = v[Math.floor(v.length * 0.25)] || 1;
        const sc = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 3]);
        cells.forEach((c, i) => { if (!areas[i]) return; const r = Math.log2(areas[i] / ref); ctx.beginPath(); path(c); ctx.fillStyle = r < 0.1 ? 'rgba(255,255,255,0)' : sc(Math.min(3, r)); ctx.globalAlpha = .7; ctx.fill(); ctx.globalAlpha = 1; });
      }
      ctx.beginPath(); path(def ? gratOf(def, p, [15, 15])() : d3.geoGraticule().step([15, 15])()); ctx.strokeStyle = css('--grat'); ctx.lineWidth = .6; ctx.stroke();
      ctx.beginPath(); path(this._land); ctx.fillStyle = css('--p2'); ctx.globalAlpha = $('#heat').checked ? .55 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css('--muted'); ctx.lineWidth = .4; ctx.stroke();
      if ($('#tissot').checked) { ctx.beginPath(); path(TIS); ctx.fillStyle = 'rgba(208,38,27,.45)'; ctx.fill(); ctx.strokeStyle = 'rgba(160,20,10,.9)'; ctx.lineWidth = .8; ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); path(tg); ctx.strokeStyle = css('--muted'); ctx.lineWidth = 1; ctx.stroke();
    };
    const fitP = (p, def) => { p.fitExtent([[10, 10], [W - 10, H - 10]], targetOf(def, p)); };
    const azDef = def => def.id === 'ortho' ? 30 : 90;
    const setup = def => { const p = makeProj(def); if (def.surf === 'azimutal') p.rotate([-rot[0], -rot[1]]); else if (def.surf === 'conica') p.rotate([(def.rot || 0) - rot[0], 0]); else p.rotate([-rot[0], 0]); fitP(p, def); return p; };
    const info = def => { $('#projInfo').innerHTML = `<h3>${def.n}</h3><dl class="projinfo" style="margin-top:8px"><dt>Tipo</dt><dd>${SURFN[def.surf]}</dd><dt>Propiedad</dt><dd>${PROPN[def.prop]}</dd><dt>Conserva</dt><dd>${def.keeps}</dd><dt>Deforma</dt><dd>${def.dist}</dd><dt>Se usa en</dt><dd>${def.use}</dd><dt>Autor</dt><dd>${def.au} (${def.yr})</dd></dl>`; };
    const render = () => { proj = setup(cur); draw(proj, cur); };
    const go = id => {
      const next = PROJS.find(p => p.id === id); const from = cur; info(next); $('#heatLeg').hidden = !$('#heat').checked;
      const rp = $('#rotP'); if (next.surf === 'azimutal') { if (from.surf !== 'azimutal') { rot[1] = azDef(next); } rp.disabled = false; } else { rot[1] = 0; rp.disabled = true; } rp.value = rot[1];
      if (this.raf) cancelAnimationFrame(this.raf);
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || from.anim === false || next.anim === false || !from.raw || !next.raw || from.surf === 'azimutal' || next.surf === 'azimutal') { cur = next; render(); return; }
      const t0 = performance.now(), dur = 900; const r0 = from.raw, r1 = next.raw;
      const step = ts => {
        let t = Math.min(1, (ts - t0) / dur); t = d3.easeCubicInOut(t);
        const raw = (l, p) => { const a = r0(l, p), b = r1(l, p); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
        const p = d3.geoProjection(raw).rotate([-rot[0] + ((from.rot || 0) * (1 - t) + (next.rot || 0) * t), 0]);
        const lim = Math.min(from.lim || 90, next.lim || 90);
        p.fitExtent([[10, 10], [W - 10, H - 10]], d3.geoGraticule().extentMajor([[-180, -lim + .01], [180, lim - .01]]).outline());
        draw(p, null);
        if (t < 1) this.raf = requestAnimationFrame(step); else { cur = next; render(); }
      };
      this.raf = requestAnimationFrame(step);
    };
    $('#projSel').onchange = e => go(e.target.value);
    $('#tissot').onchange = render; $('#heat').onchange = () => { $('#heatLeg').hidden = !$('#heat').checked; render(); };
    $('#heatLeg').innerHTML = 'Mapa de calor: amarillo = área ampliada ×2, rojo = ×8 o más (respecto a la zona menos deformada). En una proyección equivalente no aparece color.';
    $('#rotL').oninput = e => { rot[0] = +e.target.value; render(); };
    $('#rotP').oninput = e => { rot[1] = +e.target.value; render(); };
    info(cur); $('#rotP').disabled = true; render();
    this.explorerRedraw = render;
  },
  /* ----- tamaño real ----- */
  initTrueSize() {
    const svg = d3.select('#tsMap'), W = 600, H = 520;
    const proj = d3.geoMercator().fitExtent([[4, 4], [W - 4, H - 4]], d3.geoGraticule().extentMajor([[-180, -70], [180, 82]]).outline()); const path = d3.geoPath(proj);
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', 'var(--ocean)');
    svg.append('path').attr('d', path(d3.geoGraticule().step([30, 15])())).attr('fill', 'none').attr('stroke', 'var(--grat)').attr('stroke-width', .6);
    const n3reg = {}; for (const e of Object.values(D.info)) if (e.n3) n3reg[e.n3] = e;
    const cty = this._cty.features;
    svg.append('g').selectAll('path').data(cty).join('path').attr('d', path).attr('fill', d => (n3reg[d.id] && n3reg[d.id].reg === 'África') ? 'var(--muted)' : 'var(--p2)').attr('stroke', 'var(--panel)').attr('stroke-width', .3);
    const ghost = svg.append('path').attr('fill', 'none').attr('stroke', 'var(--sel)').attr('stroke-dasharray', '4 3').attr('stroke-width', 1.2);
    const mv = svg.append('path').attr('fill', 'var(--sel)').attr('fill-opacity', .55).attr('stroke', 'var(--sel)').attr('stroke-width', 1.5).style('cursor', 'move');
    const choices = [['304', 'Groenlandia'], ['643', 'Rusia'], ['124', 'Canadá'], ['840', 'Estados Unidos'], ['036', 'Australia'], ['076', 'Brasil'], ['356', 'India'], ['156', 'China'], ['724', 'España'], ['010', 'Antártida']];
    $('#tsPick').innerHTML = choices.map(([id, n]) => `<button class="chip" data-ts="${id}">${n}</button>`).join('');
    let feat, c0, pos;
    const moved = () => { const r1 = d3.geoRotation([-c0[0], -c0[1]]), r2 = d3.geoRotation([-pos[0], -pos[1]]).invert; const tr = c => { const p = r2(r1(c)); return p; }; const mapC = g => ({ type: g.type, coordinates: g.type === 'Polygon' ? g.coordinates.map(r => r.map(tr)) : g.coordinates.map(p => p.map(r => r.map(tr))) }); return { type: 'Feature', geometry: mapC(feat.geometry) }; };
    const draw = () => {
      if (!feat) return; const m = moved(); mv.attr('d', path(m)); ghost.attr('d', path(feat));
      const realA = d3.geoArea(feat) * 6371 * 6371; const appA = path.area(m), appO = path.area(feat);
      const name = choices.find(c => c[0] === feat.id)[1];
      const afr = 30.37e6;
      $('#tsOut').innerHTML = `<h3>${name}</h3><p class="small" style="margin-top:6px">Superficie real: <b class="kv">${nf.format(Math.round(realA / 1000) * 1000)} km²</b> (${(realA / afr * 100).toFixed(1).replace('.', ',')} % de África).</p><p class="small">En su posición real, Mercator la dibuja <b>${(appO / appA).toFixed(1).replace('.', ',')} veces</b> más grande que en la posición actual (latitud ${pos[1].toFixed(0)}°).</p><p class="small muted">El factor de ampliación de áreas de Mercator es 1/cos²(latitud): ×1 en el ecuador, ×4 a 60°, ×33 a 80°.</p>`;
    };
    const pick = id => { $$('[data-ts]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ts === id)); feat = cty.find(f => f.id === id); c0 = d3.geoCentroid(feat); if (id === '010') c0 = [0, -80]; pos = id === '304' ? [20, 5] : c0.slice(); if (id === '304') { pos = c0.slice(); } draw(); };
    $$('[data-ts]').forEach(b => b.onclick = () => pick(b.dataset.ts));
    $('#tsReset').onclick = () => { pos = c0.slice(); draw(); };
    mv.call(d3.drag().on('drag', ev => { const ll = proj.invert([ev.x, ev.y]); if (ll) { pos = [ll[0], Math.max(-75, Math.min(80, ll[1]))]; draw(); } }));
    pick('304');
  },
  select() { }
};
function tiltSvg() {
  const cx = 250, cy = 200, R = 120, tilt = -23.44 * Math.PI / 180;
  const lat = (deg, cls, label, col) => { const y = -R * Math.sin(deg * Math.PI / 180), hw = R * Math.cos(deg * Math.PI / 180); const ry = cy + hw * Math.sin(tilt) + y * Math.cos(tilt), rx = cx + hw * Math.cos(tilt) - y * Math.sin(tilt); return `<g transform="rotate(-23.44 ${cx} ${cy})"><line x1="${cx - hw}" y1="${cy + y}" x2="${cx + hw}" y2="${cy + y}" stroke="${col}" stroke-width="2"/></g><line x1="${rx}" y1="${ry}" x2="${cx + R + 30}" y2="${ry}" stroke="${col}" stroke-width=".8" stroke-dasharray="2 2"/><text class="svgtxt" font-size="12.5" x="${cx + R + 34}" y="${ry + 4}" style="fill:${col}">${label}</text>`; };
  let rays = ''; for (let i = -5; i <= 5; i++) rays += `<line x1="0" y1="${cy + i * 26}" x2="${cx - Math.sqrt(Math.max(0, R * R - (i * 26) ** 2)) - 4}" y2="${cy + i * 26}" stroke="#e8b400" stroke-width="1.2" marker-end="url(#arr)"/>`;
  return `<svg viewBox="0 0 600 400" role="img" aria-label="Inclinación del eje terrestre en el solsticio de junio"><defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L6 3L0 6z" fill="#e8b400"/></marker></defs>
  <text class="svgmut" x="6" y="20" font-size="12.5">Rayos del Sol</text>${rays}
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="var(--ocean)" stroke="var(--muted)" stroke-width="1.5"/>
  <path d="M${cx} ${cy - R} A${R} ${R} 0 0 1 ${cx} ${cy + R} Z" fill="rgba(10,20,40,.22)"/>
  <g transform="rotate(-23.44 ${cx} ${cy})"><line x1="${cx}" y1="${cy - R - 40}" x2="${cx}" y2="${cy + R + 40}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 4"/><text class="svgtxt" x="${cx + 6}" y="${cy - R - 28}" font-size="12.5">Eje</text></g>
  <line x1="${cx}" y1="${cy - R - 40}" x2="${cx}" y2="${cy + R + 40}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 3"/>
  <text class="svgtxt" x="${cx - 112}" y="${cy - R - 14}" font-size="13" font-weight="700">23,44°</text>
  ${lat(66.56, '', 'Círculo polar ártico 66° 34′ N', 'var(--change)')}${lat(23.44, '', 'Trópico de Cáncer 23° 26′ N', 'var(--dispute-orange)')}${lat(0, '', 'Ecuador 0°', 'var(--dispute-red)')}${lat(-23.44, '', 'Trópico de Capricornio', 'var(--dispute-orange)')}${lat(-66.56, '', 'Círculo polar antártico', 'var(--change)')}
  <text class="svgmut" x="${cx + 12}" y="${cy + R + 34}" font-size="12">Mitad en sombra: noche</text></svg>`;
}
function tzSvg() {
  let s = `<svg viewBox="0 0 960 120" style="min-width:720px" role="img" aria-label="Husos horarios teóricos">`;
  for (let i = 0; i < 24; i++) { const off = i - 12 + 0; const x = 20 + i * 38.3; s += `<rect x="${x}" y="22" width="38.3" height="56" fill="${i % 2 ? 'var(--p6)' : 'var(--p1)'}" stroke="var(--panel)"/><text class="svgtxt" x="${x + 19}" y="54" font-size="12" text-anchor="middle" font-family="IBM Plex Mono,monospace">${off > 0 ? '+' : off < 0 ? '−' : '±'}${Math.abs(off)}</text>`; }
  for (let lon = -180; lon <= 180; lon += 45) { const x = 20 + (lon + 187.5) / 15 * 38.3; s += `<text class="svgmut" x="${x}" y="96" font-size="11" text-anchor="middle">${Math.abs(lon)}°${lon > 0 ? 'E' : lon < 0 ? 'O' : ''}</text><line x1="${x}" y1="78" x2="${x}" y2="84" stroke="var(--muted)"/>`; }
  s += `<text class="svgtxt" x="${20 + 12.5 * 38.3}" y="14" font-size="12" text-anchor="middle" font-weight="700">UTC (Greenwich)</text><text class="svgmut" x="20" y="114" font-size="11">Cada franja = 15° = 1 hora. Hacia el este, se suma una hora por huso.</text></svg>`;
  return s;
}
function surfFigs() {
  const globe = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--ocean)" stroke="var(--muted)"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.28}" fill="none" stroke="var(--grat)"/><ellipse cx="${cx}" cy="${cy - r * 0.55}" rx="${r * 0.83}" ry="${r * 0.22}" fill="none" stroke="var(--grat)"/><ellipse cx="${cx}" cy="${cy + r * 0.55}" rx="${r * 0.83}" ry="${r * 0.22}" fill="none" stroke="var(--grat)"/><path d="M${cx} ${cy - r} C ${cx + r * 0.55} ${cy - r * 0.6}, ${cx + r * 0.55} ${cy + r * 0.6}, ${cx} ${cy + r}" fill="none" stroke="var(--grat)"/>`;
  const arrow = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="var(--muted)" stroke-width="1.5" marker-end="url(#ar2)"/><text class="svgmut" x="${(x1 + x2) / 2}" y="${y - 8}" font-size="11" text-anchor="middle">se desenrolla</text>`;
  const defs = `<defs><marker id="ar2" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L6 3L0 6z" fill="var(--muted)"/></marker></defs>`;
  const S = 'fill="rgba(22,64,163,.12)" stroke="var(--sel)" stroke-width="1.6"';
  let grid = ''; for (let i = 0; i <= 6; i++) grid += `<line x1="${215 + i * 18}" y1="40" x2="${215 + i * 18}" y2="150" stroke="var(--sel)" stroke-width=".7"/>`; for (let j = 0; j <= 5; j++) grid += `<line x1="215" y1="${40 + j * 22}" x2="323" y2="${40 + j * 22}" stroke="var(--sel)" stroke-width=".7"/>`;
  let fan = ''; for (let i = 0; i <= 6; i++) { const a = (-60 + i * 20) * Math.PI / 180; fan += `<line x1="270" y1="30" x2="${270 + 120 * Math.sin(a)}" y2="${30 + 120 * Math.cos(a)}" stroke="var(--sel)" stroke-width=".7"/>`; } for (const r of [60, 90, 120]) fan += `<path d="M${270 + r * Math.sin(-60 * Math.PI / 180)} ${30 + r * Math.cos(60 * Math.PI / 180)} A${r} ${r} 0 0 0 ${270 + r * Math.sin(60 * Math.PI / 180)} ${30 + r * Math.cos(60 * Math.PI / 180)}" fill="none" stroke="var(--sel)" stroke-width=".7"/>`;
  let disc = ''; for (const r of [20, 40, 60]) disc += `<circle cx="275" cy="95" r="${r}" fill="none" stroke="var(--sel)" stroke-width=".7"/>`; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; disc += `<line x1="275" y1="95" x2="${275 + 60 * Math.cos(a)}" y2="${95 + 60 * Math.sin(a)}" stroke="var(--sel)" stroke-width=".7"/>`; }
  const fig = (title, body, txt) => `<div class="figure"><svg viewBox="0 0 340 190" role="img" aria-label="${title}">${defs}${body}</svg><div><h3>${title}</h3><p class="small" style="margin-top:4px">${txt}</p></div></div>`;
  return fig('Cilíndrica', `${globe(80, 95, 55)}<rect x="25" y="25" width="110" height="140" ${S}/><ellipse cx="80" cy="25" rx="55" ry="12" ${S}/><ellipse cx="80" cy="165" rx="55" ry="12" fill="none" stroke="var(--sel)" stroke-width="1.6"/>${arrow(145, 205, 95)}<rect x="215" y="40" width="108" height="110" fill="rgba(22,64,163,.12)"/>${grid}`, 'Un cilindro envuelve el globo tocándolo en el ecuador. Meridianos y paralelos salen como rectas que se cortan en ángulo recto. Ejemplos: Mercator, Gall-Peters.')
    + fig('Cónica', `${globe(80, 115, 50)}<path d="M80 18 L22 128 A58 14 0 0 0 138 128 Z" ${S}/><ellipse cx="80" cy="96" rx="44" ry="11" fill="none" stroke="var(--dispute-red)" stroke-width="2"/>${arrow(150, 205, 95)}<path d="M270 30 L${270 + 120 * Math.sin(-60 * Math.PI / 180)} ${30 + 120 * Math.cos(60 * Math.PI / 180)} A120 120 0 0 0 ${270 + 120 * Math.sin(60 * Math.PI / 180)} ${30 + 120 * Math.cos(60 * Math.PI / 180)} Z" fill="rgba(22,64,163,.12)"/>${fan}`, 'Un cono se apoya sobre uno o dos paralelos (en rojo), donde no hay deformación. Ideal para países de latitudes medias. Ejemplos: Lambert, Albers.')
    + fig('Azimutal o plana', `${globe(80, 110, 55)}<path d="M20 52 L140 52 L120 70 L0 70 Z" ${S}/><circle cx="80" cy="56" r="3" fill="var(--dispute-red)"/>${arrow(150, 205, 95)}<circle cx="275" cy="95" r="60" fill="rgba(22,64,163,.12)"/>${disc}`, 'Un plano toca el globo en un punto (a menudo un polo). Los meridianos salen como radios y los paralelos como círculos. Ejemplos: estereográfica, gnomónica, azimutal equidistante.');
}
APP.tabs.cartografia = CARTO;
