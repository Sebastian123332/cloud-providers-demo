"""Descarga las fuentes de Google (solo latin y latin-ext) a app/fonts y genera fuentes.css con @font-face locales.
Así la página no le manda la IP de los visitantes a Google (privacidad, Ley 8968)."""
import os, re, urllib.request
D = os.path.dirname(os.path.abspath(__file__)) + '/fonts/'
css = open(D + 'g.css', encoding='utf-8').read()
out = []
for sub, b in re.findall(r'/\* ([a-z-]+) \*/\s*(@font-face\s*\{.*?\})', css, re.S):
    if sub not in ('latin', 'latin-ext'):
        continue
    fam = re.search(r"font-family: '([^']+)'", b).group(1)
    sty = re.search(r'font-style: (\w+)', b).group(1)
    wt = re.search(r'font-weight: (\d+)', b).group(1)
    url = re.search(r'url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)', b).group(1)
    rng = re.search(r'unicode-range: ([^;]+);', b).group(1)
    nom = '%s-%s-%s-%s.woff2' % (fam.lower().replace(' ', '-'), wt, sty, sub)
    if not os.path.exists(D + nom):
        datos = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})).read()
        assert datos[:4] == b'wOF2', nom
        open(D + nom, 'wb').write(datos)
    out.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;src:url(/fonts/%s) format('woff2');unicode-range:%s}" % (fam, sty, wt, nom, rng))
open(D + 'fuentes.css', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(out), 'caras ·', sum(os.path.getsize(D + f) for f in os.listdir(D) if f.endswith('.woff2')) // 1024, 'KB')
