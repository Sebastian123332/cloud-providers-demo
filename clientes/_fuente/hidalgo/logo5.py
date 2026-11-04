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
    g=[]
    gl='rgba(255,255,255,.07)' if B else azul
    # líneas de velocidad
    # chasis y quinta rueda
    g.append('<rect x="390" y="286" width="150" height="16" rx="4" fill="%s"/><rect x="430" y="272" width="80" height="14" rx="4" fill="%s" stroke="%s" stroke-width="3"/>'%(nav,cromo,nav))
    # dormitorio (sleeper)
    g.append('<path d="M300 300 V112 Q300 84 330 84 L392 84 Q408 84 408 100 V300 Z" fill="%s" stroke="%s" stroke-width="7" stroke-linejoin="round"/>'%(gl,nav))
    g.append('<path d="M318 120 H392 M318 270 H392" stroke="%s" stroke-width="3" opacity=".6"/>'%('#FFFFFF' if not B else '#C3C8D1'))
    g.append('<path d="%s" fill="#FFFFFF" transform="translate(354 0)"/>'%d24)
    # cabina
    g.append('<path d="M196 300 V214 L212 132 Q216 112 238 112 L300 112 V300 Z" fill="%s" stroke="%s" stroke-width="7" stroke-linejoin="round"/>'%(gl,nav))
    g.append('<path d="M224 126 L292 126 L292 198 L210 198 Z" fill="%s" stroke="%s" stroke-width="4"/>'%(vidrio,nav))
    if C: g.append('<path d="M232 190 L262 130 L276 130 L246 190 Z" fill="#FFFFFF" opacity=".45"/>')
    g.append('<path d="M286 214 V292" stroke="%s" stroke-width="3" opacity=".7"/><rect x="262" y="226" width="18" height="5" rx="2" fill="%s"/>'%(nav,cromo))
    # espejo
    g.append('<path d="M212 150 L188 150" stroke="%s" stroke-width="4"/><rect x="172" y="120" width="18" height="52" rx="5" fill="%s" stroke="%s" stroke-width="4"/>'%(cromo,gl,nav))
    # luces de techo
    g.append(''.join('<rect x="%d" y="104" width="11" height="8" rx="3" fill="#F2A23A" stroke="%s" stroke-width="2"/>'%(x,nav) for x in [236,254,272]))
    # capó largo
    g.append('<path d="M52 300 V246 Q52 226 76 222 L200 206 L200 300 Z" fill="%s" stroke="%s" stroke-width="7" stroke-linejoin="round"/>'%(gl,nav))
    g.append('<path d="M70 236 L190 222" stroke="#FFFFFF" stroke-width="4" opacity=".45"/>')
    g.append('<rect x="38" y="232" width="18" height="68" rx="5" fill="%s" stroke="%s" stroke-width="4"/>'%(cromo,nav))
    g.append('<path d="M60 262 L90 260 L92 280 L60 282 Z" fill="%s" stroke="%s" stroke-width="3"/>'%(luz,nav))
    # escape
    g.append('<rect x="410" y="54" width="12" height="230" rx="5" fill="%s" stroke="%s" stroke-width="3"/><path d="M410 60 L424 48" stroke="%s" stroke-width="5" stroke-linecap="round"/>'%(cromo,nav,nav))
    # tanque
    g.append('<rect x="214" y="298" width="120" height="40" rx="18" fill="%s" stroke="%s" stroke-width="5"/><path d="M244 300 V336 M304 300 V336" stroke="%s" stroke-width="3" opacity=".6"/>'%(cromo,nav,nav))
    # defensa
    g.append('<rect x="30" y="296" width="54" height="26" rx="8" fill="%s" stroke="%s" stroke-width="5"/>'%(cromo,nav))
    # guardafangos y llantas
    def rueda(x):
        return '<path d="M%d 300 a40 40 0 0 1 80 0" fill="%s" stroke="%s" stroke-width="5"/><circle cx="%d" cy="330" r="33" fill="%s"/><circle cx="%d" cy="330" r="18" fill="%s" stroke="%s" stroke-width="3"/><circle cx="%d" cy="330" r="5" fill="%s"/>'%(x-40,gl,nav,x,llanta,x,cromo,nav,x,nav)
    g.append(rueda(130)+rueda(430)+rueda(506))
    truck=''.join(g)
    E='M300 52 L520 96 Q548 102 548 132 V320 Q548 520 300 640 Q52 520 52 320 V132 Q52 102 80 96 Z'
    Ei='M300 76 L508 116 Q526 120 526 140 V320 Q526 504 300 612 Q74 504 74 320 V140 Q74 120 92 116 Z'
    fondo='url(#gFondo)' if C else ('#141B33' if B else '#F4F4F4')
    h=[]
    h.append('<path d="%s" fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round"/>'%(E,cromo,nav))
    h.append('<path d="%s" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>'%(Ei,fondo,nav))
    h.append('<path d="M74 140 Q74 120 92 116 L300 76 L508 116 Q526 120 526 140 V170 Q300 150 74 170 Z" fill="%s"/>'%(azul if not B else 'rgba(255,255,255,.1)'))
    h.append('<path d="M74 170 Q300 150 526 170" fill="none" stroke="%s" stroke-width="4"/>'%nav)
    h.append(''.join('<path d="%s" transform="translate(%d %d) scale(%s)" fill="%s" stroke="%s" stroke-width="1.5"/>'%(est,x,y,sc,cromo,nav) for x,y,sc in [(240,138,.9),(300,128,1.25),(360,138,.9)]))
    h.append('<g clip-path="url(#cEsc)"><rect x="60" y="392" width="480" height="40" fill="%s" opacity="%s"/><path d="M60 412 H540" stroke="%s" stroke-width="4" stroke-dasharray="26 18" opacity=".8"/></g>'%(nav,'.9' if not B else '.35','#FFFFFF' if C else ('#C3C8D1' if B else '#FFFFFF')))
    if C: h.append('<g clip-path="url(#cEsc)" stroke="#1B2470" stroke-opacity=".07" stroke-width="2"><path d="M60 220 H540 M60 260 H540 M60 300 H540 M60 340 H540"/></g>')
    h.append('<g transform="translate(78 112) scale(.78)">%s</g>'%truck)
    h.append('<g transform="translate(0 50)">')
    h.append('<path d="M20 372 Q300 404 580 372 L580 460 Q300 432 20 460 Z" fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round"/>'%(plata,nav))
    h.append('<path d="M38 386 Q300 416 562 386 L562 446 Q300 420 38 446 Z" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".9"/>')
    if C: h.append('<g clip-path="url(#cPlaca)"><rect x="-80" y="360" width="90" height="120" fill="url(#gBrillo)" transform="skewX(-25)"><animate attributeName="x" values="-120;700;700" dur="4s" repeatCount="indefinite"/></rect></g>')
    h.append('<g fill="%s"><circle cx="56" cy="398" r="6"/><circle cx="544" cy="398" r="6"/><circle cx="56" cy="438" r="6"/><circle cx="544" cy="438" r="6"/></g>'%nav)
    h.append('<path d="%s" fill="%s" stroke="%s" stroke-width="5" paint-order="stroke"/>'%(dH,txtb,'#FFFFFF' if not B else '#9EA4AE'))
    h.append('<path d="%s" fill="%s"/></g>'%(dI,txtb))
    cinta='url(#gCinta)' if C else ('#FFFFFF' if B else '#111')
    ct='#FFFFFF' if not B else '#0B1020'
    h.append('<g transform="translate(0 52)"><path d="M108 494 L150 478 L150 518 L108 534 L122 514 Z" fill="%s"/><path d="M492 494 L450 478 L450 518 L492 534 L478 514 Z" fill="%s"/><path d="M150 480 Q300 508 450 480 L450 518 Q300 546 150 518 Z" fill="%s" stroke="%s" stroke-width="4"/><path d="%s" fill="%s"/></g>'%(nav,nav,cinta,cromo,dCR,ct))
    extra='<radialGradient id="gFondo" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E7EBF3"/><stop offset="1" stop-color="#BFC6D4"/></radialGradient><clipPath id="cEsc"><path d="%s"/></clipPath>'%Ei
    defs2=defs.replace('M40 372 Q300 404 560 372 L560 460 Q300 432 40 460 Z','M20 372 Q300 404 580 372 L580 460 Q300 432 20 460 Z').replace('</defs>',extra+'</defs>')
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 36 592 612">%s<g filter="%s">%s</g></svg>'%(defs2,'url(#sombra)' if C else 'none',''.join(h))
for t in ['color','blanco','negro']:
    open('img/logo5-%s.svg'%t,'w').write(logo(t))
print('ok')
