# Cómo publicar el Atlas de Estudio en GitHub

Al terminar tendrás la app en una dirección web propia, gratis, que funciona en cualquier ordenador o móvil:

**https://willcoetsss.github.io/atlas-de-estudio/**

Se usa **GitHub Pages**, el servicio de GitHub para alojar páginas web estáticas. No necesitas instalar nada: todo se hace desde el navegador (Chrome o Edge funcionan mejor para arrastrar carpetas).

> Ten en cuenta que GitHub Pages gratuito exige que el repositorio sea **público**: cualquiera con el enlace podrá ver la app y su código. Tu progreso de estudio no se publica, porque se guarda solo en tu navegador.

---

## Paso 1 · Entra en GitHub

1. Abre https://github.com e inicia sesión con tu cuenta (**willcoetsss**).

## Paso 2 · Crea el repositorio

1. Arriba a la derecha pulsa **+** → **New repository**.
2. **Repository name**: `atlas-de-estudio` (con este nombre la dirección será la de arriba).
3. **Description** (opcional): `Atlas interactivo para estudiar geografía`.
4. Marca **Public**.
5. **No** marques «Add a README file», ni .gitignore, ni licencia: ya vienen en la carpeta.
6. Pulsa **Create repository**.

## Paso 3 · Sube los archivos

1. En la página del repositorio recién creado, pulsa el enlace **uploading an existing file** (aparece en el recuadro «Quick setup»).
2. Abre en el Explorador de Windows la carpeta:
   `C:\MIS ARCHIVOS\PROYECTOS CLAUDE\Atlas de Estudio\atlas-de-estudio`
3. Entra **dentro** de esa carpeta, selecciona **todo su contenido** (Ctrl + E) y arrástralo a la zona de subida del navegador. Tiene que verse así, con las carpetas dentro:
   - `index.html`
   - `README.md`, `LICENSE`, `GUIA_PUBLICACION.md`, `.nojekyll`
   - carpeta `data`
   - carpeta `relief`
   - carpeta `fuente`

   No arrastres la carpeta `atlas-de-estudio` entera, sino lo que hay dentro. Si arrastras la carpeta, todo quedaría un nivel más abajo y la página no se encontraría.
4. Espera a que terminen de cargar los 71 archivos (unos 7 MB).
5. Abajo, en **Commit changes**, escribe por ejemplo `Primera versión` y pulsa **Commit changes**.

## Paso 4 · Activa GitHub Pages

1. En el repositorio, pulsa **Settings** (pestaña de arriba, con un engranaje).
2. En el menú de la izquierda, pulsa **Pages**.
3. En **Build and deployment** → **Source**, elige **Deploy from a branch**.
4. En **Branch**, elige **main** y la carpeta **/ (root)**. Pulsa **Save**.
5. Espera 1 o 2 minutos y recarga esa página de Settings → Pages. Aparecerá arriba: «Your site is live at https://willcoetsss.github.io/atlas-de-estudio/».

## Paso 5 · Compruébalo

Abre https://willcoetsss.github.io/atlas-de-estudio/ y revisa que:

- el mapa político carga y puedes pulsar un país;
- la pestaña **Físico** muestra el relieve;
- la pestaña **Examen** hace preguntas.

Desde el móvil también funciona; puedes añadirla a la pantalla de inicio desde el menú del navegador.

---

## Actualizar la app más adelante

Cuando te dé una versión nueva:

1. Entra en el repositorio → **Add file** → **Upload files**.
2. Arrastra los archivos nuevos (normalmente `index.html` y lo que haya cambiado en `data`). Los que tengan el mismo nombre se sustituyen.
3. **Commit changes**. En uno o dos minutos la web se actualiza (si no ves el cambio, recarga con Ctrl + F5).

## Instalarla en el móvil como una app

1. Abre la dirección en el navegador del móvil.
2. Android (Chrome): menú ⋮ → **Añadir a pantalla de inicio** o **Instalar aplicación**. Se abrirá a pantalla completa y en horizontal.
3. iPhone (Safari): botón **Compartir** → **Añadir a pantalla de inicio**. Gira el móvil para usarla en horizontal (desactiva el bloqueo de rotación si lo tienes).

El icono será el grabado de Atlas.

## Si algo falla

- **Sale un error 404**: espera un par de minutos más tras activar Pages. Comprueba que `index.html` está en la raíz del repositorio y no dentro de otra carpeta.
- **La página sale en blanco o sin mapa**: abre el repositorio y comprueba que existen las carpetas `data` y `relief` con sus archivos. Si falta alguna, súbela otra vez.
- **Doble clic en `index.html` en tu ordenador no muestra el mapa**: es normal. El navegador no deja cargar los datos desde un archivo local. Usa la dirección web de GitHub, o sigue las instrucciones de «Abrirla en tu ordenador» del `README.md`.
- **El progreso no aparece en otro dispositivo**: el progreso vive en cada navegador. Pásalo con **Progreso → Exportar progreso** en uno e **Importar archivo** en el otro.

## Alternativa: que lo publique Claude

Desde la sesión de Claude no se pueden crear repositorios nuevos en tu cuenta, pero sí subir archivos a uno que ya exista. Si prefieres no subir nada a mano:

1. Haz solo el **Paso 2** (crear el repositorio vacío `atlas-de-estudio`).
2. Dile a Claude: «ya he creado el repositorio willcoetsss/atlas-de-estudio».
3. Claude lo conecta (te pedirá permiso; si la app de GitHub de Claude no está conectada, tendrás que conectarla en claude.ai → Ajustes → Conectores), sube los archivos y activa Pages.
