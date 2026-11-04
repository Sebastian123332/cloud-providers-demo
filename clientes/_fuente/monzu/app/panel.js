(function(){
  'use strict';
  var d=document, $=function(i){ return d.getElementById(i) };
  var GUARDA='monzu-panel', clave='', datos=null, filtro='hoy', vistos=null, tPoll=null, stream=null, rafId=0;
  var NS='http://www.w3.org/2000/svg';
  function svg(paths){ var s=d.createElementNS(NS,'svg'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('fill','none'); s.setAttribute('stroke','currentColor'); s.setAttribute('stroke-width','2.4'); s.setAttribute('stroke-linecap','round'); s.setAttribute('stroke-linejoin','round'); s.setAttribute('aria-hidden','true');
    paths.forEach(function(p){ var e=d.createElementNS(NS,'path'); e.setAttribute('d',p); s.appendChild(e) }); return s }
  var I={ok:['M20 6 9 17l-5-5'],regalo:['M20 12v9H4v-9','M2 7h20v5H2z','M12 21V7','M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z','M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z'],x:['M18 6 6 18M6 6l12 12'],wa:['M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.2A8.4 8.4 0 1 1 21 11.5z'],gota:['M12 2.5C9.4 5.6 5.5 10.9 5.5 14.5a6.5 6.5 0 0 0 13 0c0-3.6-3.9-8.9-6.5-12z']};

  /* ---------- utilidades ---------- */
  function col(n){ return '₡'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.') }
  function fmtH(h){ var p=h.split(':'), n=+p[0]; return (n>12?n-12:n)+':'+p[1]+(n<12?' a. m.':' p. m.') }
  function sumaDias(f,n){ var x=new Date(f+'T12:00:00Z'); x.setUTCDate(x.getUTCDate()+n); return x.toISOString().slice(0,10) }
  function fmtDia(f){ if(!datos) return f; if(f===datos.hoy) return 'Hoy'; if(f===sumaDias(datos.hoy,1)) return 'Mañana'; if(f===sumaDias(datos.hoy,-1)) return 'Ayer';
    var x=new Date(f+'T12:00:00'); var s=x.toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long'}); return s.charAt(0).toUpperCase()+s.slice(1) }
  function el(tag,cls,txt){ var e=d.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e }
  function boton(txt,cls,fn,ico){ var b=el('button','btn '+cls); b.type='button'; if(ico) b.appendChild(svg(I[ico])); b.appendChild(d.createTextNode(txt)); b.addEventListener('click',fn); return b }
  function mini(s,meta){ var m=el('div','mini'), sp=el('span'); for(var i=0;i<meta;i++){ var x=el('i'); if(i<s) x.className='on'; sp.appendChild(x) } m.appendChild(sp); m.appendChild(d.createTextNode(Math.min(s,meta)+'/'+meta+' sellos')); return m }
  function toast(t,mal){ var e=$('toast'); e.textContent=t; e.className='toast on'+(mal?' mal':''); clearTimeout(toast.t); toast.t=setTimeout(function(){ e.className='toast'+(mal?' mal':'') },3000) }
  function enlaceTarjeta(tk){ return location.origin+'/tarjeta.html?t='+encodeURIComponent(tk) }
  function abrirWA(tel,txt){ var url='https://wa.me/506'+tel+'?text='+encodeURIComponent(txt); var w=window.open(url,'_blank'); if(w) w.opener=null; else location.assign(url) }

  /* ---------- API ---------- */
  function api(ruta,cuerpo){
    var op={headers:{authorization:'Bearer '+clave,accept:'application/json'},cache:'no-store'};
    if(cuerpo){ op.method='POST'; op.headers['content-type']='application/json'; op.body=JSON.stringify(cuerpo) }
    return fetch('/api/panel/'+ruta,op).then(function(r){ return r.json().catch(function(){ return {ok:false,error:'Respuesta inválida del servidor.'} }).then(function(j){ j.status=r.status; return j }) });
  }

  /* ---------- entrar / salir ---------- */
  try{ clave=localStorage.getItem(GUARDA)||sessionStorage.getItem(GUARDA)||'' }catch(e){}
  $('login').addEventListener('submit',function(e){
    e.preventDefault(); var c=$('clave').value; if(!c){ $('loginMsg').textContent='Escriba la contraseña.'; $('loginMsg').className='msg mal'; return }
    $('entrar').disabled=true; clave=c;
    api('resumen').then(function(j){
      $('entrar').disabled=false;
      if(!j.ok){ $('loginMsg').textContent=j.error||'No se pudo entrar.'; $('loginMsg').className='msg mal'; clave=''; return }
      try{ ($('recordar').checked?localStorage:sessionStorage).setItem(GUARDA,c) }catch(er){}
      $('clave').value=''; arrancar(j);
    }).catch(function(){ $('entrar').disabled=false; $('loginMsg').textContent='Sin conexión. Intente de nuevo.'; $('loginMsg').className='msg mal' });
  });
  $('btnSalir').addEventListener('click',function(){ try{ localStorage.removeItem(GUARDA); sessionStorage.removeItem(GUARDA) }catch(e){} clave=''; paraCam(); clearInterval(tPoll); $('app').hidden=true; $('tabs').hidden=true; $('login').hidden=false });
  function arrancar(j){ $('login').hidden=true; $('app').hidden=false; $('tabs').hidden=false; recibe(j); clearInterval(tPoll); tPoll=setInterval(function(){ if(!d.hidden) refrescar() },20000) }
  function refrescar(){
    $('btnRef').classList.add('giro');
    return api('resumen').then(function(j){ $('btnRef').classList.remove('giro'); if(j.status===401){ $('btnSalir').click(); $('loginMsg').textContent='La sesión venció. Entre otra vez.'; $('loginMsg').className='msg mal'; return } if(j.ok) recibe(j) })
      .catch(function(){ $('btnRef').classList.remove('giro'); $('actualizado').textContent='Sin conexión' });
  }
  $('btnRef').addEventListener('click',refrescar);
  d.addEventListener('visibilitychange',function(){ if(!d.hidden && clave && !$('app').hidden) refrescar() });

  /* ---------- avisos de citas nuevas ---------- */
  $('btnAvisos').addEventListener('click',function(){
    if(!('Notification' in window)){ toast('Este navegador no permite avisos. Instale el panel en la pantalla de inicio.',true); return }
    Notification.requestPermission().then(function(p){ toast(p==='granted'?'Avisos activados: le avisamos cuando entre una cita.':'No se activaron los avisos.',p!=='granted') });
  });
  function avisar(nuevas){
    var n=nuevas.length; $('badge').textContent=n; $('badge').hidden=false;
    toast('📅 '+(n===1?'Nueva cita: '+nuevas[0].nombre+' · '+fmtDia(nuevas[0].fecha)+' '+fmtH(nuevas[0].hora):n+' citas nuevas'));
    if(navigator.vibrate) navigator.vibrate([120,80,120]);
    try{ if('Notification' in window && Notification.permission==='granted') new Notification('Monzú · Nueva cita',{body:nuevas.map(function(c){ return c.nombre+' · '+fmtDia(c.fecha)+' '+fmtH(c.hora) }).join('\n'),icon:'/icono-192.png',tag:'monzu-cita'}) }catch(e){}
  }

  /* ---------- datos ---------- */
  function recibe(j){
    var ids=j.citas.map(function(c){ return c.id });
    if(vistos){ var nuevas=j.citas.filter(function(c){ return vistos.indexOf(c.id)<0 && c.estado==='pendiente' }); if(nuevas.length) avisar(nuevas) }
    vistos=ids; datos=j;
    $('demo').hidden=!j.demo;
    $('actualizado').textContent='Actualizado '+new Date().toLocaleTimeString('es-CR',{hour:'numeric',minute:'2-digit'});
    kpis(); citas(); clientes();
  }
  function kpis(){
    var k=$('kpis'); k.textContent=''; var h=datos.citas.filter(function(c){ return c.fecha===datos.hoy && c.estado!=='cancelada' });
    [[h.length,'Citas hoy'],[datos.citas.filter(function(c){ return c.estado==='pendiente' && c.fecha>=datos.hoy }).length,'Por confirmar'],[datos.clientes.length,'Clientes en el club'],[datos.clientes.filter(function(c){ return c.sellos>=datos.meta }).length,'Premios listos']]
      .forEach(function(x){ var e=el('div'); e.appendChild(el('b',null,x[0])); e.appendChild(el('small',null,x[1])); k.appendChild(e) });
  }
  var NOM={pendiente:'Por confirmar',confirmada:'Confirmada',hecha:'Terminada',cancelada:'Cancelada'};
  function citas(){
    var L=$('listaCitas'); L.textContent='';
    var lista=datos.citas.filter(function(c){
      if(filtro==='hoy') return c.fecha===datos.hoy;
      if(filtro==='prox') return c.fecha>=datos.hoy && c.estado!=='cancelada' && c.estado!=='hecha';
      if(filtro==='pend') return c.estado==='pendiente' && c.fecha>=datos.hoy;
      return c.fecha<datos.hoy || c.estado==='hecha';
    });
    if(filtro==='pasadas') lista.reverse();
    if(!lista.length){ L.appendChild(el('p','vacio',filtro==='hoy'?'No hay citas para hoy.':'No hay citas en esta lista.')); return }
    var dia='';
    lista.forEach(function(c){
      if(c.fecha!==dia){ dia=c.fecha; L.appendChild(el('p','dia',fmtDia(dia))) }
      var box=el('article','cita '+c.estado+(vistos&&$('badge').hidden===false&&c.estado==='pendiente'?' nueva':''));
      var top=el('div','c-top'); top.appendChild(el('b',null,fmtH(c.hora))); top.appendChild(el('span','chip '+c.estado,NOM[c.estado])); box.appendChild(top);
      box.appendChild(el('h3',null,c.nombre));
      var p=el('p'); var tel=el('a',null,c.tel.slice(0,4)+'-'+c.tel.slice(4)); tel.href='tel:+506'+c.tel; p.appendChild(tel); p.appendChild(d.createTextNode(' · '+c.vehiculo+(c.carro?' · '+c.carro:''))); box.appendChild(p);
      var p2=el('p'); var lug=el('a',null,'📍 '+c.lugar); lug.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.lugar+', Cartago, Costa Rica'); lug.target='_blank'; lug.rel='noopener noreferrer'; p2.appendChild(lug); box.appendChild(p2);
      var sv=el('div','servs'); c.lineas.forEach(function(l){ var r=el('div'); r.appendChild(el('span',null,l[0])); r.appendChild(el('span',null,col(l[1]))); sv.appendChild(r) });
      var tt=el('div','tot'); tt.appendChild(el('span',null,'Total estimado')); tt.appendChild(el('span',null,(c.desde?'desde ':'')+col(c.total))); sv.appendChild(tt); box.appendChild(sv);
      if(c.aroma) box.appendChild(el('p',null,'🌸 Aroma: '+c.aroma));
      if(c.nota) box.appendChild(el('p',null,'💬 '+c.nota));
      box.appendChild(mini(c.sellos,datos.meta));
      var acc=el('div','acc');
      if(c.estado==='pendiente'){
        acc.appendChild(boton('Confirmar','b-tq',function(){ accion(c,'confirmar',function(){ abrirWA(c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! 👋 Le confirmamos su cita en Monzú Detallados para el '+fmtDia(c.fecha).toLowerCase()+' a las '+fmtH(c.hora)+' en '+c.lugar+'.\n\nSu tarjeta Monzú Club 💧: '+enlaceTarjeta(c.tarjeta)+'\nGuárdela en su celular y junte sellos para su lavado gratis.') }) },'ok'));
        acc.appendChild(boton('Cancelar','b-rojo',function(){ if(confirm('¿Cancelar la cita de '+c.nombre+'? La hora queda libre otra vez.')) accion(c,'cancelar') },'x'));
      } else if(c.estado==='confirmada'){
        if(c.sellos>=datos.meta) acc.appendChild(boton('Canjear lavado gratis','b-oro',function(){ canjear(c.tarjeta,c.nombre) },'regalo'));
        acc.appendChild(boton('Terminado: dar sello','b-ok',function(){ accion(c,'terminar',function(){ toast('✓ Sello agregado a '+c.nombre.split(' ')[0]+(c.sellos+1>=datos.meta?' · ¡Completó su tarjeta! 🎁':'')) }) },'ok'));
        acc.appendChild(boton('WhatsApp','b-wa',function(){ abrirWA(c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! Le escribimos de Monzú Detallados sobre su cita del '+fmtDia(c.fecha).toLowerCase()+' a las '+fmtH(c.hora)+'.') },'wa'));
        acc.appendChild(boton('Cancelar','b-rojo',function(){ if(confirm('¿Cancelar la cita de '+c.nombre+'?')) accion(c,'cancelar') },'x'));
      } else if(c.estado==='hecha' && c.sellos>=datos.meta){
        acc.appendChild(boton('Canjear lavado gratis','b-oro',function(){ canjear(c.tarjeta,c.nombre) },'regalo'));
      }
      if(acc.childNodes.length) box.appendChild(acc);
      L.appendChild(box);
    });
  }
  function accion(c,a,despues){
    api('cita',{id:c.id,accion:a}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } if(a==='cancelar') toast('Cita cancelada.'); if(a==='confirmar') toast('✓ Cita confirmada. Avísele por WhatsApp.'); if(despues) despues(); refrescar() })
      .catch(function(){ toast('Sin conexión. Intente de nuevo.',true) });
  }
  function sello(tk,nombre,fin){ api('sello',{t:tk,motivo:'Lavado'}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('✓ Sello agregado a '+nombre.split(' ')[0]+' ('+j.tarjeta.sellos+'/'+j.tarjeta.meta+')'+(j.tarjeta.sellos>=j.tarjeta.meta?' 🎁':'')); if(fin) fin(j); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) }
  function canjear(tk,nombre,fin){ if(!confirm('¿Canjear el lavado gratis de '+nombre+'? Su tarjeta vuelve a 0 sellos.')) return; api('canjear',{t:tk}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('🎁 Premio canjeado. Tarjeta de '+nombre.split(' ')[0]+' reiniciada.'); if(fin) fin(j); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) }
  d.querySelectorAll('.filtros button').forEach(function(b){ b.addEventListener('click',function(){ filtro=b.dataset.f; d.querySelectorAll('.filtros button').forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)) }); citas() }) });

  /* ---------- clientes ---------- */
  function clientes(){
    var L=$('listaCli'), q=$('buscar').value.trim().toLowerCase(); L.textContent='';
    var lista=datos.clientes.filter(function(c){ return !q || c.nombre.toLowerCase().indexOf(q)>=0 || c.tel.indexOf(q.replace(/\D/g,''))>=0&&q.replace(/\D/g,'') });
    if(!lista.length){ L.appendChild(el('p','vacio',datos.clientes.length?'No hay clientes con esa búsqueda.':'Todavía no hay clientes. Se agregan solos con la primera reserva.')); return }
    lista.forEach(function(c){
      var box=el('div','cli'), top=el('div','cli-top'), izq=el('div');
      izq.appendChild(el('b',null,c.nombre)); izq.appendChild(el('small',null,c.tel.slice(0,4)+'-'+c.tel.slice(4)+(c.carro?' · '+c.carro:'')+(c.premios?' · '+c.premios+' premio(s) canjeado(s)':'')));
      var em=el('em',null,c.sellos>=datos.meta?'🎁 Premio':c.sellos+'/'+datos.meta); if(c.sellos>=datos.meta) em.className='oro';
      top.appendChild(izq); top.appendChild(em); box.appendChild(top); box.appendChild(mini(c.sellos,datos.meta));
      var acc=el('div','acc');
      if(c.sellos>=datos.meta) acc.appendChild(boton('Canjear premio','b-oro',function(){ canjear(c.tarjeta,c.nombre) },'regalo'));
      else acc.appendChild(boton('Dar sello','b-ok',function(){ if(confirm('¿Dar un sello a '+c.nombre+'?')) sello(c.tarjeta,c.nombre) },'gota'));
      acc.appendChild(boton('Enviar tarjeta','b-wa',function(){ abrirWA(c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! 💧 Esta es su tarjeta Monzú Club, donde ve sus sellos: '+enlaceTarjeta(c.tarjeta)+'\nGuárdela en la pantalla de inicio de su celular para tenerla siempre a mano.') },'wa'));
      box.appendChild(acc); L.appendChild(box);
    });
  }
  $('buscar').addEventListener('input',function(){ if(datos) clientes() });

  /* ---------- escáner con la cámara ---------- */
  function paraCam(){ cancelAnimationFrame(rafId); if(stream){ stream.getTracks().forEach(function(t){ t.stop() }); stream=null } $('cam').hidden=true; $('btnCam').hidden=false }
  $('btnCam').addEventListener('click',function(){
    $('hallado').textContent='';
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ toast('Este navegador no permite usar la cámara.',true); return }
    navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}).then(function(s){
      stream=s; var v=$('video'); v.srcObject=s; v.play(); $('cam').hidden=false; $('btnCam').hidden=true; $('camTxt').textContent='Apunte al código QR de la tarjeta';
      var cv=$('lienzo'), cx=cv.getContext('2d',{willReadFrequently:true}), ult=0;
      (function lee(ts){
        rafId=requestAnimationFrame(lee);
        if(ts-ult<180 || v.readyState<2) return; ult=ts;
        var w=v.videoWidth, h=v.videoHeight; if(!w) return; var esc=Math.min(1,640/Math.max(w,h)); cv.width=Math.round(w*esc); cv.height=Math.round(h*esc);
        cx.drawImage(v,0,0,cv.width,cv.height); var img=cx.getImageData(0,0,cv.width,cv.height);
        var r=window.jsQR(img.data,img.width,img.height,{inversionAttempts:'dontInvert'});
        if(r&&r.data){ var tk=''; try{ tk=new URL(r.data,location.origin).searchParams.get('t')||'' }catch(e){}
          if(!/^[\w-]{20,40}$/.test(tk)){ $('camTxt').textContent='Ese código no es una tarjeta Monzú Club.'; return }
          if(navigator.vibrate) navigator.vibrate(60); paraCam(); buscaTarjeta(tk) }
      })(0);
    }).catch(function(){ toast('No se pudo abrir la cámara. Dé permiso a la cámara en el navegador.',true) });
  });
  function buscaTarjeta(tk){
    var H=$('hallado'); H.textContent=''; H.appendChild(el('p','vacio','Buscando tarjeta…'));
    api('tarjeta?t='+encodeURIComponent(tk)).then(function(j){
      H.textContent=''; if(!j.ok){ H.appendChild(el('p','vacio',j.error||'Tarjeta no encontrada.')); return }
      var t=j.tarjeta, box=el('div','hallado'); box.appendChild(el('p','msg bien','✓ Tarjeta encontrada · '+t.codigo)); box.appendChild(el('b',null,t.nombre));
      if(t.carro) box.appendChild(el('p','cli-car',t.carro)); box.appendChild(mini(t.sellos,t.meta));
      var acc=el('div','acc');
      if(t.sellos>=t.meta) acc.appendChild(boton('Canjear '+t.premio.toLowerCase(),'b-oro',function(){ canjear(tk,t.nombre,function(){ H.textContent='' }) },'regalo'));
      else acc.appendChild(boton('Dar sello','b-ok',function(){ sello(tk,t.nombre,function(r){ H.textContent=''; var ok=el('div','hallado'); ok.appendChild(el('b',null,'✓ '+t.nombre.split(' ')[0]+': '+r.tarjeta.sellos+'/'+r.tarjeta.meta)); ok.appendChild(mini(r.tarjeta.sellos,r.tarjeta.meta)); ok.appendChild(el('p','ayuda','El cliente ya lo ve en su tarjeta.')); H.appendChild(ok) }) },'ok'));
      acc.appendChild(boton('Escanear otra','b-bor',function(){ H.textContent=''; $('btnCam').click() }));
      box.appendChild(acc); H.appendChild(box);
    }).catch(function(){ H.textContent=''; toast('Sin conexión.',true) });
  }

  /* ---------- pestañas ---------- */
  d.querySelectorAll('.tabs button').forEach(function(b){ b.addEventListener('click',function(){
    d.querySelectorAll('.tabs button').forEach(function(x){ x.setAttribute('aria-selected',String(x===b)) });
    d.querySelectorAll('.sec').forEach(function(s){ if(s.id) s.classList.toggle('on',s.id==='sec-'+b.dataset.sec) });
    if(b.dataset.sec!=='escanear') paraCam(); if(b.dataset.sec==='citas'){ $('badge').hidden=true }
    scrollTo(0,0);
  }) });

  /* sesión guardada */
  if(clave){ api('resumen').then(function(j){ if(j.ok) arrancar(j); else { clave=''; try{ localStorage.removeItem(GUARDA) }catch(e){} } }).catch(function(){}) }
})();
