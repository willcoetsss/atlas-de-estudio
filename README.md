<p align="center"><img src="icons/logo-512.png" alt="Atlas sosteniendo el mundo" height="220"></p>

# Atlas de Estudio

Aplicación web para aprender geografía: países, capitales, banderas, accidentes geográficos y cartografía, con exámenes que recuerdan lo que ya sabes y te preguntan más lo que fallas.

**Ver la aplicación:** https://willcoetsss.github.io/atlas-de-estudio/

## Qué incluye

- **Explorar**: ficha de 197 Estados y unos 50 territorios (capital, ciudades, idiomas oficiales y cooficiales, sistema político, conflictos, pasado colonial, religión, lo más famoso). Sobre el mapa: territorios lejanos, zonas en disputa, cambios de frontera desde 1990 y antiguas colonias.
- **Examen**: países (país → capital, capital → país, mapa → nombre, nombre → mapa, bandera → país, país → bandera y silueta → país, con la forma del país sola, sin el mapa alrededor), accidentes geográficos y cartografía. Tipo test o respuesta escrita, con repetición espaciada. Basta con tocar la respuesta: la app corrige y pasa sola a la siguiente.
- **Físico**: mapa con relieve sombreado, tintas hipsométricas y batimetría; mares, cordilleras, picos, ríos, lagos, penínsulas e islas.
- **Cartografía**: coordenadas, líneas notables, husos horarios reales, círculos máximos, tipos de proyección con indicatriz de Tissot y comparador de tamaño real.
- **Progreso**: mapa de lo que dominas, estadísticas, exportar e importar el progreso.

En el móvil está pensada para usarse en horizontal: las pestañas van en una columna a la izquierda, el mapa ocupa el centro y el panel de la derecha se puede plegar con el botón que hay junto al zoom. Se puede instalar como app desde el menú del navegador («Añadir a pantalla de inicio»), y entonces se abre directamente en horizontal en Android.

El progreso se guarda en el navegador de cada persona (localStorage). Para no perderlo, usa «Exportar progreso» en la pestaña Progreso.

## Abrirla en tu ordenador

No funciona haciendo doble clic en `index.html`, porque el navegador bloquea la carga de los datos desde `file://`. Sírvela con un servidor local, por ejemplo con Python:

```
python -m http.server 8000
```

y abre http://localhost:8000 en el navegador.

## Estructura

```
index.html        la aplicación (HTML, CSS y JavaScript en un solo archivo)
data/             datos: países, fichas, banderas, disputas, accidentes, husos
relief/           imagen del relieve en teselas
icons/            logo e iconos de la app
manifest.webmanifest  datos para instalarla como app en el móvil
fuente/           código fuente y scripts con los que se generaron los datos
.nojekyll         indica a GitHub Pages que sirva los archivos tal cual
```

## Fuentes de datos y licencias

- Geometrías, accidentes geográficos, ciudades, zonas en disputa y husos horarios: [Natural Earth](https://www.naturalearthdata.com/) (dominio público).
- Relieve sombreado: Natural Earth; batimetría: ETOPO1 de NOAA (dominio público), a través del paquete `basemap-data`.
- Datos básicos de países: [mledoze/countries](https://github.com/mledoze/countries), licencia ODbL 1.0.
- Banderas con su proporción oficial: [hjnilsson/country-flags](https://github.com/hjnilsson/country-flags) (dominio público, procedentes de Wikimedia Commons). Para calcular qué banderas se parecen se usa [flag-icons](https://github.com/lipis/flag-icons) (licencia MIT).
- Mapa mundial a 1:110m: [world-atlas](https://github.com/topojson/world-atlas), licencia ISC.
- Librerías: D3, topojson-client y d3-geo-projection (licencias ISC y BSD), cargadas desde jsDelivr.
- Tipografías: Alegreya, Alegreya Sans e IBM Plex Mono (Google Fonts, licencia OFL).
- Fichas de países, textos de disputas, cambios de frontera, colonias e idiomas: redactados para este proyecto. Los datos políticos tienen como referencia junio de 2026; lo marcado como «verificar» puede haber cambiado.

- Logo: grabado de Atlas sosteniendo el mundo aportado por el autor del proyecto.

El código de la aplicación se publica con licencia MIT (ver `LICENSE`).
