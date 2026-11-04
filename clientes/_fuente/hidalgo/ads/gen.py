import base64,sys,os,json
H=os.path.dirname(os.path.abspath(__file__))+'/../'
sys.path.insert(0,H); from mapa_build import mapa
b64=lambda f:base64.b64encode(open(H+f,'rb').read()).decode()
img=lambda n:'data:image/webp;base64,'+b64('img/%s.webp'%n)
LOGO='data:image/svg+xml;base64,'+b64('img/logo-color.svg')
FONTS='''@font-face{font-family:BC;font-weight:900;font-style:italic;src:url(data:font/ttf;base64,%s)}
@font-face{font-family:BC;font-weight:800;font-style:italic;src:url(data:font/ttf;base64,%s)}
@font-face{font-family:B;font-weight:700;src:url(data:font/ttf;base64,%s)}'''%(b64('font/f2.ttf'),b64('font/f1.ttf'),b64('font/f0.ttf'))
WA='<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2c.2-.6.2-1 .1-1.2z"/></svg>'
CSS='''%s
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;overflow:hidden;position:relative;background:#0A0E1A;color:#fff;font-family:B,sans-serif}
.t{font-family:BC;font-weight:900;font-style:italic;text-transform:uppercase;line-height:.88}
.az{color:#8C9CFF}.am{color:#FFC21A}
.logo{position:absolute;top:44px;left:50px;width:230px;filter:drop-shadow(0 14px 30px rgba(0,0,0,.6))}
.pill{display:inline-flex;align-items:center;gap:14px;background:rgba(10,14,26,.7);border:2px solid rgba(255,255,255,.25);border-radius:999px;padding:12px 26px 12px 18px;font-family:BC;font-weight:800;font-style:italic;font-size:34px;letter-spacing:.06em;text-transform:uppercase}
.pill i{width:20px;height:20px;border-radius:50%%;background:#2EE07A;box-shadow:0 0 0 8px rgba(46,224,122,.25)}
.cta{position:absolute;left:0;right:0;bottom:0;height:150px;background:#2B3AA8;display:flex;align-items:center;justify-content:space-between;padding:0 50px;border-top:6px solid #FFC21A}
.cta .q{font-family:BC;font-weight:900;font-style:italic;font-size:50px;text-transform:uppercase;line-height:.95}
.cta .q small{display:block;font-family:B;font-style:normal;font-weight:700;font-size:24px;letter-spacing:.14em;color:#C9D2FF}
.wa{display:inline-flex;align-items:center;gap:16px;background:#25D366;color:#fff;border-radius:999px;padding:16px 34px;font-family:BC;font-weight:900;font-style:italic;font-size:62px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.wa svg{width:56px;height:56px}
'''%FONTS
def pag(cuerpo,cta=True):
    c='<div class="cta"><div class="q"><small>ESCRÍBANOS O LLAME YA</small>Respuesta rápida</div><span class="wa">%s8838-1397</span></div>'%WA if cta else ''
    return '<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body>%s%s</body></html>'%(CSS,cuerpo,c)
