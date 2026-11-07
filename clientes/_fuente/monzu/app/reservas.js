  /* ===== reservas con horario real (servidor /api) ===== */
  var abierto=Date.now(), ultimo=0, horaSel='', API=true;
  function estado(t,mal){ var s=$('estado'); s.textContent=t; s.className='estado '+(mal?'mal':'bien') }
  /* el botón Reservar dentro de "¿Qué incluye?" cierra la ventana */
  d.querySelectorAll('dialog.legal [data-elige]').forEach(function(a){ a.addEventListener('click',function(){ a.closest('dialog').close() }) });
  var cajaH=$('horas');
  /* ubicación con mapa: el cliente mueve el mapa, toca "Usar esta ubicación" y listo */
  var ubic=null, mapa=null;
  function ubiTexto(t){ var p=$('ubiTxt'); p.textContent=''; if(t){ p.className='ubica-txt'; p.textContent=t; return } if(!ubic){ p.className='ubica-txt'; p.textContent='Opcional: marque dónde está el carro y llegamos directo.'; return }
    p.className='ubica-txt ok'; p.appendChild(d.createTextNode('📍 Ubicación guardada · ')); var a=d.createElement('a'); a.href='https://www.google.com/maps?q='+ubic.lat+','+ubic.lng; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='ver en Google Maps'; p.appendChild(a) }
  function confirma(u){ ubic=u; $('mapa').hidden=true; ubiTexto(); $('bMapa').textContent='🗺️ Cambiar ubicación'; $('fLugar').removeAttribute('aria-invalid');
    if(!$('fLugar').value.trim()&&window.MonzuDireccion){ $('fLugar').placeholder='Buscando la dirección…'; window.MonzuDireccion(u).then(function(t){ $('fLugar').placeholder='Ej. San Nicolás, 200 m norte de la iglesia'; if(t&&!$('fLugar').value.trim()) $('fLugar').value=t }) } }
  function abreMapa(){ var m=$('mapa'); if(!window.MonzuMapa) return null; m.hidden=false; if(!mapa) mapa=window.MonzuMapa(m,{lat:ubic&&ubic.lat,lng:ubic&&ubic.lng,alConfirmar:confirma}); return mapa }
  $('bMapa').addEventListener('click',function(){ abreMapa(); ubiTexto('Mueva el mapa hasta que la flecha roja quede donde está el carro y toque “Usar esta ubicación”.') });
  $('bMiUbi').addEventListener('click',function(){ var m=abreMapa(); if(!m) return; ubiTexto('Buscando su ubicación…'); m.miUbicacion(function(t){ ubiTexto(t) }); setTimeout(function(){ if(!ubic) ubiTexto('Revise que la flecha esté en el lugar correcto y toque “Usar esta ubicación”.') },2500) });
  function fmtHora(h){ var p=h.split(':'), n=+p[0]; return (n>12?n-12:n)+':'+p[1]+(n<12?' a. m.':' p. m.') }
  function fmtFecha(f){ var x=new Date(f+'T12:00:00'); return x.toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long'}) }
  function aviso(t){ cajaH.textContent=''; var p=d.createElement('p'); p.className='horas-aviso'; p.textContent=t; cajaH.appendChild(p) }
  function pintaHoras(lista){
    cajaH.textContent=''; horaSel='';
    lista.forEach(function(x){
      var b=d.createElement('button'); b.type='button'; b.className='hora'; b.disabled=!x.libre; b.setAttribute('aria-pressed','false');
      b.textContent=fmtHora(x.h); if(!x.libre){ var s=d.createElement('small'); s.textContent='Ocupada'; b.appendChild(s) }
      b.addEventListener('click',function(){ horaSel=x.h; cajaH.querySelectorAll('.hora').forEach(function(y){ y.setAttribute('aria-pressed',String(y===b)) }); cajaH.removeAttribute('aria-invalid') });
      cajaH.appendChild(b);
    });
    if(!lista.some(function(x){ return x.libre })){ var p=d.createElement('p'); p.className='horas-aviso'; p.textContent='No quedan horas libres ese día. Pruebe otra fecha.'; cajaH.appendChild(p) }
  }
  function cargarHoras(){
    var f=$('fFecha').value; if(!f){ aviso('Elija primero la fecha para ver las horas libres.'); return }
    aviso('Buscando horas libres…');
    fetch('/api/horarios?fecha='+encodeURIComponent(f),{headers:{accept:'application/json'}})
      .then(function(r){ if(!r.ok) throw new Error('api'); return r.json() })
      .then(function(j){ API=true; if(j.cerrado) aviso(j.motivo||'Ese día no hay citas.'); else pintaHoras(j.horas) })
      .catch(function(){ API=false; pintaHoras([{h:'08:00',libre:true},{h:'10:00',libre:true},{h:'13:00',libre:true},{h:'15:00',libre:true}]) });
  }
  d.querySelectorAll('input[name=pago]').forEach(function(i){ i.addEventListener('change',function(){ $('pagos').removeAttribute('aria-invalid') }) });
  $('fFecha').addEventListener('change',cargarHoras); aviso('Elija primero la fecha para ver las horas libres.');

  function mensaje(x,e){
    return 'Hola Monzú Detallados, quiero agendar un detallado.\n\n*Nombre:* '+x.nombre+'\n*Teléfono:* '+x.tel+'\n*Vehículo:* '+x.vehiculo+(x.carro?' ('+x.carro+')':'')+
      '\n*Servicios:*\n'+e.lineas.map(function(l){ return '• '+l[0]+' — '+col(l[1]) }).join('\n')+
      (x.aroma?'\n*Aromatizante:* '+x.aroma:'')+'\n*Total estimado:* '+(e.desde?'desde ':'')+col(e.total)+' (sin domicilio)'+
      '\n*Pago:* '+x.pago+'\n*Fecha:* '+fmtFecha(x.fecha)+'\n*Hora:* '+fmtHora(x.hora)+'\n*Lugar:* '+x.lugar+(x.ubic?'\n*Ubicación:* https://www.google.com/maps?q='+x.ubic.lat+','+x.ubic.lng:'')+(x.nota?'\n*Comentario:* '+x.nota:'')+
      '\n\nAcepté los términos y autoricé el uso de mis datos para esta cita.';
  }
  function abrirWA(txt){ var url='https://wa.me/'+WA+'?text='+encodeURIComponent(txt); var w=window.open(url,'_blank'); if(w) w.opener=null; else location.assign(url) }
  function listo(j,x){
    var L=$('listo'); L.hidden=false;
    var ff=fmtFecha(x.fecha), c=j.cita||{}; $('listoTxt').textContent=ff.charAt(0).toUpperCase()+ff.slice(1)+' · '+fmtHora(x.hora)+'\nPago: '+x.pago+(c.total?' · Total: '+col(c.total):'')+'\nMonzú le confirma la cita por WhatsApp.';
    var M=$('listoMulta'); M.hidden=!(c.multa>0); if(c.multa>0) M.textContent='⚠️ Tiene una multa pendiente de '+col(c.multa)+' por no presentarse a una cita anterior. Ya se sumó al total de esta cita.';
    var A={conpin:'Ya es miembro de Monzú Club 💧 Entre a su tarjeta con su teléfono y su PIN.',pinmal:'Su cita quedó reservada, pero el PIN no coincide. Entre a su tarjeta con su teléfono y su PIN.',bloqueado:'Su cita quedó reservada. Por seguridad, espere 15 minutos para entrar a su tarjeta.',sinpin:'Ya tiene tarjeta Monzú Club: ábrala con el enlace que le enviamos por WhatsApp y cree su PIN.'};
    if(j.tarjeta){
      $('listoTarjeta').href='tarjeta.html?t='+encodeURIComponent(j.tarjeta); $('listoTarjeta').textContent='💧 Ver mi tarjeta Monzú Club';
      $('listoNueva').textContent=j.nueva?(j.tienePin?'¡Bienvenido a Monzú Club! Su usuario es su teléfono '+x.tel+' y su clave el PIN que escogió. Con eso entra a su tarjeta desde cualquier celular.':'¡Bienvenido a Monzú Club! Ya tiene su tarjeta: ábrala y cree su PIN para entrar desde cualquier celular.'):'Cuando terminemos el lavado le sumamos un sello en su tarjeta.';
    } else {
      $('listoTarjeta').href='tarjeta.html'; $('listoTarjeta').textContent='💧 Entrar a mi tarjeta';
      $('listoNueva').textContent=A[j.aviso]||A.conpin;
    }
    estado('',false); L.scrollIntoView({behavior:QUIETO?'auto':'smooth',block:'center'});
  }
  $('listoWA').addEventListener('click',function(){ if(ultimoDato) abrirWA(mensaje(ultimoDato.x,ultimoDato.e)) });
  var ultimoDato=null;
  $('enviar').addEventListener('click',function(){
    if($('fWeb').value) return;
    if(Date.now()-abierto<3000){ estado('Muy rápido. Revise los datos y vuelva a intentar.',true); return }
    if(Date.now()-ultimo<15000){ estado('Su cita ya se envió. Espere unos segundos para enviar otra.',true); return }
    var e=eleccion(), mal=[];
    var x={nombre:limpiar($('fNombre').value,80), tel:limpiar($('fTel').value,16), lugar:limpiar($('fLugar').value,120), carro:limpiar($('fVeh').value,60), nota:limpiar($('fNota').value,400),
      fecha:$('fFecha').value, hora:horaSel, ubic:ubic, pago:(d.querySelector('input[name=pago]:checked')||{}).value||'', pin:$('fPin').value.trim(), vehiculo:e.v==='sedan'?'Sedán':'SUV / Pick up / XL', veh:e.v, paq:e.p, armar:e.p==='armar'?ARMAR_SEL():[], extras:e.xs.map(function(z){ return z.k }), lineas:e.lineas, desde:e.desde, aroma:aroma, consentimiento:true, web:$('fWeb').value};
    var okN=/^[\p{L}\p{M} .'’-]{3,80}$/u.test(x.nombre); $('fNombre').setAttribute('aria-invalid',String(!okN)); if(!okN) mal.push('su nombre');
    var t=x.tel.replace(/[^\d+]/g,'').replace(/^\+?506/,''), okT=/^[2-8]\d{7}$/.test(t); $('fTel').setAttribute('aria-invalid',String(!okT)); if(!okT) mal.push('un teléfono de 8 dígitos');
    var okP=!x.pin||/^\d{4}$/.test(x.pin); $('fPin').setAttribute('aria-invalid',String(!okP)); if(!okP) mal.push('un PIN de 4 números (o déjelo vacío)');
    var okL=x.lugar.length>=4||!!x.ubic; $('fLugar').setAttribute('aria-invalid',String(!okL)); if(!okL) mal.push('la dirección o su ubicación en el mapa');
    var okF=/^\d{4}-\d{2}-\d{2}$/.test(x.fecha); $('fFecha').setAttribute('aria-invalid',String(!okF)); if(!okF) mal.push('la fecha');
    if(okF&&!x.hora){ cajaH.setAttribute('aria-invalid','true'); mal.push('la hora') }
    if(e.p==='armar'&&!ARMAR_SEL().length) mal.push('las opciones de su paquete');
    else if(!e.lineas.length) mal.push('un paquete o adicional');
    $('pagos').setAttribute('aria-invalid',String(!x.pago)); if(!x.pago) mal.push('cómo va a pagar');
    if(!$('okTerminos').checked) mal.push('aceptar los términos');
    if(!$('okDatos').checked) mal.push('autorizar el uso de sus datos');
    if(mal.length){ estado('Falta: '+mal.join(', ')+'.',true); return }
    ultimoDato={x:x,e:e};
    if(!API){ ultimo=Date.now(); abrirWA(mensaje(x,e)); estado('Listo: se abrió WhatsApp con su solicitud. Solo toque Enviar.',false); return }
    var btn=$('enviar'); btn.disabled=true; estado('Reservando su cita…',false);
    fetch('/api/reservar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)})
      .then(function(r){ return r.json().then(function(j){ return {r:r,j:j} }) })
      .then(function(o){
        if(!o.j.ok){ estado(o.j.error||'No se pudo reservar. Intente de nuevo.',true); if(o.r.status===409) cargarHoras(); return }
        ultimo=Date.now(); try{ localStorage.setItem('monzu-tarjeta',o.j.tarjeta) }catch(er){}
        listo(o.j,x); cargarHoras();
      })
      .catch(function(){ ultimo=Date.now(); abrirWA(mensaje(x,e)); estado('No pudimos guardar la cita en línea, así que abrimos WhatsApp con su solicitud.',false) })
      .then(function(){ btn.disabled=false });
  });

  /* ===== precios en vivo: el dueño los cambia en su panel ===== */
  fetch('/api/catalogo',{headers:{accept:'application/json'}}).then(function(r){ return r.json() }).then(function(C){
    if(!C||!C.ok) return;
    ['premium','deluxe'].forEach(function(k){ var P=C.paq[k]; if(!P) return; PAQ[k].sedan=P.sedan; PAQ[k].suv=P.suv; PAQ[k].n=P.n;
      d.querySelectorAll('[data-inc-precio="'+k+'-sedan"]').forEach(function(b){ b.textContent=col(P.sedan) }); d.querySelectorAll('[data-inc-precio="'+k+'-suv"]').forEach(function(b){ b.textContent=col(P.suv) });
      var base=d.querySelector('[data-inc-base="'+k+'"]'); if(base&&P.incluye&&P.incluye.length&&P.incluye.join('|')!==base.dataset.incBase2){
        [].forEach.call(d.querySelectorAll('[data-inc-lista="'+k+'"]'),function(ul){ ul.textContent=''; P.incluye.forEach(function(t){ var li=d.createElement('li'); li.textContent=t; ul.appendChild(li) }) }) } });
    var marcados=[].map.call(cajaEx.querySelectorAll('input:checked'),function(i){ return i.value });
    EXTRAS.length=0; Object.keys(C.ext).forEach(function(k){ var x=C.ext[k]; EXTRAS.push({k:k,n:x.n,p:x.p,conPaq:x.conPaq,desde:x.desde,d:x.desde?'Desde '+col(x.p):(x.conPaq!=null?col(x.conPaq)+' con detallado':'')}) });
    cajaEx.textContent=''; EXTRAS.forEach(function(x){ var l=d.createElement('label'); l.className='op'; var i=d.createElement('input'); i.type='checkbox'; i.value=x.k; i.checked=marcados.indexOf(x.k)>=0; var sp=d.createElement('span'); sp.textContent=x.n; var sm=d.createElement('small'); sm.textContent=x.d||col(x.p); sp.appendChild(sm); l.appendChild(i); l.appendChild(sp); cajaEx.appendChild(l) });
    d.querySelectorAll('[data-x]').forEach(function(b){ var x=C.ext[b.dataset.x], art=b.closest('article'); if(!x){ if(art) art.hidden=true; return }
      b.textContent=(x.desde?'Desde ':'')+col(x.p); if(x.conPaq!=null){ var sm=d.createElement('small'); sm.textContent=' · '+col(x.conPaq)+' si lo suma a un detallado'; b.appendChild(sm) } });
    /* paquetes nuevos que agregó el dueño */
    var antesNinguno=$('opNinguno'), caja=d.querySelector('.paquetes');
    Object.keys(C.paq).forEach(function(k){ if(k==='premium'||k==='deluxe'||PAQ[k]) return; var P=C.paq[k]; PAQ[k]={sedan:P.sedan,suv:P.suv,n:P.n};
      var l=d.createElement('label'); l.className='op'; var i=d.createElement('input'); i.type='radio'; i.name='paq'; i.value=k; var sp=d.createElement('span'); sp.textContent=P.n.replace(/^Detallado /,''); var sm=d.createElement('small'); sm.setAttribute('data-precio',k); sp.appendChild(sm); l.appendChild(i); l.appendChild(sp); antesNinguno.parentNode.insertBefore(l,antesNinguno);
      if(caja){ var a=d.createElement('article'); a.className='paq in'; var h=d.createElement('h3'); h.className='t'; var hs=d.createElement('small'); hs.textContent='Paquete'; h.appendChild(hs); h.appendChild(d.createTextNode(P.n.replace(/^Detallado /,''))); a.appendChild(h);
        var pr=d.createElement('div'); pr.className='precio'; var pb=d.createElement('b'); pb.setAttribute('data-precio',k); var ps=d.createElement('span'); ps.setAttribute('data-tipo',''); pr.appendChild(pb); pr.appendChild(ps); a.appendChild(pr);
        var ul=d.createElement('ul'); (P.incluye||[]).forEach(function(x){ var li=d.createElement('li'); li.textContent=x; ul.appendChild(li) }); a.appendChild(ul);
        var bt=d.createElement('a'); bt.className='btn btn-b'; bt.href='#agendar'; bt.textContent='Quiero el '+P.n.replace(/^Detallado /,''); bt.addEventListener('click',function(){ i.checked=true; cotiza() }); a.appendChild(bt); caja.appendChild(a) } });
    /* "Arme su paquete" */
    if(C.armar&&C.armar.items&&Object.keys(C.armar.items).length){ ARMAR=C.armar;
      $('opArmarL').hidden=false; $('opArmarN').textContent=C.armar.n; $('armarCard').hidden=false; $('armarTit').textContent=C.armar.n; if(C.armar.desc) $('armarDesc').textContent=C.armar.desc;
      [['armarLista','ac-op','tarjetaArmar'],['armarItems','op','formArmar']].forEach(function(z){ var cont=$(z[0]); cont.textContent='';
        Object.keys(C.armar.items).forEach(function(k){ var it=C.armar.items[k], l=d.createElement('label'); l.className=z[1]; var i=d.createElement('input'); i.type='checkbox'; i.value=k; var sp=d.createElement('span'); sp.appendChild(d.createTextNode(it.n)); var sm=d.createElement('small'); sm.setAttribute('data-armar',k); sp.appendChild(sm); l.appendChild(i); l.appendChild(sp); cont.appendChild(l) }) });
      $('armarLista').addEventListener('change',pintaDinamicos);
      $('armarReservar').addEventListener('click',function(){ var sel=[].map.call($('armarLista').querySelectorAll('input:checked'),function(i){ return i.value });
        if(!sel.length){ $('armarTotal').textContent='Escoja algo'; return }
        [].forEach.call($('armarItems').querySelectorAll('input'),function(i){ i.checked=sel.indexOf(i.value)>=0 }); d.querySelector('input[name=paq][value=armar]').checked=true; $('armarF').hidden=false; cotiza(); $('agendar').scrollIntoView({behavior:QUIETO?'auto':'smooth'}) });
    }
    pintaPaquetes();
  }).catch(function(){});
  /* precios que dependen del vehículo en lo que se llenó en vivo */
  function pintaDinamicos(){
    d.querySelectorAll('[data-armar]').forEach(function(s){ var it=ARMAR.items[s.dataset.armar]; if(it) s.textContent=col(it[veh]) });
    var t=0; [].forEach.call(d.querySelectorAll('#armarLista input:checked'),function(i){ var it=ARMAR.items[i.value]; if(it) t+=it[veh] }); if($('armarTotal')) $('armarTotal').textContent=col(t);
    var arm=d.querySelector('input[name=paq][value=armar]'); if($('armarF')) $('armarF').hidden=!(arm&&arm.checked);
  }
  $('form').addEventListener('change',pintaDinamicos);

  /* ===== videos de trabajos: se reproducen solos (sin sonido) solo cuando se ven ===== */
  (function(){ var vs=d.querySelectorAll('.clip video, .paq-vid'); if(!vs.length) return;
    if(!('IntersectionObserver' in window)){ vs.forEach(function(v){ v.preload='metadata' }); return }
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ var v=e.target; if(e.isIntersecting&&!QUIETO){ v.preload='auto'; var p=v.play(); if(p&&p.catch) p.catch(function(){}) } else v.pause() }) },{threshold:.3});
    vs.forEach(function(v){ io.observe(v) }) })();
