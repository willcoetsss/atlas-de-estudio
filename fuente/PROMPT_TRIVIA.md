# Prompt: pestaña Trivia para el Atlas de Estudio

Pégalo tal cual en una conversación nueva (o en esta) para que Claude construya la pestaña.

---

## Contexto

Tengo una aplicación web de geografía llamada **Atlas de Estudio**, publicada en GitHub Pages (repositorio `willcoetsss/atlas-de-estudio`) y como artifact en Claude. Ya tiene cinco pestañas: Explorar, Examen, Físico, Cartografía y Progreso. Quiero añadir una sexta, **Trivia**, con juegos rápidos de comparar y adivinar países, al estilo de los juegos de geografía que circulan por internet (Worldle, Travle, Higher or Lower, Globle).

Trivia no sustituye a Examen. Examen sirve para memorizar con repetición espaciada; Trivia es para jugar partidas cortas, batir récords y aprender relaciones entre países (quién es más grande, quién está más al norte, cómo se llega de uno a otro).

### Cómo está hecha la app (respétalo)

- Un solo `index.html` que se genera con `scripts/build_html.py` a partir de `src/index.html` y de los módulos de `src/js/` (`core`, `explore`, `carto`, `quiz`, `phys`, `progress`, `main`). Añade un módulo `src/js/trivia.js` e inclúyelo en el orden de `build_html.py`, antes de `main`.
- Librerías: D3 7.9.0, topojson-client 3.1.0 y d3-geo-projection 4.0.0 desde jsDelivr. No añadas otras sin justificarlo.
- Cada pestaña es un objeto registrado en `APP.tabs.<nombre>` con `enter()`, `leave()` y, si los necesita, `click(id)`, `hover(id)`, `key(e)`, `resized()` y `refresh()`. Las pestañas con mapa usan el panel lateral (`setPanel(html)`); las de página completa ponen `page: true`.
- Mapa: objeto `MAP` (proyección Equal Earth ya proyectada, `MAP.fit(bounds)`, `MAP.home()`, `MAP.paint(fn)`, `MAP.cty`, capas `gHL` y `gTop` para resaltar y etiquetar). Hay una capa `#silo` que muestra la silueta aislada de un país (`QUIZ.silo(id)` y `silFeature(id)`): reutilízala.
- Datos en `D.info[id]` (clave ISO3) para 197 Estados (`D.states`) y unos 50 territorios: `name`, `cap`, `capPt` [lon, lat], `pop` (millones), `area` (km²), `ll` y `lab` (punto de etiqueta), `reg` (continente), `sub` (subregión), `borders` (vecinos por tierra), `langN`, `cur`, `iso2`, `cities` (con población), `flagSim` (banderas parecidas). También `D.pidx` (mares que bañan cada país), `data/tz.json` (husos horarios), `flagBox(id, alto)` para pintar banderas con su proporción oficial y `D.tinySet` (microestados).
- Guardado: `STORE` (localStorage y copia en la cuenta del usuario cuando corre dentro de Claude). Guarda lo de Trivia en `STORE.d.set.trivia` (récords, partidas, reto diario) y llama a `STORE.save()`. No mezcles las partidas de Trivia con la repetición espaciada de Examen.
- Estilo: variables CSS ya definidas en `:root` (claro y oscuro), tipografías Alegreya, Alegreya Sans e IBM Plex Mono, componentes `.btn`, `.chip`, `.seg`, `.card`, `.opt`, `.fb`. No inventes una estética nueva.
- Móvil: la app se usa en horizontal, con las pestañas en una columna a la izquierda y el panel a la derecha. Añade el botón de Trivia a esa columna con su icono (mismo trazo que los demás, 24×24) y comprueba que caben seis pestañas en 360 px de alto.

## Reglas de interacción (obligatorias en todos los juegos)

1. Tocar una respuesta ya es responder. Nada de botón «Confirmar».
2. Al aparecer una pregunta, ninguna opción puede salir resaltada. El resaltado al pasar el ratón solo existe en dispositivos con ratón y solo después de moverlo (mira cómo lo resuelve `QUIZ` con la clase `.fresh` y `@media (hover:hover)`).
3. Tras responder, se ve el resultado con el dato real (por ejemplo «Brasil: 8,5 millones de km² · Argentina: 2,8 millones») y se pasa sola a la siguiente: 1,2 s si aciertas y unos 2,5 s si fallas. Tocar el mensaje detiene la cuenta atrás.
4. Botones de al menos 44 px de alto en móvil y textos que no se corten en 844×390.
5. Cuando el juego use el mapa, se resalta y se encuadra lo que se pregunta, y al terminar se puede pulsar un país para abrir su ficha en Explorar.

## Juegos que quiero

Ordénalos así en la portada de Trivia, cada uno como una tarjeta con nombre, una línea de explicación y el récord personal.

### Imprescindibles (primera versión)

