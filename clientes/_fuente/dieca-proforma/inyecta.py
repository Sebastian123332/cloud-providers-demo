import base64, sys
P='/tmp/claude-0/-home-user-cloud-providers-demo/85d304cc-16a2-5927-a034-75b90352da3b/scratchpad/prof/'
src, out = sys.argv[1], sys.argv[2]
t=open(src,encoding='utf-8').read()
def rep(a,b,n=1):
    global t
    c=t.count(a); assert c==n,(c,a[:90]); t=t.replace(a,b)
b64=lambda f: base64.b64encode(open(P+f,'rb').read()).decode()
fondo='data:image/jpeg;base64,'+b64('fondo.jpg')
# 1) jsPDF desde cdnjs, solo para descargar la proforma
rep('<style>\n/* Layout: obra pesada','<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer></script>\n<style>\n/* Layout: obra pesada')
# 2) estilos
rep('\n/* Aparición al bajar */', open(P+'proforma.css',encoding='utf-8').read()+'\n/* Aparición al bajar */')
# 3) botón en el pie
rep('<button type="button" data-legal="cookies">Política de cookies</button><span>Sitio web por','<button type="button" data-legal="cookies">Política de cookies</button><button type="button" data-legal="proformas">Proformas</button><span>Sitio web por')
# 4) el diálogo, después del de cookies
i=t.index('id="dlg-cookies"'); j=t.index('</dialog>',i)+len('</dialog>')
t=t[:j]+'\n\n'+open(P+'proforma.html',encoding='utf-8').read().replace('{{PRO_FONDO}}',fondo).rstrip('\n')+t[j:]
# 5) el código
js=open(P+'proforma.js',encoding='utf-8').read().replace('__F_REG__',b64('sub0.ttf')).replace('__F_BOLD__',b64('sub1.ttf')).replace('__F_TIT__',b64('sub2.ttf'))
rep("  var h=location.hash.replace('#','');\n  if(['terminos','privacidad','cookies'].indexOf(h)>-1) abrir(h);",
    js+"  var h=location.hash.replace('#','');\n  if(['terminos','privacidad','cookies','proformas'].indexOf(h)>-1) abrir(h);")
open(out,'w',encoding='utf-8').write(t)
print('ok',len(t))
