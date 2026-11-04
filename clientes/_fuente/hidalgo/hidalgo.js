(function(){
  'use strict';
  var d=document, $=function(i){return d.getElementById(i)};
  var QUIETO=matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.documentElement.classList.add('js');
  $('anio').textContent=String(new Date().getFullYear());
  var WA='50688381397';
  function limpiar(t,max){
    var s=String(t==null?'':t).normalize('NFKC'), o='';
    for(var i=0;i<s.length;i++){ var c=s.charCodeAt(i);
      if(c<32||(c>=127&&c<160)||(c>=0x200B&&c<=0x200F)||(c>=0x2028&&c<=0x202E)||(c>=0x2060&&c<=0x2069)||c===0xFEFF||c===60||c===62) continue; o+=s[i]; }
    return o.replace(/\s{2,}/g,' ').trim().slice(0,max);
  }
  /* menú */
  var nav=$('nav');
  $('menuBtn').addEventListener('click',function(){ var a=nav.classList.toggle('abre'); this.setAttribute('aria-expanded',String(a)) });
  d.querySelectorAll('#links a').forEach(function(a){ a.addEventListener('click',function(){ nav.classList.remove('abre') }) });
  /* hora de Costa Rica */
  try{ var h=parseInt(new Intl.DateTimeFormat('en-US',{timeZone:'America/Costa_Rica',hour:'numeric',hour12:false}).format(new Date()),10)%24;
    $('relojTxt').textContent=(h>=19||h<6)?'De noche también salimos · 24/7':'Disponibles ahora · 24/7'; }catch(e){}
  /* aparición y portada */
  var hero=d.querySelector('.hero'); setTimeout(function(){ hero.classList.add('listo') },80);
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target) } }) },{threshold:.12});
  d.querySelectorAll('.rv').forEach(function(el,i){ el.style.transitionDelay=(i%3)*80+'ms'; io.observe(el) });
  var ioC=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; ioC.unobserve(e.target);
    var el=e.target, fin=+el.dataset.n, t0=null; (function paso(t){ if(t0===null) t0=t; var k=Math.min(1,(t-t0)/1300); el.textContent=String(Math.round(fin*(1-Math.pow(1-k,3)))); if(k<1) requestAnimationFrame(paso) })(performance.now()) }) },{threshold:.6});
  if(!QUIETO) d.querySelectorAll('[data-n]').forEach(function(el){ el.textContent='0'; ioC.observe(el) });
  addEventListener('scroll',function(){ var y=scrollY; nav.classList.toggle('chica',y>30); if(!QUIETO&&y<innerHeight*1.2) hero.style.setProperty('--sy',y.toFixed(0)) },{passive:true});

  /* solicitud */
  var VEH=['Cabezal','Cabezal con carreta','Vagoneta','Furgón','Cisterna','Bus','Camión liviano','Otro'];
  var SRV=['Traslado','Rescate / salido de vía','Underlift','Grúa telescópica'];
  function chips(id,nombre,lista){ var c=$(id); lista.forEach(function(v,i){ var l=d.createElement('label'); l.className='chip'; var inp=d.createElement('input'); inp.type='radio'; inp.name=nombre; inp.value=v; if(!i) inp.checked=true; var s=d.createElement('span'); s.textContent=v; l.appendChild(inp); l.appendChild(s); c.appendChild(l) }) }
  chips('cVeh','veh',VEH); chips('cSrv','srv',SRV);
  function val(n){ var r=d.querySelector('input[name="'+n+'"]:checked'); return r?r.value:'' }
  function datos(){ return {veh:val('veh'),srv:val('srv'),o:limpiar($('fOrigen').value,120),de:limpiar($('fDestino').value,120),n:limpiar($('fNombre').value,80),t:limpiar($('fTel').value,16),nota:limpiar($('fNota').value,500),urg:$('fUrg').checked} }
  function mensaje(x){ return (x.urg?'🚨 URGENTE · ':'')+'Hola Grúas Hidalgo, necesito una grúa.\n\n*Vehículo:* '+x.veh+'\n*Servicio:* '+x.srv+'\n*Dónde está:* '+(x.o||'—')+'\n*Destino:* '+(x.de||'—')+'\n*Nombre:* '+(x.n||'—')+'\n*Teléfono:* '+(x.t||'—')+(x.nota?'\n*Detalles:* '+x.nota:'')+'\n\nAcepté los términos y autoricé el uso de mis datos para esta solicitud.' }
  function prev(){ $('prev').textContent=mensaje(datos()) }
  $('form').addEventListener('input',function(e){ if(e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); prev() });
  $('form').addEventListener('change',prev); prev();
  var abierto=Date.now(), ultimo=0;
  function estado(t,m){ var s=$('estado'); s.textContent=t; s.className='estado '+(m?'mal':'bien') }
  $('enviar').addEventListener('click',function(){
    if($('fWeb').value) return;
    if(Date.now()-abierto<3000){ estado('Muy rápido. Revise los datos.',true); return }
    if(Date.now()-ultimo<30000){ estado('Ya abrimos WhatsApp. Espere unos segundos.',true); return }
    var x=datos(), mal=[];
    var okO=x.o.length>=4; $('fOrigen').setAttribute('aria-invalid',String(!okO)); if(!okO) mal.push('dónde está el vehículo');
    var okN=/^[\p{L}\p{M} .'’-]{3,80}$/u.test(x.n); $('fNombre').setAttribute('aria-invalid',String(!okN)); if(!okN) mal.push('su nombre');
    var tt=x.t.replace(/[^\d+]/g,'').replace(/^\+?506/,''), okT=/^[2-8]\d{7}$/.test(tt); $('fTel').setAttribute('aria-invalid',String(!okT)); if(!okT) mal.push('un teléfono de 8 dígitos');
    if(!$('okT').checked) mal.push('aceptar los términos'); if(!$('okD').checked) mal.push('autorizar el uso de sus datos');
    if(mal.length){ estado('Falta: '+mal.join(', ')+'.',true); return }
    ultimo=Date.now();
    var url='https://wa.me/'+WA+'?text='+encodeURIComponent(mensaje(x));
    var w=window.open(url,'_blank'); if(w) w.opener=null; else location.assign(url);
    estado('Listo: se abrió WhatsApp con su solicitud. Solo toque Enviar.',false);
  });

  /* cobertura */
  var PROVS=['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'], pc=$('provs');
  PROVS.forEach(function(p){ var b=d.createElement('button'); b.type='button'; b.textContent=p; b.dataset.p=p; b.setAttribute('aria-pressed','false');
    b.addEventListener('click',function(){ pc.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)) });
      $('fOrigen').value=p+', '; prev(); $('solicitar').scrollIntoView({behavior:QUIETO?'auto':'smooth'}); setTimeout(function(){ $('fOrigen').focus() },QUIETO?0:600) });
    pc.appendChild(b) });
  /* grúa recorriendo el mapa con el scroll */
  (function(){
    var cob=$('cobertura'), mapa=$('mapa'), base=$('rutaBase'), hecha=$('rutaHecha'), grua=$('grua'), gc=$('gruaC');
    if(!mapa||!base.getTotalLength) return;
    var WP=mapa.dataset.wp.split(';').map(function(s){ var a=s.split(','); return [+a[0],+a[1]] });
    var ORDEN=Array.prototype.map.call(mapa.querySelectorAll('.lbl'),function(x){ return x.dataset.p });
    // curva suave (Catmull-Rom) por los puntos
    var dd='M'+WP[0][0]+' '+WP[0][1];
    for(var i=0;i<WP.length-1;i++){ var p0=WP[i-1]||WP[i], p1=WP[i], p2=WP[i+1], p3=WP[i+2]||p2;
      dd+=' C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+' '+p2[0]+' '+p2[1] }
    base.setAttribute('d',dd); hecha.setAttribute('d',dd);
    var L=base.getTotalLength(), WL=[];
    WP.forEach(function(w){ var mejor=0,dm=1e9; for(var l=0;l<=L;l+=2){ var q=base.getPointAtLength(l), dx=q.x-w[0], dy=q.y-w[1], dist=dx*dx+dy*dy; if(dist<dm){dm=dist;mejor=l} } WL.push(mejor) });
    WL[0]=0; WL[WL.length-1]=L;
    hecha.style.strokeDasharray=L+' '+L;
    var provs=mapa.querySelectorAll('.prov'), lbls=mapa.querySelectorAll('.lbl'), pins=mapa.querySelectorAll('.pin'), btns=pc.querySelectorAll('button');
    var dir=1, ultimoN=-1, mq=matchMedia('(max-width:860px)');
    function pintar(l){
      var p=l/L, a=base.getPointAtLength(Math.max(0,l-3)), b=base.getPointAtLength(Math.min(L,l+3)), pt=base.getPointAtLength(l);
      var dx=b.x-a.x, dy=b.y-a.y; if(Math.abs(dx)>.3) dir=dx<0?-1:1;
      var ang=Math.max(-20,Math.min(20,Math.atan2(dy,Math.abs(dx)||.001)*180/Math.PI));
      grua.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')');
      var e=mq.matches?1.7:1.25; gc.setAttribute('transform','scale('+(e*dir)+' '+e+') rotate('+ang.toFixed(1)+')');
      hecha.style.strokeDashoffset=String(L-l);
      var n=0; WL.forEach(function(w,i){ if(l>=w-4) n=i });
      $('cobBarra').style.setProperty('--p',p.toFixed(3));
      if(n===ultimoN) return; ultimoN=n;
      var actual=ORDEN[n];
      provs.forEach(function(x){ var k=ORDEN.indexOf(x.dataset.p); x.classList.toggle('on',k===n); x.classList.toggle('hecha',k<n) });
      lbls.forEach(function(x,k){ x.classList.toggle('on',k===n); x.classList.toggle('hecha',k<n) });
      pins.forEach(function(x,k){ x.classList.toggle('hecha',k<=n) });
      btns.forEach(function(x){ x.classList.toggle('hecha',ORDEN.indexOf(x.dataset.p)<=n) });
      $('cobProv').textContent=actual; $('cobN').textContent=(n+1)+'/'+ORDEN.length;
    }
    if(QUIETO){ pintar(L); return }
    cob.classList.add('anim');
    var pend=false;
    function calc(){ pend=false; var r=cob.getBoundingClientRect(), tot=cob.offsetHeight-innerHeight;
      var p=tot>0?Math.min(1,Math.max(0,-r.top/tot)):1; p=Math.min(1,Math.max(0,(p-.04)/.9));
      var s=p*(WL.length-1), i=Math.min(WL.length-2,Math.floor(s)), f=Math.min(1,Math.max(0,(s-i-.18)/.64)); f=f*f*(3-2*f);
      pintar(WL[i]+(WL[i+1]-WL[i])*f) }
    addEventListener('scroll',function(){ if(!pend){ pend=true; requestAnimationFrame(calc) } },{passive:true});
    addEventListener('resize',calc); calc();
  })();

  /* visor */
  var fotos=Array.prototype.slice.call(d.querySelectorAll('.foto')), vi=0, visor=$('visor');
  function ver(n){ vi=(n+fotos.length)%fotos.length; var im=fotos[vi].querySelector('img'); $('vimg').src=im.src; $('vimg').alt=im.alt; $('vtxt').textContent=fotos[vi].dataset.t }
  fotos.forEach(function(f,i){ f.addEventListener('click',function(){ ver(i); visor.showModal() }) });
  $('va').addEventListener('click',function(){ ver(vi-1) }); $('vs').addEventListener('click',function(){ ver(vi+1) }); $('vx').addEventListener('click',function(){ visor.close() });
  visor.addEventListener('click',function(e){ if(e.target===visor) visor.close() });
  visor.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft') ver(vi-1); if(e.key==='ArrowRight') ver(vi+1) });

  /* legales */
  function abrir(c){ var x=$('dlg-'+c); if(x&&x.showModal){ x.showModal(); x.scrollTop=0 } }
  d.querySelectorAll('[data-legal]').forEach(function(b){ b.addEventListener('click',function(e){ e.preventDefault(); abrir(b.dataset.legal) }) });
  d.querySelectorAll('dialog.legal').forEach(function(x){ x.querySelector('[data-cerrar]').addEventListener('click',function(){ x.close() }); x.addEventListener('click',function(e){ if(e.target===x) x.close() }) });
/*__PROFORMA__*/
  if(location.hash==='#proformas') setTimeout(function(){ d.querySelector('[data-legal="proformas"]').click() },50);
})();
