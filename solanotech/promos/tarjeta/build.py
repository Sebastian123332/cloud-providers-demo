# Genera la tarjeta lista para imprimir: mete los QR como vectores dentro del HTML.
import re, segno, pathlib
D = pathlib.Path(__file__).parent

def qr_svg(url):
    q = segno.make(url, error='q')
    n = q.symbol_size(border=0)[0]
    s = q.svg_inline(scale=1, border=0, dark='#000', light=None)
    d = re.search(r' d="([^"]+)"', s).group(1)
    return ('<svg viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg"><path d="%s" stroke="#000" stroke-width="1.02" fill="none"/></svg>' % (n, n, d))

t = (D / 'tarjeta.html').read_text()
t = t.replace('QR_WEB', qr_svg('https://ssolanotech.com')).replace('QR_WA', qr_svg('https://wa.me/50689330326'))
(D / 'tarjeta-final.html').write_text(t)
print('ok')
