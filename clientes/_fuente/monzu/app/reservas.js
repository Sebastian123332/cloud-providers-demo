  /* ===== reservas con horario real (Netlify Functions) ===== */
  var abierto=Date.now(), ultimo=0, horaSel='', API=true;
  function estado(t,mal){ var s=$('estado'); s.textContent=t; s.className='estado '+(mal?'mal':'bien') }
  var cajaH=$('horas');
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
  $('fFecha').addEventListener('change',cargarHoras); aviso('Elija primero la fecha para ver las horas libres.');

  function mensaje(x,e){
    return 'Hola Monzú Detallados, quiero agendar un detallado.\n\n*Nombre:* '+x.nombre+'\n*Teléfono:* '+x.tel+'\n*Vehículo:* '+x.vehiculo+(x.carro?' ('+x.carro+')':'')+
      '\n*Servicios:*\n'+e.lineas.map(function(l){ return '• '+l[0]+' — '+col(l[1]) }).join('\n')+
      (x.aroma?'\n*Aromatizante:* '+x.aroma:'')+'\n*Total estimado:* '+(e.desde?'desde ':'')+col(e.total)+' (sin domicilio)'+
      '\n*Fecha:* '+fmtFecha(x.fecha)+'\n*Hora:* '+fmtHora(x.hora)+'\n*Lugar:* '+x.lugar+(x.nota?'\n*Comentario:* '+x.nota:'')+
      '\n\nAcepté los términos y autoricé el uso de mis datos para esta cita.';
  }
  function abrirWA(txt){ var url='https://wa.me/'+WA+'?text='+encodeURIComponent(txt); var w=window.open(url,'_blank'); if(w) w.opener=null; else location.assign(url) }
  function listo(j,x){
    var L=$('listo'); L.hidden=false;
    var ff=fmtFecha(x.fecha); $('listoTxt').textContent=ff.charAt(0).toUpperCase()+ff.slice(1)+' · '+fmtHora(x.hora)+'\nMonzú le confirma la cita por WhatsApp.';
    $('listoTarjeta').href='tarjeta.html?t='+encodeURIComponent(j.tarjeta);
    $('listoNueva').textContent=j.nueva?'¡Bienvenido a Monzú Club! Ya tiene su tarjeta: guárdela en su celular y junte sellos.':'Cuando terminemos el lavado le sumamos un sello en su tarjeta.';
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
      fecha:$('fFecha').value, hora:horaSel, vehiculo:e.v==='sedan'?'Sedán':'SUV / Pick up / XL', lineas:e.lineas, desde:e.desde, aroma:aroma, consentimiento:true, web:$('fWeb').value};
    var okN=/^[\p{L}\p{M} .'’-]{3,80}$/u.test(x.nombre); $('fNombre').setAttribute('aria-invalid',String(!okN)); if(!okN) mal.push('su nombre');
    var t=x.tel.replace(/[^\d+]/g,'').replace(/^\+?506/,''), okT=/^[2-8]\d{7}$/.test(t); $('fTel').setAttribute('aria-invalid',String(!okT)); if(!okT) mal.push('un teléfono de 8 dígitos');
    var okL=x.lugar.length>=4; $('fLugar').setAttribute('aria-invalid',String(!okL)); if(!okL) mal.push('la dirección o zona');
    var okF=/^\d{4}-\d{2}-\d{2}$/.test(x.fecha); $('fFecha').setAttribute('aria-invalid',String(!okF)); if(!okF) mal.push('la fecha');
    if(okF&&!x.hora){ cajaH.setAttribute('aria-invalid','true'); mal.push('la hora') }
    if(!e.lineas.length) mal.push('un paquete o adicional');
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
