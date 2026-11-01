# Empaqueta la versión autónoma (GitHub Pages) en la carpeta indicada
import os, shutil, sys, json, glob
G = '/home/claude/geo/'
dst = sys.argv[1]
os.makedirs(dst, exist_ok=True)
for d in ('data', 'relief', 'icons'):
    if os.path.exists(os.path.join(dst, d)): shutil.rmtree(os.path.join(dst, d))
    shutil.copytree(G + 'out/' + d, os.path.join(dst, d))
body = open(G + 'out/index.html').read()
head = '''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Atlas interactivo para estudiar países, capitales, banderas, accidentes geográficos y cartografía.">
<meta name="theme-color" content="#fbfcfc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#141f28" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Atlas">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="64x64" href="icons/favicon-64.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<meta property="og:title" content="Atlas de Estudio">
<meta property="og:description" content="Aprende países, capitales, banderas, accidentes geográficos y cartografía.">
<meta property="og:image" content="icons/icon-512.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
'''
open(os.path.join(dst, 'index.html'), 'w').write(head + body + '\n</body>\n</html>\n')
json.dump({
    'name': 'Atlas de Estudio', 'short_name': 'Atlas', 'lang': 'es',
    'description': 'Atlas interactivo para estudiar geografía',
    'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'landscape',
    'background_color': '#e9eef0', 'theme_color': '#fbfcfc',
    'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
              {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]
}, open(os.path.join(dst, 'manifest.webmanifest'), 'w'), ensure_ascii=False, indent=2)
open(os.path.join(dst, '.nojekyll'), 'w').close()
# código fuente
f = os.path.join(dst, 'fuente')
if os.path.exists(f): shutil.rmtree(f)
os.makedirs(f + '/src/js'); os.makedirs(f + '/scripts'); os.makedirs(f + '/logo')
shutil.copy(G + 'src/index.html', f + '/src/')
for p in glob.glob(G + 'src/js/*.js'): shutil.copy(p, f + '/src/js/')
for p in glob.glob(G + 'scripts/*'):
    if p.endswith(('.py', '.mjs', '.sh')): shutil.copy(p, f + '/scripts/')
shutil.copy(G + 'package.json', f + '/')
shutil.copy(G + 'logo/atlas-logo.png', f + '/logo/')
for p in ('README.md', 'LICENSE', 'GUIA_PUBLICACION.md'):
    shutil.copy(G + 'dist/atlas-de-estudio/' + p, dst)
print('ok', sum(len(fs) for _, _, fs in os.walk(dst) if '.git' not in _))
