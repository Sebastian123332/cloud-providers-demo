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
    d24,_=txt('black','24 HRS',300,79,30,ls=3)
    dH,wH=txt('black','H',0,0,112); dI,wI=txt('black','IDALGO',0,0,82,ls=1)
    tot=wH-24+wI; xH=300-tot/2; xI=xH+wH-24
    dH,_=txt('black','H',xH,300,112); dI,_=txt('black','IDALGO',xI,288,82,ls=1,anchor='start')
    dG,_=txt('black','GRÚAS',300,392,40,ls=4)
    dCR,_=txt('xb','· TODO COSTA RICA ·',300,478,24,ls=3)
    est='M0 -12 L3.5 -3.8 L12.4 -3.8 L5.2 1.6 L7.8 10.2 L0 5 L-7.8 10.2 L-5.2 1.6 L-12.4 -3.8 L-3.5 -3.8 Z'
    estrellas=''.join('<path d="%s" transform="translate(%d %d) scale(%s)" fill="%s" stroke="%s" stroke-width="1.5"/>'%(est,x,y,sc,cromo,nav) for x,y,sc in [(252,-4,1),(300,-12,1.3),(348,-4,1)])
    defs='''<defs>
 <linearGradient id="gAzul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3446C4"/><stop offset=".55" stop-color="#26339A"/><stop offset="1" stop-color="#18216A"/></linearGradient>
 <linearGradient id="gPlata" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E7EC"/><stop offset=".45" stop-color="#AEB4BD"/><stop offset=".55" stop-color="#9AA1AB"/><stop offset="1" stop-color="#C6CAD1"/></linearGradient>
 <linearGradient id="gCromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".22" stop-color="#C9CED6"/><stop offset=".42" stop-color="#7E8693"/><stop offset=".58" stop-color="#F4F6F9"/><stop offset=".8" stop-color="#9AA1AB"/><stop offset="1" stop-color="#E9ECF1"/></linearGradient>
 <linearGradient id="gVidrio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8EEFF"/><stop offset=".45" stop-color="#9FB0E8"/><stop offset=".5" stop-color="#7F92D6"/><stop offset="1" stop-color="#C9D4FF"/></linearGradient>
 <radialGradient id="gLuz"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E6ECFF"/><stop offset="1" stop-color="#A9B6E6"/></radialGradient>
 <linearGradient id="gCinta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26339A"/><stop offset="1" stop-color="#121A55"/></linearGradient>
 <linearGradient id="gBrillo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <clipPath id="cPlaca"><path d="M48 196 Q300 236 552 196 L552 310 Q300 276 48 310 Z"/></clipPath>
 <filter id="sombra" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0B1030" flood-opacity=".28"/></filter>
</defs>'''
    g=[]
    # llantas (detrás)
    g.append('<rect x="132" y="372" width="64" height="62" rx="12" fill="%s"/><rect x="404" y="372" width="64" height="62" rx="12" fill="%s"/>'%(llanta,llanta))
    # espejos
    for x,s in [(0,1),(600,-1)]:
        g.append('<g transform="translate(%d 0) scale(%d 1)"><path d="M150 112 L104 104 L104 112 L150 122" fill="%s" stroke="%s" stroke-width="3"/><rect x="74" y="88" width="34" height="78" rx="9" fill="%s" stroke="%s" stroke-width="5"/><rect x="82" y="96" width="18" height="40" rx="4" fill="%s" opacity=".9"/></g>'%(x,s,cromo,nav,azul,nav,vidrio))
    # cabina
    g.append('<path d="M160 168 L172 58 Q176 34 202 32 L398 32 Q424 34 428 58 L440 168 Z" fill="%s" stroke="%s" stroke-width="8" stroke-linejoin="round"/>'%(azul,nav))
    # luces de techo
    g.append(''.join('<rect x="%d" y="20" width="18" height="9" rx="3" fill="#F2A23A" stroke="%s" stroke-width="2"/>'%(x,nav) for x in [231,261,291,321,351]))
    # visera con 24 HRS
    g.append('<path d="M168 58 Q300 48 432 58 L430 88 Q300 80 170 88 Z" fill="%s" stroke="%s" stroke-width="4"/>'%('#0E1440' if C else ('#0B1020' if B else '#111'),nav))
    g.append('<path d="%s" fill="#FFFFFF"/>'%d24)
    # parabrisas dividido
    g.append('<path d="M176 94 Q236 88 294 88 L294 160 L170 160 Z" fill="%s" stroke="%s" stroke-width="4"/><path d="M306 88 Q364 88 424 94 L430 160 L306 160 Z" fill="%s" stroke="%s" stroke-width="4"/>'%(vidrio,nav,vidrio,nav))
    if C: g.append('<path d="M186 150 L232 96 L250 96 L204 150 Z M318 150 L364 96 L376 96 L330 150 Z" fill="#FFFFFF" opacity=".45"/>')
    # capó
    g.append('<path d="M150 168 H450 L470 200 H130 Z" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/>'%(azul,nav))
    # guardafangos y faroles
    for x,s in [(0,1),(600,-1)]:
        g.append('<g transform="translate(%d 0) scale(%d 1)"><path d="M126 196 L196 196 L204 372 L118 372 Q104 300 126 196 Z" fill="%s" stroke="%s" stroke-width="6" stroke-linejoin="round"/><path d="M122 318 L196 312 L198 350 L118 356 Z" fill="%s" stroke="%s" stroke-width="4"/><circle cx="142" cy="334" r="9" fill="#F2A23A"/></g>'%(x,s,azul,nav,luz,nav))
    # parrilla cromada
    g.append('<path d="M210 196 H390 L384 372 H216 Z" fill="%s" stroke="%s" stroke-width="7" stroke-linejoin="round"/>'%(cromo,nav))
    g.append(''.join('<path d="M222 %d H378" stroke="%s" stroke-width="5" stroke-linecap="round" opacity=".75"/>'%(y,nav) for y in range(214,372,14)))
    # placa HIDALGO
    g.append('<path d="M48 196 Q300 236 552 196 L552 310 Q300 276 48 310 Z" fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round"/>'%(plata,nav))
    g.append('<path d="M68 213 Q300 250 532 213 L532 294 Q300 262 68 294 Z" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".9"/>')
    if C: g.append('<g clip-path="url(#cPlaca)"><rect x="-80" y="180" width="90" height="160" fill="url(#gBrillo)" transform="skewX(-25)"><animate attributeName="x" values="-120;700;700" dur="4s" repeatCount="indefinite"/></rect></g>')
    g.append('<g fill="%s"><circle cx="86" cy="224" r="6"/><circle cx="514" cy="224" r="6"/><circle cx="86" cy="284" r="6"/><circle cx="514" cy="284" r="6"/></g>'%nav)
    g.append('<path d="%s" fill="%s" stroke="%s" stroke-width="5" paint-order="stroke"/>'%(dH,txtb,'#FFFFFF' if not B else '#9EA4AE'))
    g.append('<path d="%s" fill="%s"/>'%(dI,txtb))
    # defensa cromada con GRÚAS
    g.append('<path d="M96 362 H504 Q516 362 516 374 V398 Q516 410 504 410 H96 Q84 410 84 398 V374 Q84 362 96 362 Z" fill="%s" stroke="%s" stroke-width="6"/>'%(cromo,nav))
    g.append('<path d="%s" fill="%s"/>'%(dG,txtb))
    # cinta
    cinta='url(#gCinta)' if C else ('#FFFFFF' if B else '#111')
    ct='#FFFFFF' if not B else '#0B1020'
    g.append('<path d="M118 446 L150 430 L150 470 L118 486 L130 466 Z" fill="%s" opacity=".85"/><path d="M482 446 L450 430 L450 470 L482 486 L470 466 Z" fill="%s" opacity=".85"/><path d="M150 432 Q300 462 450 432 L450 470 Q300 500 150 470 Z" fill="%s" stroke="%s" stroke-width="4"/><path d="%s" fill="%s"/>'%(nav,nav,cinta,cromo,dCR,ct))
    g.append(estrellas)
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 -32 520 528">%s<g filter="%s">%s</g></svg>'%(defs,'url(#sombra)' if C else 'none',''.join(g))
for t in ['color','blanco','negro']:
    open('img/logo3-%s.svg'%t,'w').write(logo(t))
print('ok')
