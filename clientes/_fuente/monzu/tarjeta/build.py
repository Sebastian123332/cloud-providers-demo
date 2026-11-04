"""Arma la demostración de Monzú Club (tarjeta de cliente frecuente + panel del dueño) en un solo HTML."""
import base64, io, json, os, sys
import segno
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)) + '/'
IMG = D + '../img/'

def webp(f, w):
    im = Image.open(IMG + f).convert('RGBA'); im.thumbnail((w, w * 4))
    b = io.BytesIO(); im.save(b, 'WEBP', quality=88); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()

def png(f):
    return 'data:image/png;base64,' + base64.b64encode(open(IMG + f, 'rb').read()).decode()

def qr(txt):
    b = io.BytesIO()
    segno.make(txt, error='m').save(b, kind='svg', scale=4, border=1, dark='#07141A', xmldecl=False, svgns=True, omitsize=True)
    return b.getvalue().decode()

ids = ['MZ-7K4Q', 'MZ-2P9X', 'MZ-5T1C']
qrs = {i: qr('https://monzu.example/tarjeta/' + i) for i in ids}
t = open(D + 'tarjeta.tpl.html', encoding='utf-8').read()
js = open(D + 'tarjeta.js', encoding='utf-8').read().replace('__QRS__', json.dumps(qrs))
t = t.replace(' style-x=""', '').replace('__JS__', js).replace('{{LOGO}}', webp('logo_t.png', 480)).replace('{{FAV}}', png('fav180.png'))
assert '{{' not in t and '__JS__' not in t
out = sys.argv[1]; os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(t)
print(out, len(t))
