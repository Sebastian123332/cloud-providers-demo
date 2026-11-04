"""Descarga las fuentes (latin + latin-ext) de Google Fonts y genera @font-face locales."""
import re, os, sys, urllib.request
D = os.path.dirname(os.path.abspath(__file__)) + '/fonts-loc/'
css = open(D + 'g.css', encoding='utf-8').read()
bloques = re.findall(r'/\* ([a-z-]+) \*/\s*(@font-face\s*\{.*?\})', css, re.S)
out = []
for sub, b in bloques:
    if sub not in ('latin', 'latin-ext'):
        continue
    fam = re.search(r"font-family: '([^']+)'", b).group(1)
    sty = re.search(r'font-style: (\w+)', b).group(1)
    wt = re.search(r'font-weight: (\d+)', b).group(1)
    url = re.search(r'url\((https://[^)]+\.woff2)\)', b).group(1)
    rng = re.search(r'unicode-range: ([^;]+);', b).group(1)
    nom = '%s-%s-%s-%s.woff2' % (fam.lower().replace(' ', '-'), wt, sty, sub)
    if not os.path.exists(D + nom):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        open(D + nom, 'wb').write(urllib.request.urlopen(req).read())
    out.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;src:url(/fonts/%s) format('woff2');unicode-range:%s}" % (fam, sty, wt, nom, rng))
open(D + 'fuentes.css', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(out), 'caras;', sum(os.path.getsize(D + f) for f in os.listdir(D) if f.endswith('.woff2')) // 1024, 'KB')
