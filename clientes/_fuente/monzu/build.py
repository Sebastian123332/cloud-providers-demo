import re, base64, hashlib, io, os, sys, segno
D=os.path.dirname(os.path.abspath(__file__))+'/'
t=open(D+'monzu.tpl.html',encoding='utf-8').read().replace(' style-x=""','')
js=open(D+'monzu.js',encoding='utf-8').read()
t=t.replace('__JS__',js)
def uri(f,m): return 'data:%s;base64,%s'%(m,base64.b64encode(open(D+'img/'+f,'rb').read()).decode())
imgs={'logo':uri('logo.webp','image/webp'),'fav64':uri('fav64.png','image/png'),'fav180':uri('fav180.png','image/png')}
for k in ['deluxe','motor','tapiceria','scents1','scents2','scents3']: imgs[k]=uri(k+'.webp','image/webp')
t=re.sub(r'\{\{IMG:(\w+)\}\}',lambda m:imgs[m.group(1)],t)
def qr(u):
    b=io.BytesIO(); segno.make(u,error='m').save(b,kind='svg',scale=4,border=1,dark='#07090B',xmldecl=False,svgns=True,omitsize=True); return b.getvalue().decode()
t=t.replace('{{QR_RESENA}}',qr('https://www.google.com/maps/search/Monzu+Detallados+Cartago')).replace('{{QR_WEB}}',qr('https://ssolanotech.com'))
t=t.replace('{{WA}}','https://wa.me/50672686906?text=Hola%20Monz%C3%BA%20Detallados%2C%20quiero%20informaci%C3%B3n%20para%20un%20detallado')
t=t.replace('{{FECHA}}','3 de noviembre de 2026')
assert not re.search(r'\{\{|__JS__',t)
assert ' style="' not in t, 'estilos en línea'
h=lambda x:"'sha256-"+base64.b64encode(hashlib.sha256(x.encode()).digest()).decode()+"'"
est=re.findall(r'<style>(.*?)</style>',t,re.S); scr=re.findall(r'<script>(.*?)</script>',t,re.S)
assert len(scr)==1
csp="; ".join(["default-src 'none'","script-src "+h(scr[0]),"style-src "+" ".join(h(e) for e in est)+" https://fonts.googleapis.com","font-src https://fonts.gstatic.com","img-src 'self' data:","connect-src 'none'","form-action 'none'","base-uri 'none'","object-src 'none'","require-trusted-types-for 'script'","trusted-types 'none'","upgrade-insecure-requests"])
t=t.replace('<meta charset="utf-8">\n','<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">\n<meta name="referrer" content="strict-origin-when-cross-origin">\n',1)
out=sys.argv[1]; os.makedirs(os.path.dirname(out),exist_ok=True)
open(out,'w',encoding='utf-8').write(t)
open(os.path.join(os.path.dirname(out),'_headers'),'w').write("/*\n  Content-Security-Policy: "+csp+"; frame-ancestors 'none'\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n  Strict-Transport-Security: max-age=31536000; includeSubDomains\n")
print(out,len(t))
