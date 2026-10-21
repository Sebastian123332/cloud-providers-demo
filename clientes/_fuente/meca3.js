(function(){
  'use strict';
  var doc=document, $=function(id){return doc.getElementById(id)}, todos=function(sel,raiz){return Array.prototype.slice.call((raiz||doc).querySelectorAll(sel))};
  var QUIETO=matchMedia('(prefers-reduced-motion: reduce)').matches, FINO=matchMedia('(pointer: fine)').matches;
  var raiz=doc.documentElement; raiz.classList.add('js');
  $('anio').textContent=String(new Date().getFullYear());
  function clamp(v,a,b){ return v<a?a:(v>b?b:v) }
  function tramo(p,a,b){ return clamp((p-a)/(b-a),0,1) }
  var hero=doc.querySelector('.hero');
  setTimeout(function(){ hero.classList.add('listo') }, QUIETO?0:1050);

  /* ===== ¿Está abierto el taller? (hora de Costa Rica) ===== */
  (function(){
    var caja=$('abierto'), txt=$('abiertoTxt');
    try{
      var partes=new Intl.DateTimeFormat('en-US',{timeZone:'America/Costa_Rica',weekday:'short',hour:'numeric',hour12:false}).formatToParts(new Date());
      var dia='', hora=0;
      partes.forEach(function(p){ if(p.type==='weekday') dia=p.value; if(p.type==='hour') hora=parseInt(p.value,10)%24 });
      var abre=dia!=='Sun' && hora>=8 && hora<18;
      if(abre){ txt.textContent='Abierto ahora · hasta las 6:00 p. m.' }
      else { caja.classList.add('cerrado'); txt.textContent=(dia==='Sat'&&hora>=18)||dia==='Sun' ? 'Cerrado · abre el lunes 8:00 a. m.' : 'Cerrado · abre a las 8:00 a. m.' }
    }catch(e){}
  })();

  /* ===== Menú ===== */
  var nav=$('nav'), menuBtn=$('menuBtn');
  function menu(abrir){ nav.classList.toggle('abierto',abrir); menuBtn.setAttribute('aria-expanded',String(abrir)); menuBtn.setAttribute('aria-label',abrir?'Cerrar menú':'Abrir menú') }
  menuBtn.addEventListener('click',function(){ menu(!nav.classList.contains('abierto')) });
  todos('#links a').forEach(function(a){ a.addEventListener('click',function(){ menu(false) }) });
  addEventListener('keydown',function(e){ if(e.key==='Escape') menu(false) });

  /* ===== Chispas de soldadura en un canvas ===== */
  function Chispero(canvas){
    var ctx=canvas.getContext('2d'), ps=[], w=0, h=0;
    function medir(){ var r=canvas.getBoundingClientRect(), dpr=Math.min(2,devicePixelRatio||1); w=r.width; h=r.height; canvas.width=Math.max(1,Math.round(w*dpr)); canvas.height=Math.max(1,Math.round(h*dpr)); ctx.setTransform(dpr,0,0,dpr,0,0) }
    medir(); addEventListener('resize',medir);
    return {
      caja:function(){ return canvas.getBoundingClientRect() },
      soltar:function(x,y,n,fuerza){
        for(var i=0;i<n;i++){
          var a=-Math.PI/2+(Math.random()-.5)*Math.PI*1.5, v=(1.2+Math.random()*4.8)*(fuerza||1);
          ps.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vida:1,baja:.014+Math.random()*.03});
        }
        if(ps.length>500) ps.splice(0,ps.length-500);
      },
      pintar:function(){
        ctx.clearRect(0,0,w,h);
        if(!ps.length) return;
        ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
        for(var i=ps.length-1;i>=0;i--){
          var p=ps[i], x0=p.x, y0=p.y;
          p.vy+=.2; p.vx*=.985; p.x+=p.vx; p.y+=p.vy; p.vida-=p.baja;
          if(p.vida<=0 || p.y>h+30){ ps.splice(i,1); continue }
          ctx.strokeStyle='rgba(255,'+Math.round(150+p.vida*105)+','+Math.round(50+p.vida*170)+','+p.vida.toFixed(2)+')';
          ctx.lineWidth=.8+p.vida*1.8; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(p.x,p.y); ctx.stroke();
        }
        ctx.globalCompositeOperation='source-over';
      }
    };
  }
  var chHero=QUIETO?null:Chispero($('chispasHero'));
  var chCam=QUIETO?null:Chispero($('chispasCamion'));

  /* ===== Portada: luz, 3D y chispas que siguen el cursor ===== */
  var mx=0,my=0,tx=0,ty=0,gx=innerWidth*.6,gy=innerHeight*.4,ugx=gx,ugy=gy;
  if(!QUIETO){
    hero.addEventListener('pointermove',function(e){
      var r=hero.getBoundingClientRect();
      tx=e.clientX/innerWidth-.5; ty=e.clientY/innerHeight-.5; ugx=e.clientX-r.left; ugy=e.clientY-r.top;
      if(e.pointerType==='mouse'){ var c=chHero.caja(); chHero.soltar(e.clientX-c.left,e.clientY-c.top,2,.7) }
    },{passive:true});
    hero.addEventListener('pointerdown',function(e){ var c=chHero.caja(); chHero.soltar(e.clientX-c.left,e.clientY-c.top,34,1.3) },{passive:true});
  }

  /* Botones con imán */
  if(FINO && !QUIETO) todos('.iman').forEach(function(b){
    b.addEventListener('pointermove',function(e){ var r=b.getBoundingClientRect(); b.style.setProperty('--bx',((e.clientX-r.left-r.width/2)*.25).toFixed(1)+'px'); b.style.setProperty('--by',((e.clientY-r.top-r.height/2)*.35).toFixed(1)+'px') });
    b.addEventListener('pointerleave',function(){ b.style.setProperty('--bx','0px'); b.style.setProperty('--by','0px') });
  });

  /* Luz que sigue el cursor en tarjetas */
  todos('.foco').forEach(function(el){
    el.addEventListener('pointermove',function(e){ var r=el.getBoundingClientRect(); el.style.setProperty('--x',(e.clientX-r.left)+'px'); el.style.setProperty('--y',(e.clientY-r.top)+'px') },{passive:true});
  });

  /* Cifras que cuentan */
  var ioCuenta=new IntersectionObserver(function(es){ es.forEach(function(e){
    if(!e.isIntersecting) return; ioCuenta.unobserve(e.target);
    var el=e.target, fin=parseInt(el.getAttribute('data-contar'),10), t0=null;
    function paso(t){ if(t0===null) t0=t; var k=Math.min(1,(t-t0)/1600), s=1-Math.pow(1-k,3); el.textContent=String(Math.round(fin*s)); if(k<1) requestAnimationFrame(paso) }
    requestAnimationFrame(paso);
  }) },{threshold:.6});
  if(!QUIETO) todos('[data-contar]').forEach(function(el){ el.textContent='0'; ioCuenta.observe(el) });

  /* Aparición al bajar */
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target) } }) },{threshold:.14,rootMargin:'0px 0px -6% 0px'});
  todos('.rv').forEach(function(el,i){ el.style.transitionDelay=((i%3)*90)+'ms'; io.observe(el) });

  /* La cita se enciende palabra por palabra */
  var cita=$('cita'), palabras=[];
  (function(){
    var texto=cita.textContent, frag=doc.createDocumentFragment();
    texto.split(/(\s+)/).forEach(function(t){
      if(!t) return;
      if(/^\s+$/.test(t)){ frag.appendChild(doc.createTextNode(t)); return }
      var s=doc.createElement('span'); s.className='w'; s.textContent=t;
      if(/manos|compromiso|Taras/.test(t)) s.classList.add('acento');
      palabras.push(s); frag.appendChild(s);
    });
    cita.textContent=''; cita.appendChild(frag);
  })();

  /* ===== Camión que se arma y se suelda ===== */
  var proceso=$('proceso'), escena=$('escena'), svg=$('camionSvg'), wire=$('wire'), pint=$('pint');
  var barrido=$('barridoRect'), scan=$('scan'), soplete=$('soplete');
  var copia=wire.cloneNode(true); copia.removeAttribute('id'); copia.setAttribute('class','copia'); pint.appendChild(copia);
  var piezas=todos('[data-t]',wire).map(function(el){ return {el:el,t:parseFloat(el.getAttribute('data-t'))} });
  var costuras=todos('#costuras path').map(function(el){ var L=el.getTotalLength(); el.style.strokeDasharray=L+' '+L; el.style.strokeDashoffset=String(L); return {el:el,a:parseFloat(el.getAttribute('data-a')),b:parseFloat(el.getAttribute('data-b')),L:L} });
  var estaciones=todos('.estacion'), CORTES=[0,.23,.37,.56,.85], estAntes=-1, punta=null;
  var VB={x:120,w:1010};
  function progreso(sec){ var r=sec.getBoundingClientRect(); return clamp(-r.top/Math.max(1,r.height-innerHeight),0,1) }
  function camion(){
    var p=QUIETO?1:progreso(proceso);
    piezas.forEach(function(z){ z.el.classList.toggle('on',p>=z.t) });
    var activa=null;
    costuras.forEach(function(c){
      var k=tramo(p,c.a,c.b);
      c.el.style.strokeDashoffset=String(c.L*(1-k));
      c.el.classList.toggle('fria',p>c.b+.03);
      if(k>0 && k<1) activa={c:c,k:k};
    });
    if(activa && !QUIETO){
      var pt=activa.c.el.getPointAtLength(activa.c.L*activa.k);
      soplete.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')');
      soplete.classList.add('on'); punta=pt;
    } else { soplete.classList.remove('on'); punta=null }
    var kp=tramo(p,.86,.97), borde=VB.x+VB.w*kp;
    barrido.setAttribute('x',String(VB.x-200)); barrido.setAttribute('width',(VB.w*kp+200*(kp>0?1:0)).toFixed(1));
    scan.setAttribute('x',(borde-1.5).toFixed(1)); scan.classList.toggle('on',kp>0 && kp<1);
    var listo=p>=.97; escena.classList.toggle('listo',listo);
    $('okTxt').textContent=listo?'Listo para trabajar':(activa?'Soldando':(kp>0?'Pintando':'Armando'));
    var est=0; for(var i=0;i<CORTES.length;i++) if(p>=CORTES[i]) est=i;
    if(est!==estAntes){ estaciones.forEach(function(e,j){ e.classList.toggle('activa',j===est) }); $('estNum').textContent='0'+(est+1); estAntes=est }
    $('avance').textContent=Math.round(p*100)+'%';
    $('regla').style.transform='scaleX('+p.toFixed(4)+')';
  }

  /* ===== Galería horizontal ===== */
  var taller=$('taller'), pista=$('pista'), paneles=todos('.panel img',pista);
  function galeria(){
    if(QUIETO) return;
    var p=progreso(taller), max=Math.max(0,pista.scrollWidth-innerWidth);
    pista.style.transform='translate3d('+(-max*p).toFixed(1)+'px,0,0)';
    $('galBarra').style.transform='scaleX('+p.toFixed(4)+')';
    paneles.forEach(function(img){ var r=img.parentNode.getBoundingClientRect(), c=(r.left+r.width/2-innerWidth/2)/innerWidth; img.style.setProperty('--px',(c*-60).toFixed(1)+'px') });
  }

  /* ===== Bucle principal ===== */
  var cintas=$('cintas'), ultimoY=scrollY, sk=0;
  function cuadro(){
    var y=scrollY;
    nav.classList.toggle('chico',y>40);
    if(y<innerHeight*1.1){
      mx+=(tx-mx)*.08; my+=(ty-my)*.08; gx+=(ugx-gx)*.1; gy+=(ugy-gy)*.1;
      hero.style.setProperty('--mx',mx.toFixed(4)); hero.style.setProperty('--my',my.toFixed(4));
      hero.style.setProperty('--rx',(my*-9).toFixed(2)+'deg'); hero.style.setProperty('--ry',(mx*12).toFixed(2)+'deg');
      hero.style.setProperty('--gx',gx.toFixed(0)+'px'); hero.style.setProperty('--gy',gy.toFixed(0)+'px');
    }
    if(chHero) chHero.pintar();
    var v=y-ultimoY; ultimoY=y; sk+=(clamp(v*.25,-10,10)-sk)*.12; cintas.style.setProperty('--sk',sk.toFixed(2));
    var rc=cita.getBoundingClientRect(), kc=clamp((innerHeight*.85-rc.top)/(rc.height+innerHeight*.35),0,1), on=Math.round(kc*palabras.length);
    for(var i=0;i<palabras.length;i++) palabras[i].classList.toggle('on',i<on);
    var rp=proceso.getBoundingClientRect();
    if(rp.bottom>-50 && rp.top<innerHeight+50){
      camion();
      if(chCam && punta){
        var m=svg.getScreenCTM(), c=chCam.caja();
        if(m) chCam.soltar(m.a*punta.x+m.c*punta.y+m.e-c.left, m.b*punta.x+m.d*punta.y+m.f-c.top, 4, 1);
      }
    }
    if(chCam) chCam.pintar();
    var rt=taller.getBoundingClientRect();
    if(rt.bottom>0 && rt.top<innerHeight) galeria();
    requestAnimationFrame(cuadro);
  }
  if(QUIETO){ camion(); for(var q=0;q<palabras.length;q++) palabras[q].classList.add('on') }
  requestAnimationFrame(cuadro);

  /* ===== Fotos de clientes en la portada ===== */
  var diapos=todos('.tarjeta img'), puntos=todos('.puntos i'), marca=$('fotoMarca'), actual=0;
  function diapo(n){
    diapos[actual].classList.remove('activa'); puntos[actual].classList.remove('on');
    actual=n%diapos.length;
    diapos[actual].classList.add('activa');
    void puntos[actual].offsetWidth; puntos[actual].classList.add('on');
    marca.textContent=diapos[actual].getAttribute('data-marca');
  }
  if(!QUIETO && diapos.length>1) setInterval(function(){ if(!doc.hidden) diapo(actual+1) },5000);

  /* ===== Visor de trabajos ===== */
  var visor=$('visor'), vImg=$('visorImg'), vTxt=$('visorTxt'), obras=todos('.obra'), vi=0;
  function verObra(n){
    vi=(n+obras.length)%obras.length;
    var img=obras[vi].querySelector('img');
    vImg.src=img.currentSrc||img.src; vImg.alt=img.alt;
    vTxt.textContent=obras[vi].getAttribute('data-titulo');
  }
  obras.forEach(function(o,n){ o.addEventListener('click',function(){ verObra(n); if(visor.showModal) visor.showModal() }) });
  $('visorAnt').addEventListener('click',function(){ verObra(vi-1) });
  $('visorSig').addEventListener('click',function(){ verObra(vi+1) });
  $('visorCerrar').addEventListener('click',function(){ visor.close() });
  visor.addEventListener('click',function(e){ if(e.target===visor) visor.close() });
  visor.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft') verObra(vi-1); if(e.key==='ArrowRight') verObra(vi+1) });
  var tx0=null;
  visor.addEventListener('touchstart',function(e){ tx0=e.touches[0].clientX },{passive:true});
  visor.addEventListener('touchend',function(e){ if(tx0===null) return; var d=e.changedTouches[0].clientX-tx0; if(Math.abs(d)>50) verObra(vi+(d<0?1:-1)); tx0=null },{passive:true});

  /* ===== Documentos legales ===== */
  function abrir(cual){ var d=$('dlg-'+cual); if(d && d.showModal){ d.showModal(); d.scrollTop=0 } }
  todos('[data-legal]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); abrir(b.getAttribute('data-legal')) }) });
  todos('dialog.legal').forEach(function(d){
    d.querySelector('[data-cerrar]').addEventListener('click',function(){ d.close() });
    d.addEventListener('click',function(e){ if(e.target===d) d.close() });
  });
  var h=location.hash.replace('#','');
  if(['terminos','privacidad','cookies'].indexOf(h)>-1) abrir(h);
})();
