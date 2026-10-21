import re, base64, glob, os
t=open('meca3.tpl.html',encoding='utf-8').read()
js=open('meca3.js',encoding='utf-8').read()
assert '__CONTROL__' not in js
assert t.count('<script>\n__SCRIPT__\n</script>\n</head>')==1
t=t.replace('<script>\n__SCRIPT__\n</script>\n</head>','</head>').replace('</body>','<script>\n'+js+'</script>\n</body>')
def uri(path,mime): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(path,'rb').read()).decode())
for f in glob.glob('fotos/*.webp'):
    k=os.path.basename(f)[:-5]
    t=t.replace('{{F:%s}}'%k, uri(f,'image/webp'))
t=t.replace('{{LOGO512}}',uri('fotos/logo320.webp','image/webp')).replace('{{LOGO96}}',uri('fotos/logo96.png','image/png')).replace('{{LOGO180}}',uri('fotos/logo180.png','image/png'))
ico='<link rel="icon" type="image/png" sizes="64x64" href="%s">\n<link rel="apple-touch-icon" href="%s">'%(uri('fotos/logo64.png','image/png'),uri('fotos/logo180.png','image/png'))
t=t.replace('{{ICONOS}}',ico)
t=t.replace('{{LEGALES}}',open('meca3-legales.html',encoding='utf-8').read())
left=re.findall(r'\{\{F:[a-z0-9]+\}\}|\{\{LOGO\w+\}\}',t); assert not left,left
open('meca3.final.tpl.html','w',encoding='utf-8').write(t)
print('ok')
