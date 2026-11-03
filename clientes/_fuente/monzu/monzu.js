(function(){
  'use strict';
  var d=document, $=function(i){return d.getElementById(i)};
  var QUIETO=matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.documentElement.classList.add('js');
  $('anio').textContent=String(new Date().getFullYear());
  var WA='50672686906';
  function col(n){ return '₡'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.') }
  /* limpia lo que escribe el usuario: sin caracteres de control ni invisibles, sin < > */
  function limpiar(t,max){
    var s=String(t==null?'':t).normalize('NFKC'), o='';
    for(var i=0;i<s.length;i++){
      var c=s.charCodeAt(i);
      if(c<32||(c>=127&&c<160)||(c>=0x200B&&c<=0x200F)||(c>=0x2028&&c<=0x202E)||(c>=0x2060&&c<=0x2069)||c===0xFEFF) continue;
      if(c===60||c===62) continue;
      o+=s[i];
    }
    return o.replace(/\s{2,}/g,' ').trim().slice(0,max);
  }

  /* ===== menú ===== */
  var nav=$('nav');
  $('menuBtn').addEventListener('click',function(){ var a=nav.classList.toggle('abre'); this.setAttribute('aria-expanded',String(a)) });
  d.querySelectorAll('#links a').forEach(function(a){ a.addEventListener('click',function(){ nav.classList.remove('abre') }) });

  /* ===== aparición ===== */
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target) } }) },{threshold:.12});
  d.querySelectorAll('.rv,.obra').forEach(function(el,i){ el.style.transitionDelay=(i%3)*90+'ms'; io.observe(el) });
  var hero=d.querySelector('.hero'); setTimeout(function(){ hero.classList.add('listo') },80);

  /* ===== el carro sucio que se limpia con el dedo ===== */
  (function(){
    var caja=$('limpia'), cv=$('sucio'), es=$('espuma'), pct=$('pct');
    var ctx=cv.getContext('2d'), ex=es.getContext('2d'), w=0, h=0, dpr=1, pasadas=0, listo=false, burbujas=[];
    function ensuciar(){
      var r=caja.getBoundingClientRect(); dpr=Math.min(2,devicePixelRatio||1); w=r.width; h=r.height;
      [cv,es].forEach(function(c){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr) });
      ctx.setTransform(dpr,0,0,dpr,0,0); ex.setTransform(dpr,0,0,dpr,0,0);
      ctx.globalCompositeOperation='source-over';
      var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(120,98,66,.80)'); g.addColorStop(1,'rgba(74,58,38,.92)');
      ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
      var semilla=7; function az(){ semilla=(semilla*9301+49297)%233280; return semilla/233280 }
      for(var i=0;i<260;i++){ /* manchas de barro */
        ctx.fillStyle='rgba('+(60+az()*50|0)+','+(44+az()*40|0)+','+(26+az()*26|0)+','+(.25+az()*.45).toFixed(2)+')';
        ctx.beginPath(); ctx.ellipse(az()*w,az()*h,2+az()*22,2+az()*14,az()*3,0,7); ctx.fill();
      }
      ctx.strokeStyle='rgba(40,30,18,.35)'; ctx.lineWidth=2;
      for(var j=0;j<40;j++){ var x=az()*w, y=az()*h*.6; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+(az()-.5)*10,y+30,x+(az()-.5)*6,y+40+az()*80); ctx.stroke(); }
      ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='800 italic '+Math.round(w/16)+'px "Exo 2", sans-serif'; ctx.textAlign='center';
      ctx.fillText('LÍMPIEME',w/2,h*.42);
      pasadas=0; listo=false; caja.classList.remove('lista','tocada'); pct.textContent='0%';
    }
    function frota(x,y){
      ctx.globalCompositeOperation='destination-out';
      var g=ctx.createRadialGradient(x,y,0,x,y,Math.max(28,w/14));
      g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(.7,'rgba(0,0,0,.85)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,Math.max(28,w/14),0,7); ctx.fill();
      for(var i=0;i<3;i++) burbujas.push({x:x+(Math.random()-.5)*30,y:y+(Math.random()-.5)*30,r:2+Math.random()*7,v:.4+Math.random()*1.2,a:1});
      if(burbujas.length>160) burbujas.splice(0,burbujas.length-160);
      if(++pasadas%12===0) mide();
    }
    function mide(){
      var img=ctx.getImageData(0,0,cv.width,cv.height).data, tot=0, limpio=0;
      for(var i=3;i<img.length;i+=4*97){ tot++; if(img[i]<40) limpio++ }
      var p=Math.min(100,Math.round(limpio/tot*100/0.85)); pct.textContent=p+'%';
      if(p>=100&&!listo){ listo=true; termina() }
    }
    function termina(){
      var a=1;(function f(){ a-=.06; ctx.globalCompositeOperation='destination-out'; ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(0,0,w,h); if(a>0) requestAnimationFrame(f); else { ctx.clearRect(0,0,w,h); caja.classList.add('lista'); pct.textContent='100%' } })();
    }
    function anima(){
      ex.clearRect(0,0,w,h);
      for(var i=burbujas.length-1;i>=0;i--){ var b=burbujas[i]; b.y-=b.v; b.a-=.012; if(b.a<=0){ burbujas.splice(i,1); continue }
        ex.strokeStyle='rgba(220,248,255,'+(b.a*.9).toFixed(2)+')'; ex.fillStyle='rgba(139,227,238,'+(b.a*.18).toFixed(2)+')'; ex.lineWidth=1.2;
        ex.beginPath(); ex.arc(b.x,b.y,b.r,0,7); ex.fill(); ex.stroke(); }
      requestAnimationFrame(anima);
    }
    if(QUIETO){ pct.textContent='100%'; caja.classList.add('lista'); $('ensuciar').hidden=true; return }
    var pres=false;
    function punto(e){ var r=cv.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top] }
    cv.addEventListener('pointerdown',function(e){ pres=true; caja.classList.add('tocada'); try{cv.setPointerCapture(e.pointerId)}catch(x){} var p=punto(e); frota(p[0],p[1]) });
    cv.addEventListener('pointermove',function(e){ if(pres||e.pointerType==='mouse'){ caja.classList.add('tocada'); var p=punto(e); frota(p[0],p[1]) } });
    addEventListener('pointerup',function(){ pres=false });
    $('ensuciar').addEventListener('click',ensuciar);
    var t; addEventListener('resize',function(){ clearTimeout(t); t=setTimeout(function(){ if(!listo) ensuciar() },200) });
    (d.fonts&&d.fonts.ready?d.fonts.ready:Promise.resolve()).then(ensuciar);
    ensuciar(); anima();
  })();

  /* ===== precios ===== */
  var PAQ={premium:{sedan:16000,suv:18000,n:'Detallado Premium'},deluxe:{sedan:32000,suv:35000,n:'Detallado Deluxe'}};
  var EXTRAS=[
    {k:'motor',n:'Limpieza de motor',p:8000,conPaq:5000,d:'₡5.000 con detallado'},
    {k:'asientos',n:'Limpieza de asientos',p:25000},
    {k:'techo',n:'Limpieza de techo',p:10000},
    {k:'tapiceria',n:'Tapicería completa',p:30000,desde:true,d:'Desde ₡30.000'},
    {k:'colchon',n:'Limpieza de colchón',p:10000}
  ];
  var AROMAS=[['Kiwi','#9BCB3C',0],['Brisa del mar','#2FB6C8',0],['Carro nuevo','#3E8A5E',1],['Granada cítrica','#F0503C',1],['Sándalo','#B5A458',1],['Frutos rojos','#8A2147',1],['Finesse','#2E5FD0',2],['Coco','#EDE3C8',2],['Vainilla','#E8A33A',2],['Sandía','#F06A7A',2]];
  var veh='sedan', aroma='';

  function pintaPaquetes(){
    d.querySelectorAll('[data-precio]').forEach(function(b){ b.textContent=col(PAQ[b.dataset.precio][veh]) });
    d.querySelectorAll('[data-tipo]').forEach(function(s){ s.textContent=veh==='sedan'?'sedán':'SUV · pick up · XL' });
    d.querySelectorAll('.selector button').forEach(function(b){ b.setAttribute('aria-pressed',String(b.dataset.v===veh)) });
    $('opPremium').textContent=col(PAQ.premium[veh]); $('opDeluxe').textContent=col(PAQ.deluxe[veh]);
    var r=d.querySelector('input[name="veh"][value="'+veh+'"]'); if(r) r.checked=true;
    cotiza();
  }
  d.querySelectorAll('.selector button').forEach(function(b){ b.addEventListener('click',function(){ veh=b.dataset.v; pintaPaquetes() }) });
  d.querySelectorAll('[data-elige]').forEach(function(a){ a.addEventListener('click',function(){ var r=d.querySelector('input[name="paq"][value="'+a.dataset.elige+'"]'); if(r){ r.checked=true; cotiza() } }) });
  d.querySelectorAll('.paq').forEach(function(p){ p.addEventListener('pointermove',function(e){ var r=p.getBoundingClientRect(); p.style.setProperty('--x',(e.clientX-r.left)+'px'); p.style.setProperty('--y',(e.clientY-r.top)+'px') }) });

  /* adicionales del formulario */
  var cajaEx=$('extras');
  EXTRAS.forEach(function(x){
    var l=d.createElement('label'); l.className='op';
    var i=d.createElement('input'); i.type='checkbox'; i.value=x.k;
    var s=d.createElement('span'); s.textContent=x.n; var sm=d.createElement('small'); sm.textContent=x.d||col(x.p); s.appendChild(sm);
    l.appendChild(i); l.appendChild(s); cajaEx.appendChild(l);
  });

  /* aromas */
  var chips=$('chips');
  AROMAS.forEach(function(a){
    var b=d.createElement('button'); b.type='button'; b.setAttribute('aria-pressed','false');
    var i=d.createElement('i'); i.style.setProperty('--c',a[1]); b.appendChild(i); b.appendChild(d.createTextNode(a[0]));
    b.addEventListener('click',function(){
      aroma = aroma===a[0] ? '' : a[0];
      chips.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed',String(x===b && aroma!=='')) });
      var sel=$('aromaSel'); sel.textContent='';
      if(aroma){ sel.appendChild(d.createTextNode('Aroma elegido: ')); var bb=d.createElement('b'); bb.textContent=aroma; sel.appendChild(bb); sel.appendChild(d.createTextNode('. Va incluido en su solicitud de cita.')); muestraFoto(a[2]) }
      else sel.textContent='Toque un aroma para agregarlo a su cita.';
      cotiza();
    });
    chips.appendChild(b);
  });
  var fotos=d.querySelectorAll('#carrusel img'), fi=0, tc;
  function muestraFoto(n){ fotos[fi].classList.remove('on'); fi=n%fotos.length; fotos[fi].classList.add('on'); clearInterval(tc); tc=setInterval(function(){ muestraFoto(fi+1) },4200) }
  if(!QUIETO) tc=setInterval(function(){ muestraFoto(fi+1) },4200);

  /* ===== cotizador ===== */
  function eleccion(){
    var v=(d.querySelector('input[name="veh"]:checked')||{}).value||'sedan';
    var p=(d.querySelector('input[name="paq"]:checked')||{}).value||'premium';
    var xs=Array.prototype.map.call(cajaEx.querySelectorAll('input:checked'),function(i){ return EXTRAS.filter(function(x){return x.k===i.value})[0] });
    var lineas=[], total=0, desde=false;
    if(p!=='ninguno'){ var pr=PAQ[p][v]; lineas.push([PAQ[p].n+(v==='sedan'?' · sedán':' · SUV/pick up'),pr]); total+=pr }
    xs.forEach(function(x){ var pr=(x.conPaq&&p!=='ninguno')?x.conPaq:x.p; if(x.desde) desde=true; lineas.push([x.n+(x.desde?' (desde)':''),pr]); total+=pr });
    return {v:v,p:p,xs:xs,lineas:lineas,total:total,desde:desde};
  }
  function cotiza(){
    var e=eleccion(), ul=$('lineas'); ul.textContent='';
    if(e.v!==veh){ veh=e.v; return pintaPaquetes() }
    if(!e.lineas.length){ var li=d.createElement('li'); li.textContent='Elija un paquete o un adicional'; ul.appendChild(li) }
    e.lineas.forEach(function(l){ var li=d.createElement('li'), a=d.createElement('span'), b=d.createElement('span'); a.textContent=l[0]; b.textContent=col(l[1]); li.appendChild(a); li.appendChild(b); ul.appendChild(li) });
    if(aroma){ var li2=d.createElement('li'), a2=d.createElement('span'), b2=d.createElement('span'); a2.textContent='Aromatizante: '+aroma; b2.textContent='a consultar'; li2.appendChild(a2); li2.appendChild(b2); ul.appendChild(li2) }
    var tb=$('total'); tb.textContent=''; if(e.desde){ var sm=d.createElement('small'); sm.textContent='desde'; tb.appendChild(sm) } tb.appendChild(d.createTextNode(col(e.total)));
  }
  $('form').addEventListener('change',cotiza);
  $('form').addEventListener('input',function(e){ if(e.target.removeAttribute) e.target.removeAttribute('aria-invalid') });
  $('form').addEventListener('submit',function(e){ e.preventDefault() });
  var hoy=new Date(), iso=function(x){ return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0') };
  $('fFecha').min=iso(hoy);

  var abierto=Date.now(), ultimo=0;
  function estado(t,mal){ var s=$('estado'); s.textContent=t; s.className='estado '+(mal?'mal':'bien') }
  $('enviar').addEventListener('click',function(){
    if($('fWeb').value) return;
    if(Date.now()-abierto<3000){ estado('Muy rápido. Revise los datos y vuelva a intentar.',true); return }
    if(Date.now()-ultimo<30000){ estado('Ya abrimos WhatsApp. Espere unos segundos para enviar otra vez.',true); return }
    var e=eleccion(), mal=[];
    var nombre=limpiar($('fNombre').value,80), tel=limpiar($('fTel').value,16), lugar=limpiar($('fLugar').value,120), carro=limpiar($('fVeh').value,60), nota=limpiar($('fNota').value,400), hora=limpiar($('fHora').value,40), fecha=$('fFecha').value;
    var okN=/^[\p{L}\p{M} .'’-]{3,80}$/u.test(nombre); $('fNombre').setAttribute('aria-invalid',String(!okN)); if(!okN) mal.push('su nombre');
    var t=tel.replace(/[^\d+]/g,'').replace(/^\+?506/,''), okT=/^[2-8]\d{7}$/.test(t); $('fTel').setAttribute('aria-invalid',String(!okT)); if(!okT) mal.push('un teléfono de 8 dígitos');
    var okL=lugar.length>=4; $('fLugar').setAttribute('aria-invalid',String(!okL)); if(!okL) mal.push('la dirección o zona');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) fecha='';
    if(!e.lineas.length) mal.push('un paquete o adicional');
    if(!$('okTerminos').checked) mal.push('aceptar los términos');
    if(!$('okDatos').checked) mal.push('autorizar el uso de sus datos');
    if(mal.length){ estado('Falta: '+mal.join(', ')+'.',true); return }
    var f=fecha?fecha.split('-').reverse().join('/'):'La que tengan disponible';
    var msg='Hola Monzú Detallados, quiero agendar un detallado.\n\n*Nombre:* '+nombre+'\n*Teléfono:* '+tel+'\n*Vehículo:* '+(e.v==='sedan'?'Sedán':'SUV / Pick up / XL')+(carro?' ('+carro+')':'')+
      '\n*Servicios:*\n'+e.lineas.map(function(l){ return '• '+l[0]+' — '+col(l[1]) }).join('\n')+
      (aroma?'\n*Aromatizante:* '+aroma:'')+
      '\n*Total estimado:* '+(e.desde?'desde ':'')+col(e.total)+' (sin domicilio)'+
      '\n*Fecha:* '+f+'\n*Hora:* '+(hora||'La que tengan libre')+'\n*Lugar:* '+lugar+(nota?'\n*Comentario:* '+nota:'')+
      '\n\nAcepté los términos y autoricé el uso de mis datos para esta cita.';
    ultimo=Date.now();
    var url='https://wa.me/'+WA+'?text='+encodeURIComponent(msg);
    var w=window.open(url,'_blank'); if(w) w.opener=null; else location.assign(url);
    estado('Listo: se abrió WhatsApp con su solicitud. Solo toque Enviar.',false);
  });

  /* ===== proceso: la línea avanza al bajar ===== */
  var pasos=$('pasos'), ps=pasos.querySelectorAll('.paso');
  function proceso(){
    var r=pasos.getBoundingClientRect(), vh=innerHeight, p=Math.min(1,Math.max(0,(vh*.8-r.top)/(r.height+vh*.3)));
    pasos.style.setProperty('--p',p.toFixed(3));
    ps.forEach(function(x,i){ x.classList.toggle('on',p>=i/ps.length+.04) });
  }
  addEventListener('scroll',function(){ nav.classList.toggle('chica',scrollY>30); requestAnimationFrame(proceso) },{passive:true});
  proceso();

  /* ===== visor de fotos ===== */
  var visor=$('visor');
  d.querySelectorAll('.obra').forEach(function(o){ o.addEventListener('click',function(){ var i=o.querySelector('img'); $('visorImg').src=i.src; $('visorImg').alt=i.alt; $('visorTxt').textContent=o.dataset.titulo; visor.showModal() }) });
  $('visorX').addEventListener('click',function(){ visor.close() });
  visor.addEventListener('click',function(e){ if(e.target===visor) visor.close() });

  /* ===== documentos legales ===== */
  function abrir(c){ var x=$('dlg-'+c); if(x&&x.showModal){ x.showModal(); x.scrollTop=0 } }
  d.querySelectorAll('[data-legal]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); abrir(b.dataset.legal) }) });
  d.querySelectorAll('dialog.legal').forEach(function(x){ x.querySelector('[data-cerrar]').addEventListener('click',function(){ x.close() }); x.addEventListener('click',function(e){ if(e.target===x) x.close() }) });
  var h=location.hash.replace('#',''); if(['terminos','privacidad','cookies'].indexOf(h)>-1) abrir(h);

  pintaPaquetes();
})();
