(function(){
  'use strict';
  var d=document, $=function(i){ return d.getElementById(i) };
  var tieneP=false, proxId='', rapidaLista=false, multaAct=0, NS='http://www.w3.org/2000/svg', CLAVE='monzu-tarjeta', ultimo=null, tPoll=null;
  function svg(paths,fill){ var s=d.createElementNS(NS,'svg'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('aria-hidden','true');
    if(fill){ s.setAttribute('fill','currentColor') } else { s.setAttribute('fill','none'); s.setAttribute('stroke','currentColor'); s.setAttribute('stroke-width','2'); s.setAttribute('stroke-linecap','round'); s.setAttribute('stroke-linejoin','round') }
    paths.forEach(function(p){ var e=d.createElementNS(NS,'path'); e.setAttribute('d',p); s.appendChild(e) }); return s }
  var GOTA=['M12 2.5c-.4 0-.7.2-.9.5C9.4 5.6 5.5 10.9 5.5 14.5a6.5 6.5 0 0 0 13 0c0-3.6-3.9-8.9-5.6-11.5a1.1 1.1 0 0 0-.9-.5z'];
  var REGALO=['M20 12v9H4v-9','M2 7h20v5H2z','M12 21V7','M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z','M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z'];

  /* token: del enlace (?t=) o guardado en este celular */
  var q=new URLSearchParams(location.search), tk=q.get('t')||'';
  try{ if(tk) localStorage.setItem(CLAVE,tk); else tk=localStorage.getItem(CLAVE)||'' }catch(e){}
  if(!/^[\w-]{20,40}$/.test(tk)) tk='';

  function fmtF(f){ var x=new Date(f+'T12:00:00'); return x.toLocaleDateString('es-CR',{day:'numeric',month:'short'}) }
  function fmtFL(f){ var x=new Date(f+'T12:00:00'); return x.toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long'}) }
  function fmtH(h){ var p=h.split(':'), n=+p[0]; return (n>12?n-12:n)+':'+p[1]+(n<12?' a. m.':' p. m.') }
  function toast(t,p){ var e=$('toast'); e.textContent=''; var b=d.createElement('b'); b.textContent=t; e.appendChild(b); if(p) e.appendChild(d.createTextNode(p)); e.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(function(){ e.classList.remove('on') },4500) }

  function dibujaQR(texto){
    var qr=window.qrcode(0,'M'); qr.addData(texto); qr.make();
    var n=qr.getModuleCount(), m=2, cv=$('qr'), esc=Math.floor(236/(n+m*2)), tam=esc*(n+m*2);
    cv.width=tam; cv.height=tam; var c=cv.getContext('2d'); c.fillStyle='#fff'; c.fillRect(0,0,tam,tam); c.fillStyle='#07141A';
    for(var r=0;r<n;r++) for(var k=0;k<n;k++) if(qr.isDark(r,k)) c.fillRect((k+m)*esc,(r+m)*esc,esc,esc);
  }
  function pinta(j,nuevo){
    var t=j.tarjeta, meta=t.meta, s=Math.min(t.sellos,meta), premio=t.sellos>=meta;
    $('tjNombre').textContent=t.nombre; $('tjCarro').textContent=t.carro||''; $('tjCodigo').textContent=t.codigo;
    $('tarjeta').classList.toggle('premio',premio);
    var c=$('sellos'); c.textContent=''; c.setAttribute('role','img'); c.setAttribute('aria-label',s+' de '+meta+' sellos');
    for(var i=0;i<meta;i++){ var ult=(i===meta-1&&i>=s), e=d.createElement('div');
      e.className='sello'+(i<s?' on':'')+(ult?' regalo':'')+(nuevo&&i===s-1?' nuevo':''); e.appendChild(svg(ult?REGALO:GOTA,!ult)); c.appendChild(e) }
    $('tjCuenta').textContent=s+' / '+meta;
    $('tjFalta').textContent=premio?'¡Lavado gratis listo!':'Le faltan '+(meta-s)+(meta-s===1?' lavado':' lavados')+' para su '+t.premio.toLowerCase();
    $('tjBarra').style.width=(s/meta*100)+'%';
    var pm=$('premioMsg'); pm.hidden=!premio; if(premio) pm.textContent='🎁 ¡Ganó su '+t.premio.toLowerCase()+'! Muestre esta tarjeta en su próxima cita.';
    var P=j.proxima, pc=$('proxCita'); pc.hidden=!P; proxId=P?P.id:'';
    if(P){ $('proxTxt').textContent='📅 Próxima cita: '+fmtFL(P.fecha)+', '+fmtH(P.hora)+(P.estado==='confirmada'?' · confirmada ✓':' · por confirmar');
      $('proxDet').textContent=[P.pago?'Pago: '+P.pago:'', P.total?'Total: '+col(P.total)+(P.multa?' (incluye multa de '+col(P.multa)+')':''):''].filter(Boolean).join(' · ');
      $('proxAcc').hidden=!P.cancelable; $('proxNoCancela').hidden=P.cancelable; if(!P.cancelable) $('cambio').hidden=true;
      $('proxNoCancela').textContent='Faltan menos de '+(j.horasCancelar||2)+' horas: si no puede llegar, avísenos por WhatsApp.' }
    $('hola').textContent='Hola, '+t.nombre.split(' ')[0]+' 👋'; var dt=$('datos'); dt.textContent='';
    [['📱',t.tel?t.tel.slice(0,4)+'-'+t.tel.slice(4):''],['🚗',t.carro],['💧',t.sellos+' sellos'],['🎁',t.premios?t.premios+(t.premios===1?' premio ganado':' premios ganados'):''],['🔔',t.recordatorios?'Recordatorios activos':'']].forEach(function(x){ if(!x[1]) return; var sp=d.createElement('span'); sp.textContent=x[0]+' '; var b=d.createElement('b'); b.textContent=x[1]; sp.appendChild(b); dt.appendChild(sp) });
    if(!rapidaLista) prepRapida(t);
    multaAct=t.multa||0; pintaTotal(); var mm=$('multaMsg'); mm.hidden=!(t.multa>0); if(t.multa>0) mm.textContent='⚠️ Tiene una multa pendiente de '+col(t.multa)+' por no presentarse a una cita. Se suma al total de su próxima cita.';
    var h=$('hist'); h.textContent='';
    t.hist.forEach(function(x){ var r=d.createElement('div'), b=d.createElement('b'), sp=d.createElement('span'); b.textContent=x[0]; sp.textContent=fmtF(x[1]); r.appendChild(b); r.appendChild(sp); h.appendChild(r) });
  }
  function col(n){ return '₡'+Number(n).toLocaleString('es-CR') }
  /* confirmación dentro de la página (confirm() y prompt() fallan en algunos celulares y apps) */
  function pregunta(texto,conPin,si){
    return new Promise(function(listo){
      var D=$('dlg'); $('dlgTxt').textContent=texto; $('dlgPinL').hidden=!conPin; $('dlgPin').value=''; $('dlgSi').textContent=si||'Sí'; D.hidden=false;
      (conPin?$('dlgPin'):$('dlgNo')).focus();
      function fin(v){ D.hidden=true; $('dlgSi').onclick=null; $('dlgNo').onclick=null; listo(v) }
      $('dlgSi').onclick=function(){ fin(conPin?$('dlgPin').value.trim():true) }; $('dlgNo').onclick=function(){ fin(conPin?null:false) };
    });
  }
  function muestra(id){ ['cargando','acceso','vista'].forEach(function(x){ $(x).hidden=x!==id }) }
  function carga(primera){
    if(!tk){ acceso(location.hash==='#registro'?'registro':'entrar'); return }
    fetch('/api/tarjeta?t='+encodeURIComponent(tk),{headers:{accept:'application/json'},cache:'no-store'})
      .then(function(r){ return r.json().then(function(j){ return {r:r,j:j} }) })
      .then(function(o){
        if(!o.j.ok){ if(o.r.status===404){ olvida(); acceso('entrar'); msg('mEntrar','No encontramos esa tarjeta. Entre con su teléfono y su PIN.',true) } return }
        var s=o.j.tarjeta.sellos, antes=ultimo;
        var nuevo=antes!==null && s>antes;
        if(primera||nuevo||antes===null||s!==antes||JSON.stringify(o.j)!==carga.prev){ pinta(o.j,nuevo); carga.prev=JSON.stringify(o.j) }
        if(primera){ dibujaQR(location.origin+'/tarjeta.html?t='+tk); muestra('vista') }
        tieneP=!!o.j.tarjeta.tienePin; $('crearPin').hidden=tieneP;
        $('usuario').textContent=o.j.tarjeta.tienePin?'Para entrar desde otro celular: su teléfono y su PIN.':'';
        if(nuevo){ if(navigator.vibrate) navigator.vibrate([80,60,120]); toast(s>=o.j.tarjeta.meta?'🎁 ¡Lavado gratis desbloqueado!':'💧 ¡Sello agregado! '+s+' de '+o.j.tarjeta.meta,' Gracias por lavar con Monzú.') }
        if(antes!==null && s<antes && s===0) toast('🎁 ¡Disfrute su lavado gratis!',' Su tarjeta empieza de nuevo.');
        ultimo=s;
      })
      .catch(function(){ if(primera){ acceso('entrar'); msg('mEntrar','No hay conexión en este momento. Revise su internet e intente de nuevo.',true) } });
  }
  /* ---------- entrar, registrarse, crear PIN y salir ---------- */
  function msg(id,t,mal){ var m=$(id); m.textContent=t; m.className='msg '+(mal?'mal':'bien') }
  function olvida(){ tk=''; ultimo=null; try{ localStorage.removeItem(CLAVE) }catch(e){} history.replaceState(null,'','/tarjeta.html') }
  function usa(nuevo){ tk=nuevo; try{ localStorage.setItem(CLAVE,tk) }catch(e){} history.replaceState(null,'','/tarjeta.html?t='+encodeURIComponent(tk)); muestra('cargando'); carga(true) }
  function acceso(cual){ muestra('acceso'); pestana(cual) }
  function pestana(cual){ $('tabEntrar').setAttribute('aria-selected',String(cual==='entrar')); $('tabRegistro').setAttribute('aria-selected',String(cual==='registro')); $('fEntrar').hidden=cual!=='entrar'; $('fRegistro').hidden=cual!=='registro' }
  $('tabEntrar').addEventListener('click',function(){ pestana('entrar') });
  $('tabRegistro').addEventListener('click',function(){ pestana('registro') });
  function telOk(v){ var t=String(v||'').replace(/[^\d+]/g,'').replace(/^\+?506/,''); return /^[2-8]\d{7}$/.test(t)?t:'' }
  function post(ruta,datos){ return fetch('/api/'+ruta,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(datos)}).then(function(r){ return r.json() }) }
  $('fEntrar').addEventListener('submit',function(e){
    e.preventDefault(); var tel=telOk($('eTel').value), pin=$('ePin').value.trim();
    $('eTel').setAttribute('aria-invalid',String(!tel)); $('ePin').setAttribute('aria-invalid',String(!/^\d{4}$/.test(pin)));
    if(!tel||!/^\d{4}$/.test(pin)){ msg('mEntrar','Escriba su teléfono (8 dígitos) y su PIN (4 números).',true); return }
    $('bEntrar').disabled=true; msg('mEntrar','Buscando su tarjeta…',false);
    post('entrar',{tel:tel,pin:pin}).then(function(j){ $('bEntrar').disabled=false; if(!j.ok){ msg('mEntrar',j.error||'No se pudo entrar.',true); return } $('ePin').value=''; usa(j.tarjeta) })
      .catch(function(){ $('bEntrar').disabled=false; msg('mEntrar','Sin conexión. Intente de nuevo.',true) });
  });
  $('fRegistro').addEventListener('submit',function(e){
    e.preventDefault(); if($('rWeb').value) return;
    var nombre=$('rNombre').value.trim().replace(/\s+/g,' '), tel=telOk($('rTel').value), pin=$('rPin').value.trim(), mal=[];
    var okN=/^[\p{L}\p{M} .'’-]{3,80}$/u.test(nombre); $('rNombre').setAttribute('aria-invalid',String(!okN)); if(!okN) mal.push('su nombre');
    $('rTel').setAttribute('aria-invalid',String(!tel)); if(!tel) mal.push('un teléfono de 8 dígitos');
    var okP=/^\d{4}$/.test(pin); $('rPin').setAttribute('aria-invalid',String(!okP)); if(!okP) mal.push('un PIN de 4 números');
    if(okP&&pin!==$('rPin2').value.trim()){ $('rPin2').setAttribute('aria-invalid','true'); mal.push('que los dos PIN sean iguales') }
    if(!$('rOk').checked) mal.push('aceptar los términos');
    if(mal.length){ msg('mRegistro','Falta: '+mal.join(', ')+'.',true); return }
    $('bRegistro').disabled=true; msg('mRegistro','Creando su tarjeta…',false);
    post('registro',{nombre:nombre,tel:tel,carro:$('rCarro').value.trim(),pin:pin,consentimiento:true,web:$('rWeb').value}).then(function(j){
      $('bRegistro').disabled=false; if(!j.ok){ msg('mRegistro',j.error||'No se pudo registrar.',true); if(/ya est/.test(j.error||'')){ $('eTel').value=$('rTel').value; pestana('entrar') } return }
      usa(j.tarjeta); setTimeout(function(){ toast('💧 ¡Bienvenido a Monzú Club!',' Su usuario es su teléfono y su clave el PIN que escogió.') },900);
    }).catch(function(){ $('bRegistro').disabled=false; msg('mRegistro','Sin conexión. Intente de nuevo.',true) });
  });
  $('crearPin').addEventListener('submit',function(e){
    e.preventDefault(); var a=$('nPin').value.trim(), b=$('nPin2').value.trim();
    if(!/^\d{4}$/.test(a)){ msg('mPin','El PIN debe tener 4 números.',true); return } if(a!==b){ msg('mPin','Los dos PIN no son iguales.',true); return }
    post('pin',{t:tk,pin:a}).then(function(j){ if(!j.ok){ msg('mPin',j.error||'No se pudo guardar.',true); return } $('crearPin').hidden=true; toast('🔐 PIN guardado',' Ya puede entrar desde cualquier celular con su teléfono y su PIN.'); carga(false) })
      .catch(function(){ msg('mPin','Sin conexión. Intente de nuevo.',true) });
  });
  $('btnSalir').addEventListener('click',function(){ pregunta('¿Salir de esta tarjeta en este celular? Para volver a entrar necesita su teléfono y su PIN.',false,'Sí, salir').then(function(ok){ if(ok){ olvida(); acceso('entrar') } }) });
  $('btnCancelar').addEventListener('click',function(){
    if(!proxId) return; var id=proxId;
    pregunta('¿Cancelar su próxima cita? La hora queda libre para otro cliente.',false,'Sí, cancelar').then(function(ok){ if(!ok) return;
      post('cancelar',{t:tk,id:id}).then(function(j){ if(!j.ok){ toast('No se pudo cancelar.',' '+(j.error||'')); return } toast('Cita cancelada.',' Gracias por avisar. Reserve otra cuando guste.'); carga(false) })
        .catch(function(){ toast('Sin conexión.',' Intente de nuevo.') }) });
  });

  $('btnBorrar').addEventListener('click',function(){
    pregunta('¿Borrar su tarjeta Monzú Club? Se eliminan sus sellos, su historial y sus citas. No se puede deshacer.'+(tieneP?' Para confirmar, escriba su PIN.':''),tieneP,'Sí, borrar').then(function(v){
    if(v===false||v===null) return; var pin=tieneP?v:'';
    if(tieneP&&!/^\d{4}$/.test(pin)){ toast('No se borró nada.',' Debe escribir su PIN de 4 números.'); return }
    post('borrar-tarjeta',{t:tk,pin:pin}).then(function(j){ if(!j.ok){ toast('No se pudo borrar.',' '+(j.error||'')); return } olvida(); acceso('entrar'); msg('mEntrar','Su tarjeta y sus datos fueron borrados. Gracias por haber sido parte de Monzú Club.',false) })
      .catch(function(){ toast('Sin conexión.',' Intente de nuevo.') });
    });
  });

  /* ---------- selector de día y hora (reserva rápida y cambio de cita) ---------- */
  var CAT=null, catP=null;
  function catalogo(){ if(!catP) catP=fetch('/api/catalogo',{headers:{accept:'application/json'}}).then(function(r){ return r.json() }).then(function(j){ if(!j.ok) throw 0; CAT=j; return j }); return catP }
  function hoyCR(){ return new Date(Date.now()-6*36e5).toISOString().slice(0,10) }
  function sumaD(f,n){ var x=new Date(f+'T12:00:00Z'); x.setUTCDate(x.getUTCDate()+n); return x.toISOString().slice(0,10) }
  function selector(cajaD,cajaH,alCambiar){
    var sel={fecha:'',hora:''}, DS=['dom','lun','mar','mié','jue','vie','sáb'], MS=['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];
    function horas(){ cajaH.textContent=''; var p=d.createElement('p'); p.className='rap-sub'; p.textContent='Buscando horas libres…'; cajaH.appendChild(p);
      var f=sel.fecha; fetch('/api/horarios?fecha='+f,{headers:{accept:'application/json'}}).then(function(r){ return r.json() }).then(function(j){
        if(f!==sel.fecha) return; cajaH.textContent='';
        if(!j.ok||j.cerrado||!j.horas.some(function(x){ return x.libre })){ var q=d.createElement('p'); q.className='rap-sub'; q.textContent=j.motivo||'No quedan horas ese día. Pruebe otro.'; cajaH.appendChild(q); return }
        j.horas.forEach(function(x){ var b=d.createElement('button'); b.type='button'; b.className='chip'; b.textContent=fmtH(x.h); b.disabled=!x.libre; b.setAttribute('aria-pressed','false');
          b.addEventListener('click',function(){ sel.hora=x.h; cajaH.querySelectorAll('.chip').forEach(function(y){ y.setAttribute('aria-pressed',String(y===b)) }); alCambiar() }); cajaH.appendChild(b) });
      }).catch(function(){ cajaH.textContent='Sin conexión.' });
    }
    catalogo().then(function(C){ cajaD.textContent=''; var h=hoyCR();
      for(var i=0;i<=Math.min(C.diasAdelante,30);i++){ (function(f){ var x=new Date(f+'T12:00:00Z'); if(C.dias.indexOf(x.getUTCDay())<0) return;
        var b=d.createElement('button'); b.type='button'; b.className='dia'; b.setAttribute('aria-pressed','false');
        var a=d.createElement('small'), n=d.createElement('b'), m=d.createElement('em'); a.textContent=f===h?'hoy':DS[x.getUTCDay()]; n.textContent=x.getUTCDate(); m.textContent=MS[x.getUTCMonth()];
        b.appendChild(a); b.appendChild(n); b.appendChild(m); b.setAttribute('aria-label',fmtFL(f));
        b.addEventListener('click',function(){ sel.fecha=f; sel.hora=''; cajaD.querySelectorAll('.dia').forEach(function(y){ y.setAttribute('aria-pressed',String(y===b)) }); horas(); alCambiar() });
        cajaD.appendChild(b) })(sumaD(h,i)) }
    }).catch(function(){});
    sel.recarga=function(){ if(sel.fecha) horas() };
    return sel;
  }
  function grupo(caja,ops,multi,alCambiar,inicial){
    var val=multi?[]:(inicial||'');
    ops.forEach(function(o){ var b=d.createElement('button'); b.type='button'; b.className='chip'; b.dataset.v=o.v; var on=multi?false:o.v===val; b.setAttribute('aria-pressed',String(on));
      b.textContent=o.n; if(o.p){ var sm=d.createElement('small'); sm.textContent=o.p; b.appendChild(sm) }
      b.addEventListener('click',function(){ if(multi){ var i=val.indexOf(o.v); if(i<0) val.push(o.v); else val.splice(i,1); b.setAttribute('aria-pressed',String(i<0)) } else { val=o.v; caja.querySelectorAll('.chip').forEach(function(y){ y.setAttribute('aria-pressed',String(y===b)) }) } alCambiar() });
      caja.appendChild(b) });
    return { get:function(){ return val }, pintaPrecios:function(fn){ caja.querySelectorAll('.chip').forEach(function(b){ var sm=b.querySelector('small'); var t=fn(b.dataset.v); if(sm&&t) sm.textContent=t }) } };
  }
  /* ---------- reserva rápida ---------- */
  var R={}, rUbic=null, rMapa=null;
  function cotizaL(){ if(!CAT) return null; var v=R.veh.get()||'sedan', P=CAT.paq[R.paq.get()], tot=0, desde=false;
    if(P) tot+=P[v]; R.ext.get().forEach(function(k){ var x=CAT.ext[k]; if(!x) return; if(x.desde) desde=true; tot+=(x.conPaq&&P)?x.conPaq:x.p }); return {tot:tot,desde:desde,algo:!!P||R.ext.get().length>0} }
  function pintaInc(){ var P=CAT&&CAT.paq[R.paq.get()], b=$('rIncBtn'), L=$('rInc'); b.hidden=!(P&&P.incluye); if(!P||!P.incluye){ L.hidden=true; return }
    var nom=P.n.replace('Detallado ',''), abierto=!L.hidden; b.textContent='¿Qué incluye el '+nom+'? '+(abierto?'↑':'↓'); b.setAttribute('aria-expanded',String(abierto));
    L.textContent=''; P.incluye.forEach(function(x){ var li=d.createElement('li'); li.textContent=x; if(/:$/.test(x)) li.className='tit'; L.appendChild(li) }) }
  $('rIncBtn').addEventListener('click',function(){ $('rInc').hidden=!$('rInc').hidden; pintaInc() });
  function pintaTotal(){ if(!R.paq) return; var q=cotizaL(); if(!q) return; pintaInc();
    R.veh&&R.paq.pintaPrecios(function(k){ var P=CAT.paq[k]; return P?col(P[R.veh.get()||'sedan']):'' });
    $('rTotal').textContent=q.algo?(q.desde?'desde ':'')+col(q.tot+multaAct):'—';
    var mn=$('rMultaNota'); mn.hidden=!(multaAct>0); if(multaAct>0) mn.textContent='Incluye la multa pendiente de '+col(multaAct)+'.' }
  function ubiTxt(){ var p=$('rUbiTxt'); p.textContent=''; if(!rUbic) return; p.appendChild(d.createTextNode('✓ Ubicación marcada · ')); var a=d.createElement('a'); a.href='https://www.google.com/maps?q='+rUbic.lat+','+rUbic.lng; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='ver en Google Maps'; a.className='tq2'; p.appendChild(a) }
  function abreMapa(){ var m=$('rMapa'); if(!window.MonzuMapa) return null; m.hidden=false; if(!rMapa) rMapa=window.MonzuMapa(m,{lat:rUbic&&rUbic.lat,lng:rUbic&&rUbic.lng,alCambiar:function(u){ rUbic=u; ubiTxt() }}); return rMapa }
  $('rVerMapa').addEventListener('click',function(){ abreMapa(); if(!rUbic) $('rUbiTxt').textContent='Mueva el mapa hasta que la flecha roja quede donde está el carro.' });
  $('rMiUbi').addEventListener('click',function(){ var m=abreMapa(); if(!m) return; $('rUbiTxt').textContent='Buscando su ubicación…'; m.miUbicacion(function(t){ $('rUbiTxt').textContent=t }) });
  function prepRapida(t){
    rapidaLista=true; var pf=t.pref||{};
    if(pf.lugar) $('rLugar').value=pf.lugar; if(pf.ubic){ rUbic=pf.ubic; ubiTxt() }
    catalogo().then(function(C){
      R.paq=grupo($('rPaq'),Object.keys(C.paq).map(function(k){ return {v:k,n:C.paq[k].n.replace('Detallado ',''),p:' '} }).concat([{v:'',n:'Solo adicionales'}]),false,pintaTotal,'premium');
      R.veh=grupo($('rVeh'),[{v:'sedan',n:'Sedán'},{v:'suv',n:'SUV / Pick up'}],false,pintaTotal,pf.veh||'sedan');
      R.ext=grupo($('rExt'),Object.keys(C.ext).map(function(k){ var x=C.ext[k]; return {v:k,n:(function(t){ return t.charAt(0).toUpperCase()+t.slice(1) })(x.n.replace('Limpieza de ','')),p:(x.desde?'desde ':'')+col(x.p)} }),true,pintaTotal);
      R.pago=grupo($('rPago'),C.pagos.map(function(p){ return {v:p,n:({'Efectivo':'💵 ','SINPE Móvil':'📱 ','Transferencia':'🏦 '}[p]||'')+p} }),false,function(){},pf.pago||'');
      R.cuando=selector($('rDias'),$('rHoras'),function(){});
      pintaTotal();
    }).catch(function(){ $('rapida').hidden=true });
  }
  $('rReservar').addEventListener('click',function(){
    if(!R.paq) return; var q=cotizaL(), mal=[], w=R.cuando;
    if(!q.algo) mal.push('el servicio'); if(!w.fecha) mal.push('el día'); else if(!w.hora) mal.push('la hora');
    var lugar=$('rLugar').value.trim(); if(lugar.length<4) mal.push('la dirección'); if(!R.pago.get()) mal.push('cómo va a pagar');
    if(mal.length){ msg('rMsg','Falta: '+mal.join(', ')+'.',true); return }
    var b=$('rReservar'); b.disabled=true; msg('rMsg','Reservando…',false);
    post('reservar-rapido',{t:tk,fecha:w.fecha,hora:w.hora,paq:R.paq.get(),veh:R.veh.get(),extras:R.ext.get(),pago:R.pago.get(),lugar:lugar,ubic:rUbic}).then(function(j){
      b.disabled=false; if(!j.ok){ msg('rMsg',j.error||'No se pudo reservar.',true); w.recarga(); return }
      msg('rMsg','✓ ¡Listo! Cita el '+fmtFL(j.cita.fecha)+' a las '+fmtH(j.cita.hora)+' · Total '+col(j.cita.total)+'. Monzú se la confirma por WhatsApp.',false);
      if(navigator.vibrate) navigator.vibrate(80); toast('✓ Cita reservada',' '+fmtFL(j.cita.fecha)+', '+fmtH(j.cita.hora)); w.recarga(); carga(false);
    }).catch(function(){ b.disabled=false; msg('rMsg','Sin conexión. Intente de nuevo.',true) });
  });
  /* ---------- cambiar fecha u hora de la cita ---------- */
  var CB=null;
  $('btnCambiar').addEventListener('click',function(){ var c=$('cambio'); c.hidden=!c.hidden; if(!c.hidden&&!CB) CB=selector($('cDias'),$('cHoras'),function(){}); msg('cMsg','',false) });
  $('cGuardar').addEventListener('click',function(){
    if(!CB||!CB.fecha||!CB.hora){ msg('cMsg','Elija el nuevo día y la hora.',true); return }
    var b=$('cGuardar'); b.disabled=true;
    post('cambiar',{t:tk,id:proxId,fecha:CB.fecha,hora:CB.hora}).then(function(j){ b.disabled=false;
      if(!j.ok){ msg('cMsg',j.error||'No se pudo cambiar.',true); CB.recarga(); return }
      $('cambio').hidden=true; toast('✓ Cita cambiada',' Ahora es el '+fmtFL(CB.fecha)+' a las '+fmtH(CB.hora)+'.'); carga(false); if(R.cuando) R.cuando.recarga();
    }).catch(function(){ b.disabled=false; msg('cMsg','Sin conexión. Intente de nuevo.',true) });
  });

  /* ---------- recordatorios por notificación (Web Push, gratis) ---------- */
  var swReg=null;
  function notifEstado(on,texto){ $('notif').classList.toggle('on',!!on); $('btnNotif').textContent=on?'Desactivar en este celular':'Activar recordatorios'; if(texto) $('notifTxt').textContent=texto }
  function b64(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); var b=atob(s+'==='.slice((s.length+3)%4)), o=new Uint8Array(b.length); for(var i=0;i<b.length;i++) o[i]=b.charCodeAt(i); return o }
  var esIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent), instalada=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  var puedePush='serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if(!puedePush){
    $('btnNotif').hidden=esIOS?false:true; $('btnNotif').textContent='Cómo activarlos';
    notifEstado(false, esIOS&&!instalada?'En iPhone los recordatorios llegan cuando guarda la tarjeta en la pantalla de inicio y la abre desde el ícono de Monzú.':'Este navegador no permite notificaciones. Le recordamos su cita por WhatsApp.');
  } else {
    var pol=window.trustedTypes&&trustedTypes.createPolicy?trustedTypes.createPolicy('monzu-sw',{createScriptURL:function(u){ if(u!=='/sw.js') throw new Error('no'); return u }}):null;
    navigator.serviceWorker.register(pol?pol.createScriptURL('/sw.js'):'/sw.js',{scope:'/'}).then(function(reg){ swReg=reg; return reg.pushManager.getSubscription() })
      .then(function(sub){ if(sub&&Notification.permission==='granted'){ notifEstado(true,'✅ Activados: le avisamos 24 horas y 1 hora antes de su cita.'); if(tk) post('push',{t:tk,sub:sub.toJSON()}).catch(function(){}) } })
      .catch(function(){});
  }
  $('btnNotif').addEventListener('click',function(){
    if(!puedePush){ $('btnInicio').click(); return }
    if(!swReg||!tk) return;
    var b=$('btnNotif'); b.disabled=true;
    swReg.pushManager.getSubscription().then(function(sub){
      if(sub&&$('notif').classList.contains('on')){
        return post('push',{t:tk,sub:sub.toJSON(),quitar:true}).then(function(){ return sub.unsubscribe() }).then(function(){ notifEstado(false,'Recordatorios apagados en este celular.') });
      }
      return Notification.requestPermission().then(function(p){
        if(p!=='granted'){ notifEstado(false,'No dio permiso. Para activarlos, permita las notificaciones de esta página en los ajustes del navegador.'); return }
        return fetch('/api/push/clave',{headers:{accept:'application/json'}}).then(function(r){ return r.json() }).then(function(j){
          if(!j.ok) throw new Error('clave');
          return swReg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(j.clave)});
        }).then(function(nueva){ return post('push',{t:tk,sub:nueva.toJSON()}) }).then(function(j){
          if(!j.ok) throw new Error(j.error||'');
          notifEstado(true,'✅ Activados: le avisamos 24 horas y 1 hora antes de su cita.'); toast('🔔 Recordatorios activados',' Le avisaremos antes de cada cita.');
        });
      });
    }).catch(function(){ notifEstado(false,'No se pudieron activar ahora. Intente de nuevo en un momento.') })
      .then(function(){ b.disabled=false });
  });
  carga(true);
  /* se actualiza sola mientras está abierta */
  function arranca(){ clearInterval(tPoll); tPoll=setInterval(function(){ if(!d.hidden) carga(false) },8000) }
  arranca(); d.addEventListener('visibilitychange',function(){ if(!d.hidden) carga(false) });

  /* guardar en la pantalla de inicio */
  var instalar=null;
  window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); instalar=e; $('btnInstalar').hidden=false });
  $('btnInstalar').addEventListener('click',function(){ if(instalar){ instalar.prompt(); instalar=null; $('btnInstalar').hidden=true } });
  $('btnInicio').addEventListener('click',function(){ $('ov').classList.add('on'); var ios=/iPhone|iPad|iPod/i.test(navigator.userAgent); elige(ios?'ios':'and') });
  $('cerrarOv').addEventListener('click',function(){ $('ov').classList.remove('on') });
  function elige(so){ d.querySelectorAll('.so button').forEach(function(x){ x.setAttribute('aria-selected',String(x.dataset.so===so)) }); $('pasosIos').hidden=so!=='ios'; $('pasosAnd').hidden=so!=='and' }
  d.querySelectorAll('.so button').forEach(function(b){ b.addEventListener('click',function(){ elige(b.dataset.so) }) });
})();
