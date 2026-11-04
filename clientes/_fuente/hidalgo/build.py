import re, base64, hashlib, io, os, sys, segno
D=os.path.dirname(os.path.abspath(__file__))+'/'
t=open(D+'hidalgo.tpl.html',encoding='utf-8').read().replace(' style-x=""','')
js=open(D+'hidalgo.js',encoding='utf-8').read()
t=t.replace('__JS__',js)
def uri(f,m): return 'data:%s;base64,%s'%(m,base64.b64encode(open(D+'img/'+f,'rb').read()).decode())
imgs={}
import glob
for f in glob.glob(D+'img/*.webp'):
    k=os.path.basename(f)[:-5]; imgs[k]=uri(k+'.webp','image/webp')
def svguri(f): return 'data:image/svg+xml;base64,'+base64.b64encode(open(D+'img/'+f,'rb').read()).decode()
t=t.replace('{{LOGO_COLOR}}',svguri('logo-color.svg')).replace('{{LOGO_BLANCO}}',svguri('logo-blanco.svg')).replace('{{LOGO_NEGRO}}',svguri('logo-negro.svg')).replace('{{ICONO}}',svguri('logo-color.svg'))
sys.path.insert(0,D); from mapa_build import mapa
t=t.replace('{{MAPA}}',mapa(D))
t=re.sub(r'\{\{IMG:(\w+)\}\}',lambda m:imgs[m.group(1)],t)
def qr(u):
    b=io.BytesIO(); segno.make(u,error='m').save(b,kind='svg',scale=4,border=1,dark='#0A0E1A',xmldecl=False,svgns=True,omitsize=True); return b.getvalue().decode()
t=t.replace('{{QR_RESENA}}',qr('https://www.google.com/maps/search/Gruas+Hidalgo+Costa+Rica')).replace('{{QR_WEB}}',qr('https://ssolanotech.com'))
t=t.replace('{{WA}}','https://wa.me/50688381397?text=Hola%20Gr%C3%BAas%20Hidalgo%2C%20necesito%20una%20gr%C3%BAa')
DOM='https://bright-cassata-df850f.netlify.app'
SEO='\n'.join(['<link rel="canonical" href="%s/">'%DOM,'<meta property="og:url" content="%s/">'%DOM,'<meta property="og:site_name" content="Grúas Hidalgo">','<meta property="og:image" content="%s/og.jpg">'%DOM,'<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">','<meta property="og:image:alt" content="Grúas Hidalgo, grúa para camiones pesados 24 horas en todo Costa Rica">','<meta name="twitter:card" content="summary_large_image">','<meta name="robots" content="index,follow">'])
t=t.replace('{{SEO}}',SEO).replace('{{DOM}}',DOM)
t=t.replace('{{FECHA}}','4 de noviembre de 2026')
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
od=os.path.dirname(out)
open(os.path.join(od,'robots.txt'),'w').write('User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n'%DOM)
open(os.path.join(od,'sitemap.xml'),'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>%s/</loc><lastmod>2026-11-04</lastmod></url></urlset>\n'%DOM)
import shutil
for f in ['og.jpg','apple-touch-icon.png','logo.png']:
    if os.path.exists(D+'img/'+f): shutil.copy(D+'img/'+f,os.path.join(od,f))
print(out,len(t))