1. **¿Más o menos?** (como Higher or Lower). Aparecen dos países con su bandera; tocas el que tiene más del dato elegido. Si aciertas, el ganador se queda y entra otro. Termina al primer fallo; el récord es la racha más larga.
   Datos para elegir antes de empezar: superficie, población, densidad (calculada como `pop / area`), más al norte, más al sur, más al este, más al oeste (latitud y longitud de la capital, `capPt`), número de vecinos, población de la capital.
   Evita empates o casi empates: si la diferencia es menor del 3 %, busca otra pareja.

2. **Ordena** (ranking). Cinco países desordenados; arrástralos o tócalos en orden del mayor al menor (o de norte a sur). Se puntúa cada posición correcta y se enseña el orden real con las cifras. Mismos datos que el juego anterior.

3. **Recorrido** (como Travle). Te doy un país de salida y uno de llegada, por ejemplo Portugal → Polonia. Tienes que escribir o tocar en el mapa los países intermedios para unirlos solo por fronteras terrestres (`borders`). Se calcula con BFS el camino más corto y te puntúo según cuántos intentos de más usas. En el mapa se van pintando los países que aciertas. Incluye una pista que revela el siguiente país del camino a cambio de puntos. Solo se proponen parejas conectadas por tierra y con un camino de entre 3 y 7 pasos según la dificultad.

4. **Silueta con pistas** (como Worldle). Ves la silueta de un país (reutiliza `#silo`) y tienes seis intentos escritos. Tras cada fallo te digo la distancia en kilómetros entre capitales y una flecha con la dirección hacia el país correcto. Al acertar o agotar intentos, el mapa vuela al país.

5. **Frío o caliente** (como Globle). Hay un país secreto. Escribes países y cada uno se pinta en el mapa con un color más cálido cuanto más cerca esté del secreto (distancia mínima entre fronteras; si no la tienes, entre capitales). Sin límite de intentos; se puntúa por intentos usados.

6. **Contrarreloj**. 60 segundos para responder todas las preguntas que puedas de un tipo: capitales, banderas o «nombra los países de un continente» escribiendo, como en Sporcle, con los que aciertas pintándose en el mapa y la lista de los que faltaban al acabar.

### Para una segunda versión

7. **El intruso**: cuatro países y uno no cumple la regla (no tiene costa, no está en la UE, no habla español, no limita con Rusia). Tocas el intruso y se explica la regla.
8. **Verdadero o falso exprés**: afirmaciones generadas con los datos («Chile es más largo que Brasil de norte a sur», «Mongolia no tiene costa»), respuesta con un toque.
9. **Cinco pistas**: un país se va desvelando con pistas cada vez más fáciles (continente, idioma, número de vecinos, inicial de la capital, bandera). Cuantas menos pistas uses, más puntos.
10. **¿Qué mar lo baña?** y **¿Cuántos husos horarios tiene?**, usando `D.pidx` y `tz.json`.
11. **Distancia a ojo**: estima los kilómetros entre dos capitales con un deslizador; se puntúa según lo cerca que te quedes (círculo máximo, como ya se explica en Cartografía).

## Reto diario

Un botón «Reto del día» que junta cinco preguntas de los juegos 1 a 4, iguales para todo el mundo ese día: genera los países con una semilla basada en la fecha (por ejemplo, un generador mulberry32 con `AAAAMMDD`). Solo se puede jugar una vez al día. Al terminar, un botón copia el resultado en texto para compartirlo, al estilo Wordle:

```
Atlas · Reto 4/11/2026
🟩🟩🟥🟩🟨  4/5
```

Guarda el historial y la racha de días seguidos jugando.

## Ajustes comunes

- Región: todo el mundo o uno o varios continentes (mismos chips que en Examen).
- Dificultad: fácil (solo países grandes o conocidos, por ejemplo los 100 más poblados más los de la región elegida), media y difícil (todos, microestados incluidos).
- Interruptor para incluir territorios dependientes en los juegos de comparar.

## Datos

- Usa solo lo que ya está en `data/`. La población y la superficie llevan la referencia de junio de 2026 que ya figura en la app; muéstrala en pequeño en los juegos de comparar.
- Si una idea necesita un dato que no existe (PIB, esperanza de vida, altitud media), no lo inventes: déjalo fuera y apúntalo en la lista de mejoras del README, con la fuente que habría que usar (por ejemplo, el Banco Mundial).

## Progreso

En la pestaña Progreso añade una tarjeta «Trivia» con el récord de cada juego, partidas jugadas, la racha del reto diario y los países en los que más fallas en «¿Más o menos?» y «Recorrido».

## Entregables

1. `src/js/trivia.js`, los cambios en `src/index.html`, `core.js`, `progress.js` y `build_html.py`, y la app compilada.
2. Probado con Playwright en 1400×860 (escritorio) y 844×390 con pantalla táctil (móvil horizontal), en modo claro y oscuro, sin errores en la consola. Haz capturas de cada juego.
3. Comprueba con un script que todas las parejas de «Recorrido» tienen camino y que no salen empates en «¿Más o menos?».
4. Publica la nueva versión en el artifact de Claude, haz commit y push a `main` en GitHub y copia los archivos actualizados a mi carpeta `PROYECTOS CLAUDE/Atlas de Estudio` si mi ordenador está conectado.
5. Actualiza el README con la pestaña nueva y con los juegos que se dejan para más adelante.
