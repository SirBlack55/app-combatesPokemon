#!/usr/bin/env python3
"""Junta todo el proyecto en UN solo archivo HTML con CSS, JS e imágenes incrustados.

Uso:   python3 construir.py              ->  crea equipos-api.html junto a este archivo
       python3 construir.py salida.html  ->  crea el archivo con otro nombre

El archivo resultante funciona con doble clic y se puede compartir o subir tal cual.
(Los .js se incrustan en el mismo orden en que aparecen en index.html.)
"""
import base64, json, mimetypes, os, re, sys

raiz = os.path.dirname(os.path.abspath(__file__))
salida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(raiz, 'equipos-api.html')
leer = lambda ruta: open(os.path.join(raiz, ruta), encoding='utf-8').read()

html = leer('index.html')

# 1) Imágenes: todo lo que haya en img/ -> window.ASSETS['img/...']
assets = {}
for carpeta, _, archivos in os.walk(os.path.join(raiz, 'img')):
    for a in sorted(archivos):
        ruta = os.path.join(carpeta, a)
        rel = os.path.relpath(ruta, raiz).replace(os.sep, '/')
        mime = mimetypes.guess_type(a)[0] or 'application/octet-stream'
        assets[rel] = 'data:%s;base64,%s' % (mime, base64.b64encode(open(ruta, 'rb').read()).decode())
prologo = '<script>window.ASSETS=%s;</script>\n' % json.dumps(assets)

# 2) CSS
def css(m):
    return '<style>\n%s\n</style>' % leer(m.group(1))
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)

# 3) Scripts (en orden). El primero lleva delante el bloque de imágenes.
primero = [True]
def js(m):
    codigo = leer(m.group(1))
    assert '</script>' not in codigo, 'No puede haber </script> dentro de %s' % m.group(1)
    pre = prologo if primero[0] else ''
    primero[0] = False
    return '%s<script>\n%s\n</script>' % (pre, codigo)
html = re.sub(r'<script src="([^"]+)"></script>', js, html)

open(salida, 'w', encoding='utf-8').write(html)
print('Creado %s (%d KB, %d imágenes incrustadas)' % (salida, len(html) // 1024, len(assets)))
