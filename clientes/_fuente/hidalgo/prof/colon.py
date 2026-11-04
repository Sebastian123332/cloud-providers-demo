"""Copia el glifo ₡ (U+20A1) de Archivo a las fuentes Barlow del PDF."""
import sys, copy
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

def copia(src, dst, out):
    s = TTFont(src); d = TTFont(dst)
    gn = s.getBestCmap()[0x20A1]
    k = d['head'].unitsPerEm / s['head'].unitsPerEm
    # ancho: igual al de un dígito de Barlow, para que las cifras alineen bien
    dig = d.getBestCmap()[ord('0')]
    adv = d['hmtx'][dig][0]
    sadv = s['hmtx'][gn][0] * k
    dx = (adv - sadv) / 2
    pen = TTGlyphPen(d.getGlyphSet())
    s.getGlyphSet()[gn].draw(TransformPen(pen, (k, 0, 0, k, dx, 0)))
    g = pen.glyph()
    name = 'colonmonetary'
    d['glyf'][name] = g
    order = d.getGlyphOrder()
    if name not in order:
        order.append(name); d.setGlyphOrder(order)
    g.recalcBounds(d['glyf'])
    d['hmtx'][name] = (adv, g.xMin if hasattr(g, 'xMin') else 0)
    for t in d['cmap'].tables:
        if t.isUnicode():
            t.cmap[0x20A1] = name
    if 'maxp' in d: d['maxp'].numGlyphs = len(order)
    if 'post' in d and d['post'].formatType == 2.0:
        d['post'].extraNames = []; d['post'].mapping = {}
    d.save(out)

if __name__ == '__main__':
    copia(sys.argv[1], sys.argv[2], sys.argv[3])
    print('ok', sys.argv[3])
