from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
F={'black':TTFont('font/f2.ttf'),'xb':TTFont('font/f1.ttf'),'bar':TTFont('font/f0.ttf')}
def txt(f,s,x,y,size,anchor='middle',ls=0):
    font=F[f]; gs=font.getGlyphSet(); cmap=font.getBestCmap(); upm=font['head'].unitsPerEm; k=size/upm
    hm=font['hmtx']; names=[cmap[ord(c)] for c in s]
    w=sum(hm[n][0] for n in names)*k+ls*(len(s)-1)
    x0=x-w/2 if anchor=='middle' else (x-w if anchor=='end' else x)
    pen=SVGPathPen(gs); cx=x0
    for n in names:
        gs[n].draw(TransformPen(pen,(k,0,0,-k,cx,y))); cx+=hm[n][0]*k+ls
    return pen.getCommands(), w
def logo(tema='color'):
    navy='url(#gAzul)' if tema=='color' else ('#FFFFFF' if tema=='blanco' else '#111111')
    nav_s='#1B2470' if tema=='color' else ('#FFFFFF' if tema=='blanco' else '#111111')
    blanco='url(#gBlanco)' if tema=='color' else ('rgba(255,255,255,.07)' if tema=='blanco' else '#FFFFFF')
    gris='#9EA4AE' if tema!='negro' else '#666'
    plata='url(#gPlata)' if tema=='color' else ('#9EA4AE' if tema=='blanco' else '#BBBBBB')
    txtc=navy if tema!='blanco' else '#FFFFFF'
    txtb=navy if tema!='blanco' else '#0B1020'
    d24=''
    dH,wH=txt('black','H',0,0,118)
    dI,wI=txt('black','IDALGO',0,0,86,ls=1)
    tot=wH-26+wI; xH=300-tot/2; xI=xH+wH-26
    dH,_=txt('black','H',xH,312,118); dI,_=txt('black','IDALGO',xI,298,86,anchor='start',ls=1)
    dG,_=txt('black','GRÚAS',300,384,70,ls=3)
    shield='M300 40 L482 104 L456 392 Q300 448 144 392 L118 104 Z'
    banner='M48 196 Q300 248 552 196 L552 320 Q300 284 48 320 Z'
    banner2='M68 213 Q300 262 532 213 L532 304 Q300 271 68 304 Z'
    def escena():
        cuerpo=navy; borde=nav_s
        gris_t='url(#gPlata)' if tema=='color' else ('#C3C8D1' if tema=='blanco' else '#BBBBBB')
        vid='#DDE3FF' if tema=='color' else ('#0B1020' if tema=='blanco' else '#FFFFFF')
        llanta='#0B1020' if tema!='blanco' else '#FFFFFF'
        rin='url(#gPlata)' if tema=='color' else ('#9EA4AE' if tema=='blanco' else '#888')
        def rueda(x,y,r=13):
            return '<circle cx="%d" cy="%d" r="%d" fill="%s"/><circle cx="%d" cy="%d" r="%d" fill="%s"/><circle cx="%d" cy="%d" r="2.5" fill="%s"/>'%(x,y,r,llanta,x,y,r*.5,rin,x,y,llanta)
        g='<g stroke-linejoin="round">'
        # líneas de velocidad
        g+='<g stroke="%s" stroke-width="4" stroke-linecap="round" opacity=".55"><path d="M92 150 H118"/><path d="M82 166 H114"/><path d="M96 182 H120"/></g>'%gris
        # camión remolcado (atrás), nariz levantada
        g+='<g transform="rotate(4 456 204)">'
        g+='<path d="M372 104 H462 Q468 104 468 110 V178 H372 Z" fill="%s" stroke="%s" stroke-width="4"/>'%(gris_t,borde)
        g+='<path d="M384 116 H456 M384 130 H456 M384 144 H456 M384 158 H456" stroke="%s" stroke-width="2" opacity=".35"/>'%borde
        g+='<path d="M322 178 V160 Q322 150 332 148 L344 146 L350 122 Q352 116 358 116 L370 116 V178 Z" fill="#FFFFFF" stroke="%s" stroke-width="4"/>'%borde
        g+='<path d="M352 124 L366 124 L366 142 L348 142 Z" fill="%s" stroke="%s" stroke-width="2"/>'%(vid,borde)
        g+='<rect x="318" y="168" width="10" height="8" rx="2" fill="%s"/>'%rin
        g+='<rect x="318" y="178" width="154" height="6" fill="%s"/>'%borde
        g+=rueda(342,190)+rueda(430,192)+rueda(456,192)
        g+='</g>'
        # grúa (adelante, mira a la izquierda)
        g+='<path d="M296 186 L326 188" stroke="%s" stroke-width="7" stroke-linecap="round"/>'%borde
        g+='<path d="M278 162 L308 132" stroke="%s" stroke-width="9" stroke-linecap="round"/><path d="M308 132 L312 158" stroke="%s" stroke-width="3"/>'%(borde,borde)
        g+='<path d="M130 186 V170 Q130 160 140 158 L186 154 L196 118 Q199 106 210 106 L238 106 Q248 106 248 114 V108 Q248 100 256 100 L266 100 Q272 100 272 108 V158 H296 V186 Z" fill="%s" stroke="%s" stroke-width="4"/>'%(cuerpo,borde)
        g+='<path d="M141 168 H182 M141 175 H182 M141 182 H182" stroke="%s" stroke-width="2.5" opacity=".8"/>'%rin
        g+='<path d="M250 112 V154" stroke="%s" stroke-width="2" opacity=".6"/>'%rin
        g+='<path d="M210 113 L238 113 L240 142 L201 142 Z" fill="%s" stroke="%s" stroke-width="2"/>'%(vid,borde)
        
        g+='<rect x="274" y="88" width="6" height="68" rx="2" fill="%s"/>'%rin
        g+='<rect x="124" y="176" width="14" height="10" rx="3" fill="%s"/>'%rin
        g+='<rect x="214" y="100" width="18" height="6" rx="2" fill="#F2A23A"/>'
        g+='<path d="M130 186 H300" stroke="%s" stroke-width="4"/>'%borde
        g+=rueda(160,192,14)+rueda(248,192,14)+rueda(278,192,14)
        g+='</g>'
        return g
    def pluma(esp=False):
        g='''<g%s>
  <path d="M268 252 L112 88" stroke="%s" stroke-width="40" stroke-linecap="butt"/>
  <path d="M252 246 L104 92" stroke="%s" stroke-width="5" stroke-opacity=".35"/>
  <rect x="66" y="52" width="62" height="40" rx="12" fill="%s" stroke="%s" stroke-width="6" transform="rotate(-8 97 72)"/>
  <circle cx="92" cy="72" r="8" fill="%s" stroke="%s" stroke-width="4"/>
  <path d="M82 92 L80 132" stroke="%s" stroke-width="5"/>
  <rect x="70" y="128" width="20" height="24" rx="5" fill="%s"/>
  <path d="M80 152 v12 a13 13 0 1 1 -13 13" fill="none" stroke="%s" stroke-width="7" stroke-linecap="round"/>
</g>'''%((' transform="translate(600 0) scale(-1 1)"' if esp else ''),nav_s,'#FFFFFF',gris,nav_s,'#FFFFFF' if tema!='blanco' else '#0B1020',nav_s,nav_s,nav_s,nav_s)
        return g
    defs='''<defs>
 <linearGradient id="gAzul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3446C4"/><stop offset=".55" stop-color="#26339A"/><stop offset="1" stop-color="#18216A"/></linearGradient>
 <linearGradient id="gPlata" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E7EC"/><stop offset=".45" stop-color="#AEB4BD"/><stop offset=".55" stop-color="#9AA1AB"/><stop offset="1" stop-color="#C6CAD1"/></linearGradient>
 <linearGradient id="gBlanco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF1F6"/></linearGradient>
 <linearGradient id="gCromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".22" stop-color="#C9CED6"/><stop offset=".42" stop-color="#7E8693"/><stop offset=".58" stop-color="#F4F6F9"/><stop offset=".8" stop-color="#9AA1AB"/><stop offset="1" stop-color="#E9ECF1"/></linearGradient>
 <linearGradient id="gBrillo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <linearGradient id="gCinta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26339A"/><stop offset="1" stop-color="#121A55"/></linearGradient>
 <clipPath id="cEscudo"><path d="M300 40 L482 104 L456 392 Q300 448 144 392 L118 104 Z"/></clipPath>
 <clipPath id="cPlaca"><path d="M48 196 Q300 248 552 196 L552 320 Q300 284 48 320 Z"/></clipPath>
 <filter id="sombra" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0B1030" flood-opacity=".28"/></filter>
</defs>'''
    cromo='url(#gCromo)' if tema=='color' else ('#C3C8D1' if tema=='blanco' else '#555')
    cinta='url(#gCinta)' if tema=='color' else ('#FFFFFF' if tema=='blanco' else '#111')
    cintaTxt='#FFFFFF' if tema!='blanco' else '#0B1020'
    dCR,_=txt('xb','24 HRS · TODO COSTA RICA',300,474,25,ls=2)
    est='M0 -12 L3.5 -3.8 L12.4 -3.8 L5.2 1.6 L7.8 10.2 L0 5 L-7.8 10.2 L-5.2 1.6 L-12.4 -3.8 L-3.5 -3.8 Z'
    estrellas=''.join('<path d="%s" transform="translate(%d %d) scale(%s)" fill="%s" stroke="%s" stroke-width="1.5"/>'%(est,x,y,sc,cromo,nav_s) for x,y,sc in [(258,22,1),(300,10,1.35),(342,22,1)])
    brillo='<g clip-path="url(#cEscudo)" opacity=".55"><path d="M118 40 L300 40 L170 300 L118 300 Z" fill="#FFFFFF" opacity=".35"/></g>' if tema=='color' else ''
    brillo_placa='<g clip-path="url(#cPlaca)"><rect x="-80" y="180" width="90" height="160" fill="url(#gBrillo)" transform="skewX(-25)"><animate attributeName="x" values="-120;700;700" dur="4s" repeatCount="indefinite"/></rect></g>' if tema=='color' else ''
    cintaInf='''<path d="M118 446 L150 430 L150 470 L118 486 L130 466 Z" fill="%s" opacity=".85"/><path d="M482 446 L450 430 L450 470 L482 486 L470 466 Z" fill="%s" opacity=".85"/>
<path d="M150 430 Q300 468 450 430 L450 470 Q300 506 150 470 Z" fill="%s" stroke="%s" stroke-width="4"/>
<path d="%s" fill="%s"/>'''%(nav_s,nav_s,cinta,cromo,dCR,cintaTxt)
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 -10 560 510">
%s
<g filter="%s">
<path d="%s" fill="none" stroke="%s" stroke-width="30" stroke-linejoin="round"/>
<path d="%s" fill="%s" stroke="%s" stroke-width="16" stroke-linejoin="round"/>
<path d="%s" fill="none" stroke="%s" stroke-width="6" stroke-linejoin="round" transform="translate(300 245) scale(.9) translate(-300 -245)"/>
%s
%s%s
<path d="%s" fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round"/>
<path d="%s" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".9"/>
%s
<g fill="%s"><circle cx="86" cy="226" r="6"/><circle cx="514" cy="226" r="6"/><circle cx="86" cy="292" r="6"/><circle cx="514" cy="292" r="6"/></g>
<path d="%s" fill="%s"/>
<path d="%s" fill="%s" stroke="%s" stroke-width="5" paint-order="stroke"/>
<path d="%s" fill="%s"/>
<path d="%s" fill="%s"/>
%s
%s
</g>
</svg>'''%(defs,'url(#sombra)' if tema=='color' else 'none',shield,cromo,shield,blanco,nav_s,shield,gris,brillo,escena(),'',banner,plata,nav_s,banner2,brillo_placa,nav_s,d24,txtc,dH,txtb,'#FFFFFF' if tema!='blanco' else '#9EA4AE',dI,txtb,dG,txtc,cintaInf,estrellas)
for t in ['color','blanco','negro']:
    open('img/logo2-%s.svg'%t,'w').write(logo(t))
print('ok')
