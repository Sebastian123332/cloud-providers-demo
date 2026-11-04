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
 <filter id="sombra" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0B1030" flood-opacity=".28"/></filter>
</defs>'''
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 20 540 445">
%s
<g filter="%s">
<path d="%s" fill="%s" stroke="%s" stroke-width="16" stroke-linejoin="round"/>
<path d="%s" fill="none" stroke="%s" stroke-width="6" stroke-linejoin="round" transform="translate(300 245) scale(.9) translate(-300 -245)"/>
%s%s
<path d="%s" fill="%s" stroke="%s" stroke-width="12" stroke-linejoin="round"/>
<path d="%s" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".9"/>
<g fill="%s"><circle cx="86" cy="226" r="6"/><circle cx="514" cy="226" r="6"/><circle cx="86" cy="292" r="6"/><circle cx="514" cy="292" r="6"/></g>
<path d="%s" fill="%s"/>
<path d="%s" fill="%s" stroke="%s" stroke-width="5" paint-order="stroke"/>
<path d="%s" fill="%s"/>
<path d="%s" fill="%s"/>
</g>
</svg>'''%(defs,'url(#sombra)' if tema=='color' else 'none',shield,blanco,nav_s,shield,gris,pluma(),pluma(True),banner,plata,nav_s,banner2,nav_s,d24,txtc,dH,txtb,'#FFFFFF' if tema!='blanco' else '#9EA4AE',dI,txtb,dG,txtc)
for t in ['color','blanco','negro']:
    open('img/logo-%s.svg'%t,'w').write(logo(t))
print('ok')
