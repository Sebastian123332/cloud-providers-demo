import re, base64, io, urllib.parse
from PIL import Image, ImageDraw
t=open('meca2.tpl.html',encoding='utf-8').read()
good=[l for l in open('/home/user/cloud-providers-demo/clientes/gruas-mario/index.html',encoding='utf-8') if 'var CONTROL=' in l][0]
rx=good.split('var CONTROL=',1)[1].rstrip().rstrip(';')
js=open('meca2.js',encoding='utf-8').read().replace('__CONTROL__',rx)
assert t.count('<script>\n__SCRIPT__\n</script>\n</head>')==1
t=t.replace('<script>\n__SCRIPT__\n</script>\n</head>','</head>').replace('</body>','<script>\n'+js+'</script>\n</body>')
# 2. iconos
gear=re.search(r'<path d="(M43\.3 5\.4[^"]+)"',t).group(1)
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#08080c"/><g transform="translate(14 14) scale(.72)"><path fill="#9f5fff" d="%s"/></g></svg>'%gear
uri='data:image/svg+xml,'+urllib.parse.quote(svg,safe='/:= ')
uri=uri.replace(' ','%20')
# PNG apple icon: render via cairosvg if present, else PIL approximation
try:
    import cairosvg
    png=cairosvg.svg2png(bytestring=svg.encode(),output_width=180,output_height=180)
except Exception:
    im=Image.new('RGB',(180,180),'#08080c');d=ImageDraw.Draw(im)
    import math
    cx=cy=90
    pts=[]
    for k in range(48):
        a=k/48*2*math.pi; r=62 if (k//3)%2==0 else 50
        pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    d.polygon(pts,fill='#9f5fff'); d.ellipse((62,62,118,118),fill='#08080c')
    b=io.BytesIO();im.save(b,'PNG');png=b.getvalue()
b64=base64.b64encode(png).decode()
ico='<link rel="icon" type="image/svg+xml" href="%s">\n<link rel="icon" type="image/png" sizes="180x180" href="data:image/png;base64,%s">\n<link rel="apple-touch-icon" href="data:image/png;base64,%s">'%(uri,b64,b64)
t=t.replace('{{ICONOS}}',ico)
t=t.replace('{{LEGALES}}',open('meca-legales.html',encoding='utf-8').read())
open('meca2.final.tpl.html','w',encoding='utf-8').write(t)
open('meca-icon.png','wb').write(png)
print('ok', 'style="' in t)
