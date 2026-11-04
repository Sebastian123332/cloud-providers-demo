import json
def mapa(D):
    M=json.load(open(D+'mapa.json',encoding='utf-8'))
    RUTA=[('Guanacaste',(112,188),(112,226),0),('Alajuela',(245,152),(250,118),0),('Heredia',(350,178),(352,136),1),('San José',(330,292),(316,330),0),('Cartago',(396,264),(404,240),1),('Limón',(468,250),(482,206),0),('Puntarenas',(440,432),(440,476),0)]
    s=['<svg viewBox="0 0 600 580" id="mapa" data-wp="%s">'%';'.join('%d,%d'%w for _,w,_,_ in RUTA)]
    s.append('<text class="mar" x="130" y="420">Océano Pacífico</text><text class="mar" x="520" y="150">Mar Caribe</text>')
    for n,_,_,_ in RUTA: s.append('<path class="prov" data-p="%s" d="%s"/>'%(n,M[n]['d']))
    s.append('<path class="ruta-base" id="rutaBase" d=""/><path class="ruta-hecha" id="rutaHecha" d=""/>')
    for i,(n,w,_,_) in enumerate(RUTA): s.append('<circle class="pin" data-i="%d" cx="%d" cy="%d" r="5.5"/>'%(i,w[0],w[1]))
    for n,_,l,ch in RUTA: s.append('<text class="lbl%s" data-p="%s" x="%d" y="%d">%s</text>'%(' chica' if ch else '',n,l[0],l[1],n))
    s.append(open(D+'grua.svgfrag',encoding='utf-8').read())
    s.append('</svg>')
    return '\n'.join(s)
