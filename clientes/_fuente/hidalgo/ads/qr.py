import sys,os,io,segno
H=os.path.dirname(os.path.abspath(__file__))+'/../'
sys.path.insert(0,H+'ads'); import gen
b=io.BytesIO(); segno.make('https://gruashidalgoo.com/',error='h').save(b,kind='svg',scale=10,border=0,dark='#0A0E1A',xmldecl=False,svgns=True,omitsize=True)
QR=b.getvalue().decode()
cuerpo='''<div style="position:absolute;inset:0;background:radial-gradient(700px 600px at 50%% 38%%,rgba(61,80,214,.55),transparent 70%%),linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px) 0 0/60px 60px,linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px) 0 0/60px 60px"></div>
<div style="position:absolute;left:0;right:0;top:46px;display:flex;justify-content:center;align-items:center;gap:26px">
 <img src="%s" style="width:190px;filter:drop-shadow(0 14px 30px rgba(0,0,0,.6))">
 <div><div class="t" style="font-size:84px">Grúas <span class="az">Hidalgo</span></div><div style="font-size:28px;color:#C3C8D1;margin-top:8px;letter-spacing:.06em">GRÚA PARA PESADOS · 24/7 · TODO COSTA RICA</div></div></div>
<div class="t" style="position:absolute;left:0;right:0;top:268px;text-align:center;font-size:96px">Escanee <span class="am">y conozca</span><br>nuestros servicios</div>
<div style="position:absolute;left:50%%;top:470px;transform:translateX(-50%%);background:#fff;border-radius:34px;padding:38px;box-shadow:0 30px 70px rgba(0,0,0,.55),0 0 0 10px rgba(255,255,255,.12)">
 <div style="width:500px;height:500px">%s</div></div>
<div style="position:absolute;left:0;right:0;top:1080px;text-align:center">
 <span style="display:inline-block;background:#FFC21A;color:#0A0E1A;border-radius:999px;padding:10px 34px;font-family:BC;font-weight:900;font-style:italic;font-size:58px;letter-spacing:.02em">gruashidalgoo.com</span></div>'''%(gen.LOGO,QR.replace('<svg ','<svg width="500" height="500" ',1))
open(H+'ads/4-qr.html','w').write(gen.pag(cuerpo))
print('ok')
