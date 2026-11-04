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
    d24,_=txt('black','24 HRS',300,186,54,ls=2)
    dH,wH=txt('black','H',0,0,118)
    dI,wI=txt('black','IDALGO',0,0,86,ls=1)
    tot=wH-26+wI; xH=300-tot/2; xI=xH+wH-26
    dH,_=txt('black','H',xH,312,118); dI,_=txt('black','IDALGO',xI,298,86,anchor='start',ls=1)
    dG,_=txt('black','GRÚAS',300,384,70,ls=3)
    shield='M300 40 L482 104 L456 392 Q300 448 144 392 L118 104 Z'
    banner='M48 196 Q300 248 552 196 L552 320 Q300 284 48 320 Z'
    banner2='M68 213 Q300 262 532 213 L532 304 Q300 271 68 304 Z'
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
    dCR,_=txt('xb','· TODO COSTA RICA ·',300,474,25,ls=3)
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
</svg>'''%(defs,'url(#sombra)' if tema=='color' else 'none',shield,cromo,shield,blanco,nav_s,shield,gris,brillo,pluma(),pluma(True),banner,plata,nav_s,banner2,brillo_placa,nav_s,d24,txtc,dH,txtb,'#FFFFFF' if tema!='blanco' else '#9EA4AE',dI,txtb,dG,txtc,cintaInf,estrellas)
for t in ['color','blanco','negro']:
    open('img/logo-%s.svg'%t,'w').write(logo(t))
print('ok')
