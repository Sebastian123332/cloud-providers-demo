from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
F={'black':TTFont('font/f2.ttf'),'xb':TTFont('font/f1.ttf')}
def txt(f,s,x,y,size,ls=0,anchor='middle'):
    font=F[f]; gs=font.getGlyphSet(); cmap=font.getBestCmap(); k=size/font['head'].unitsPerEm; hm=font['hmtx']
    names=[cmap[ord(c)] for c in s]; w=sum(hm[n][0] for n in names)*k+ls*(len(s)-1)
    x0=x-w/2 if anchor=='middle' else x
    pen=SVGPathPen(gs); cx=x0
    for n in names: gs[n].draw(TransformPen(pen,(k,0,0,-k,cx,y))); cx+=hm[n][0]*k+ls
    return pen.getCommands(),w
def logo(tema):
    C=tema=='color'; B=tema=='blanco'
    nav='#1B2470' if C else ('#FFFFFF' if B else '#111111')
    azul='url(#gAzul)' if C else ('rgba(255,255,255,.07)' if B else nav)
    cromo='url(#gCromo)' if C else ('#C3C8D1' if B else '#B5B5B5')
    plata='url(#gPlata)' if C else ('#9EA4AE' if B else '#BBBBBB')
    vidrio='url(#gVidrio)' if C else ('rgba(255,255,255,.08)' if B else '#FFFFFF')
    llanta='#0B1020' if not B else '#2A3150'
    luz='url(#gLuz)' if C else ('#FFFFFF' if B else '#DDDDDD')
    txtb='url(#gAzul)' if C else ('#0B1020' if B else '#111111')
    d24,_=txt('black','24 HRS',0,200,28,ls=2)
    dH,wH=txt('black','H',0,0,104); dI,wI=txt('black','IDALGO',0,0,76,ls=1)
    tot=wH-24+wI; xH=300-tot/2; xI=xH+wH-24
    dH,_=txt('black','H',xH,466,104); dI,_=txt('black','IDALGO',xI,452,76,ls=1,anchor='start')
    dG,_=txt('black','GRÚAS',300,392,40,ls=4)
    dCR,_=txt('xb','GRÚAS · TODO COSTA RICA',300,523,22,ls=2)
    est='M0 -12 L3.5 -3.8 L12.4 -3.8 L5.2 1.6 L7.8 10.2 L0 5 L-7.8 10.2 L-5.2 1.6 L-12.4 -3.8 L-3.5 -3.8 Z'
    estrellas=''.join('<path d="%s" transform="translate(%d %d) scale(%s)" fill="%s" stroke="%s" stroke-width="1.5"/>'%(est,x,y,sc,cromo,nav) for x,y,sc in [(318,56,.9),(354,46,1.15),(390,56,.9)])
    defs='''<defs>
 <linearGradient id="gAzul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3446C4"/><stop offset=".55" stop-color="#26339A"/><stop offset="1" stop-color="#18216A"/></linearGradient>
 <linearGradient id="gPlata" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E7EC"/><stop offset=".45" stop-color="#AEB4BD"/><stop offset=".55" stop-color="#9AA1AB"/><stop offset="1" stop-color="#C6CAD1"/></linearGradient>
 <linearGradient id="gCromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".22" stop-color="#C9CED6"/><stop offset=".42" stop-color="#7E8693"/><stop offset=".58" stop-color="#F4F6F9"/><stop offset=".8" stop-color="#9AA1AB"/><stop offset="1" stop-color="#E9ECF1"/></linearGradient>
 <linearGradient id="gVidrio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8EEFF"/><stop offset=".45" stop-color="#9FB0E8"/><stop offset=".5" stop-color="#7F92D6"/><stop offset="1" stop-color="#C9D4FF"/></linearGradient>
 <radialGradient id="gLuz"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E6ECFF"/><stop offset="1" stop-color="#A9B6E6"/></radialGradient>
 <linearGradient id="gCinta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26339A"/><stop offset="1" stop-color="#121A55"/></linearGradient>
 <linearGradient id="gBrillo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <clipPath id="cPlaca"><path d="M40 372 Q300 404 560 372 L560 460 Q300 432 40 460 Z"/></clipPath>
 <filter id="sombra" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0B1030" flood-opacity=".28"/></filter>
</defs>'''
    E='M300 52 L520 96 Q548 102 548 132 V320 Q548 520 300 640 Q52 520 52 320 V132 Q52 102 80 96 Z'
    Ei='M300 76 L508 116 Q526 120 526 140 V320 Q526 504 300 612 Q74 504 74 320 V140 Q74 120 92 116 Z'
    fondo='url(#gFondo)' if C else ('#141B33' if B else '#F4F4F4')
    gris='#9EA4AE' if C else ('#C3C8D1' if B else '#666')
    txtc='url(#gAzul)' if C else ('#FFFFFF' if B else '#111')
    d24,_=txt('black','24 HRS',300,266,58,ls=2)
    dG,_=txt('black','GRÚAS',300,546,74,ls=3)
    def pluma(esp=False):
        tr=' transform="translate(600 0) scale(-1 1)"' if esp else ''
        return '''<g%s><g transform="translate(-58 36)">
  <path d="M328 368 L112 88" stroke="%s" stroke-width="40"/>
  <path d="M312 364 L104 92" stroke="#FFFFFF" stroke-width="5" stroke-opacity=".35"/>
  <rect x="66" y="52" width="62" height="40" rx="12" fill="%s" stroke="%s" stroke-width="6" transform="rotate(-8 97 72)"/>
  <circle cx="92" cy="72" r="8" fill="%s" stroke="%s" stroke-width="4"/>
  <path d="M82 92 L80 132" stroke="%s" stroke-width="5"/>
  <rect x="70" y="128" width="20" height="24" rx="5" fill="%s"/>
  <path d="M80 152 v12 a13 13 0 1 1 -13 13" fill="none" stroke="%s" stroke-width="7" stroke-linecap="round"/>
</g></g>'''%(tr,nav,cromo,nav,'#FFFFFF' if not B else '#0B1020',nav,nav,nav,nav)
    h=[]
    h.append('<path d="%s" fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round"/>'%(E,cromo,nav))
    h.append('<path d="%s" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>'%(Ei,fondo,nav))
    h.append('<path d="M74 140 Q74 120 92 116 L300 76 L508 116 Q526 120 526 140 V170 Q300 150 74 170 Z" fill="%s"/>'%(azul if not B else 'rgba(255,255,255,.1)'))
    h.append('<path d="M74 170 Q300 150 526 170" fill="none" stroke="%s" stroke-width="4"/>'%nav)
    h.append(''.join('<path d="%s" transform="translate(%d %d) scale(%s)" fill="%s" stroke="%s" stroke-width="1.5"/>'%(est,x,y,sc,cromo,nav) for x,y,sc in [(240,138,.9),(300,128,1.25),(360,138,.9)]))
    if C: h.append('<g clip-path="url(#cEsc)"><path d="M74 170 L300 170 L170 470 L74 470 Z" fill="#FFFFFF" opacity=".35"/></g>')
    h.append('<path d="%s" fill="none" stroke="%s" stroke-width="3" transform="translate(300 345) scale(.92) translate(-300 -345)" opacity=".6"/>'%(Ei,gris))
    h.append(pluma()+pluma(True))
    h.append('<path d="%s" fill="%s"/>'%(d24,txtc))
    h.append('<g transform="translate(0 130)">')
    h.append('<path d="M20 196 Q300 248 580 196 L580 320 Q300 284 20 320 Z" fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round"/>'%(plata,nav))
    h.append('<path d="M40 213 Q300 262 560 213 L560 304 Q300 271 40 304 Z" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".9"/>')
    if C: h.append('<g clip-path="url(#cPlaca)"><rect x="-80" y="180" width="90" height="160" fill="url(#gBrillo)" transform="skewX(-25)"><animate attributeName="x" values="-120;700;700" dur="4s" repeatCount="indefinite"/></rect></g>')
    h.append('<g fill="%s"><circle cx="60" cy="226" r="6"/><circle cx="540" cy="226" r="6"/><circle cx="60" cy="292" r="6"/><circle cx="540" cy="292" r="6"/></g>'%nav)
    dH,wH=txt('black','H',0,0,118); dI,wI=txt('black','IDALGO',0,0,86,ls=1)
    tot=wH-26+wI; xH=300-tot/2; xI=xH+wH-26
    dH,_=txt('black','H',xH,312,118); dI,_=txt('black','IDALGO',xI,298,86,anchor='start',ls=1)
    h.append('<path d="%s" fill="%s" stroke="%s" stroke-width="5" paint-order="stroke"/>'%(dH,txtb,'#FFFFFF' if not B else '#9EA4AE'))
    h.append('<path d="%s" fill="%s"/></g>'%(dI,txtb))
    h.append('<path d="%s" fill="%s"/>'%(dG,txtc))
    cinta='url(#gCinta)' if C else ('#FFFFFF' if B else '#111')
    ct='#FFFFFF' if not B else '#0B1020'
    dCR,_=txt('xb','· TODO COSTA RICA ·',300,523,22,ls=3)
    h.append('<g transform="translate(0 90)"><path d="M108 494 L150 478 L150 518 L108 534 L122 514 Z" fill="%s"/><path d="M492 494 L450 478 L450 518 L492 534 L478 514 Z" fill="%s"/><path d="M150 480 Q300 508 450 480 L450 518 Q300 546 150 518 Z" fill="%s" stroke="%s" stroke-width="4"/><path d="%s" fill="%s"/></g>'%(nav,nav,cinta,cromo,dCR,ct))
    extra='<radialGradient id="gFondo" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#EEF1F6"/><stop offset="1" stop-color="#C9D0DC"/></radialGradient><clipPath id="cEsc"><path d="%s"/></clipPath>'%Ei
    defs2=defs.replace('M40 372 Q300 404 560 372 L560 460 Q300 432 40 460 Z','M20 196 Q300 248 580 196 L580 320 Q300 284 20 320 Z').replace('</defs>',extra+'</defs>')
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 22 648 626">%s<g filter="%s">%s</g></svg>'%(defs2,'url(#sombra)' if C else 'none',''.join(h))
for t in ['color','blanco','negro']:
    open('img/logo6-%s.svg'%t,'w').write(logo(t))
print('ok')