# 1 emergencia
a1='''<img src="%s" style="position:absolute;inset:0;width:100%%;height:1200px;object-fit:cover;object-position:50%% 60%%">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,14,26,.55) 0%%,rgba(10,14,26,0) 26%%,rgba(10,14,26,.1) 45%%,rgba(10,14,26,.92) 74%%,#0A0E1A 88%%)"></div>
<img class="logo" src="%s">
<div style="position:absolute;top:70px;right:50px"><span class="pill"><i></i>Disponibles 24/7</span></div>
<div style="position:absolute;left:50px;right:50px;bottom:190px">
<div class="t" style="font-size:96px">¿Se le quedó<br>el camión?</div>
<div class="t az" style="font-size:150px;margin-top:6px">Lo movemos<br>nosotros.</div>
<div style="font-size:34px;margin-top:22px;color:#E9ECF1">Underlift · Arrastre · Rescate · <span style="color:#FFC21A">Todo Costa Rica</span></div></div>'''%(img('atardecer'),LOGO)
# 2 servicios
def cel(n,t,pos='50% 50%'): return '<div style="position:relative;border-radius:22px;overflow:hidden;border:3px solid rgba(255,255,255,.12)"><img src="%s" style="width:100%%;height:100%%;object-fit:cover;object-position:%s;display:block"><div style="position:absolute;inset:auto 0 0 0;padding:60px 22px 18px;background:linear-gradient(transparent,rgba(10,14,26,.95))"><div class="t" style="font-size:52px">%s</div></div></div>'%(img(n),pos,t)
a2='''<div style="position:absolute;inset:0;background:radial-gradient(700px 500px at 90%% 0%%,rgba(61,80,214,.45),transparent 70%%)"></div>
<img class="logo" src="%s" style="width:200px;top:40px">
<div style="position:absolute;left:290px;top:62px;right:50px">
<div class="t" style="font-size:104px">Grúa para<br><span class="az">pesados</span></div>
<div style="font-size:30px;color:#C3C8D1;margin-top:12px">Cabezales · buses · vagonetas · cisternas · furgones</div></div>
<div style="position:absolute;left:50px;right:50px;top:330px;height:820px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:18px">%s%s%s%s</div>'''%(LOGO,cel('bus','Underlift'),cel('volvo','Arrastre<br>y rescate'),cel('mack','Grúa<br>telescópica'),cel('freight','Traslado<br>de pesados'))
# 3 cobertura
m=mapa(H)
WP=[(112,188),(245,152),(350,178),(330,292),(396,264),(468,250),(440,432)]
d='M%d %d'%WP[0]
for i in range(len(WP)-1):
    p0=WP[i-1] if i else WP[i]; p1=WP[i]; p2=WP[i+1]; p3=WP[i+2] if i+2<len(WP) else p2
    d+=' C%.1f %.1f %.1f %.1f %d %d'%(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1])
m=m.replace('id="rutaHecha" d=""','id="rutaHecha" d="%s"'%d).replace('id="rutaBase" d=""','id="rutaBase" d="%s"'%d)
m=m.replace('<g id="grua" transform="translate(112 188)">','<g id="grua" transform="translate(186 176)">').replace('transform="scale(1.25)"','transform="scale(1.6) rotate(-6)"')
m=m.replace('class="prov"','class="prov hecha"').replace('class="pin"','class="pin hecha"').replace('class="lbl','class="lbl hecha')
mcss='''.mapa .prov{fill:#1E2A7A;stroke:#5B6CE8;stroke-width:1.6}
.mapa .ruta-base{display:none}.mapa .ruta-hecha{fill:none;stroke:#FFC21A;stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 8px rgba(255,194,26,.7))}
.mapa .pin{fill:#FFC21A;stroke:#fff;stroke-width:3}
.mapa .lbl{font-family:BC;font-weight:800;font-style:italic;font-size:22px;letter-spacing:.04em;text-transform:uppercase;fill:#fff;stroke:#0A0E1A;stroke-width:5px;paint-order:stroke;text-anchor:middle}
.mapa .lbl.chica{font-size:17px}.mapa .mar{font-family:BC;font-style:italic;font-weight:800;font-size:15px;letter-spacing:.3em;text-transform:uppercase;fill:rgba(160,170,190,.55);text-anchor:middle}
.mapa .faro{fill:#FFC21A}'''
a3='''<style>%s</style><div style="position:absolute;inset:0;background:radial-gradient(800px 700px at 60%% 55%%,rgba(61,80,214,.35),transparent 70%%),linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px) 0 0/60px 60px,linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px) 0 0/60px 60px"></div>
<img class="logo" src="%s" style="width:200px;top:40px">
<div style="position:absolute;left:290px;top:58px;right:40px">
<div class="t" style="font-size:112px">Vamos a<br><span class="am">todo el país</span></div></div>
<div class="mapa" style="position:absolute;left:30px;right:30px;top:300px;height:780px;display:grid;place-items:center"><div style="width:860px">%s</div></div>
<div style="position:absolute;left:50px;right:50px;bottom:180px;display:flex;justify-content:center;gap:14px"><span class="pill"><i></i>Las 7 provincias</span><span class="pill" style="border-color:#FFC21A">Carretera y montaña</span></div>'''%(mcss,LOGO,m)
if __name__=='__main__':
  for n,c in [('1-emergencia',a1),('2-servicios',a2),('3-cobertura',a3)]:
    open(H+'ads/%s.html'%n,'w').write(pag(c))
print('ok')
