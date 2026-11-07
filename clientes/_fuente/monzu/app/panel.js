(function(){
  'use strict';
  var d=document, $=function(i){ return d.getElementById(i) };
  var ultimoTel='', GUARDA='monzu-panel-sesion', clave='', datos=null, filtro='hoy', vistos=null, tPoll=null, stream=null, rafId=0;
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
  function hojaWA(titulo,tel,txt){
    var h=$('hojaWA'); h.textContent='';
    h.appendChild(el('b',null,titulo));
    var a=el('a','btn b-wa','Enviar por WhatsApp'); a.href='https://wa.me/506'+tel+'?text='+encodeURIComponent(txt); a.target='_blank'; a.rel='noopener noreferrer';
    a.addEventListener('click',function(){ setTimeout(function(){ h.hidden=true },300) });
    var c=boton('Ahora no','b-bor',function(){ h.hidden=true }); h.appendChild(a); h.appendChild(c); h.hidden=false;
  }
  /* confirmación dentro de la página (confirm() no funciona bien en todos los celulares) */
  function pregunta(texto,si){
    return new Promise(function(listo){ var D=$('dlg'); $('dlgTxt').textContent=texto; $('dlgSi').textContent=si||'Sí'; D.hidden=false; $('dlgNo').focus();
      function fin(v){ D.hidden=true; $('dlgSi').onclick=null; $('dlgNo').onclick=null; listo(v) } $('dlgSi').onclick=function(){ fin(true) }; $('dlgNo').onclick=function(){ fin(false) } });
  }
  function siPregunta(texto,si,fn){ return function(){ pregunta(texto,si).then(function(ok){ if(ok) fn() }) } }
  function abrirWA(tel,txt){ var url='https://wa.me/506'+tel+'?text='+encodeURIComponent(txt); var w=window.open(url,'_blank'); if(w) w.opener=null; else location.assign(url) }

  /* ---------- API ---------- */
  function api(ruta,cuerpo){
    var op={headers:{authorization:'Bearer '+clave,accept:'application/json'},cache:'no-store'};
    if(cuerpo){ op.method='POST'; op.headers['content-type']='application/json'; op.body=JSON.stringify(cuerpo) }
    return fetch('/api/panel/'+ruta,op).then(function(r){ return r.json().catch(function(){ return {ok:false,error:'Respuesta inválida del servidor.'} }).then(function(j){ j.status=r.status; return j }) });
  }

  /* ---------- entrar / salir ---------- */
  try{ clave=localStorage.getItem(GUARDA)||sessionStorage.getItem(GUARDA)||'' }catch(e){}
  $('verClave').addEventListener('click',function(){ var i=$('clave'), ver=i.type==='password'; i.type=ver?'text':'password'; this.setAttribute('aria-pressed',String(ver)); this.setAttribute('aria-label',ver?'Ocultar la contraseña':'Mostrar la contraseña'); i.focus() });
  $('login').addEventListener('submit',function(e){
    e.preventDefault(); var c=$('clave').value; if(!c){ $('loginMsg').textContent='Escriba la contraseña.'; $('loginMsg').className='msg mal'; return }
    $('entrar').disabled=true; var rec=$('recordar').checked;
    fetch('/api/panel/login',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},cache:'no-store',body:JSON.stringify({clave:c,recordar:rec})})
      .then(function(r){ return r.json() }).then(function(j){
        $('entrar').disabled=false; $('clave').value='';
        if(!j.ok){ $('loginMsg').textContent=j.error||'No se pudo entrar.'; $('loginMsg').className='msg mal'; return }
        clave=j.sesion; try{ (rec?localStorage:sessionStorage).setItem(GUARDA,clave) }catch(er){}
        api('resumen').then(function(k){ if(k.ok) arrancar(k); else { $('loginMsg').textContent=k.error||'No se pudo entrar.'; $('loginMsg').className='msg mal' } });
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
    $('actualizado').textContent='Actualizado '+new Date().toLocaleTimeString('es-CR',{hour:'numeric',minute:'2-digit'});
    var editando=function(id){ return !!d.querySelector('#'+id+' .editar, #'+id+' .mover') };   // no se borra un formulario abierto
    kpis(); cargaRep(); recordatorios(); if(!editando('listaCitas')) citas(); if(!editando('listaCli')) clientes(); if(!editando('listaFijas')) fijas(); ajustes(); llenaCHora(); calendario(); espacio(); if($('sec-ganancias').classList.contains('on')) reporte();
  }
  /* ---------- dashboard: tarjetas, gráfico de ventas y meta del mes ---------- */
  var rep=null, rango=30;
  function cargaRep(){ return api('reporte').then(function(j){ if(j.ok){ rep=j; kpis(); grafica(); metaMes() } }).catch(function(){}) }
  function pill(act,ant){ var p=el('span','pill'); if(!ant&&!act){ p.className='pill igual'; p.textContent='—'; return p } if(!ant){ p.textContent='▲ nuevo'; return p }
    var v=Math.round((act-ant)/ant*100); p.className='pill'+(v<0?' baja':v===0?' igual':''); p.textContent=(v>0?'▲ +':v<0?'▼ ':'')+v+'%'; return p }
  function kpis(){
    var k=$('kpis'); k.textContent=''; var h=datos.citas.filter(function(c){ return c.fecha===datos.hoy && c.estado!=='cancelada' }), D=rep?rep.dias:[];
    var n=D.length, hoyT=n?D[n-1].total:0, mismoDia=n>7?D[n-8].total:0, s7=0, p7=0; for(var i=0;i<n;i++){ if(i>=n-7) s7+=D[i].total; else if(i>=n-14) p7+=D[i].total }
    var dsem=new Date(datos.hoy+'T12:00:00Z').toLocaleDateString('es-CR',{weekday:'long',timeZone:'UTC'});
    var porConf=datos.citas.filter(function(c){ return c.estado==='pendiente' && c.fecha>=datos.hoy }).length;
    [['Hoy hasta ahora',col(hoyT),pill(hoyT,mismoDia),'vs el '+dsem+' pasado'],['Últimos 7 días',col(s7),pill(s7,p7),'vs los 7 días anteriores'],
     ['Citas hoy',String(h.length),null,porConf+' por confirmar'],['Clientes en el club',String(datos.clientes.length),null,datos.clientes.filter(function(c){ return c.sellos>=datos.meta }).length+' premios listos']]
      .forEach(function(x){ var e=el('div'); e.appendChild(el('small',null,x[0])); e.appendChild(el('b',null,x[1])); if(x[2]){ var f=el('div'); f.appendChild(x[2]); f.appendChild(el('span','sub',' '+x[3])); e.appendChild(f) } else e.appendChild(el('span','sub',x[3])); k.appendChild(e) });
    var hr=+new Date(datos.ahora-6*36e5).toISOString().slice(11,13); $('saludo').textContent=(hr<12?'Buenos días':hr<19?'Buenas tardes':'Buenas noches')+', Monzú 👋';
    var f=new Date(datos.hoy+'T12:00:00Z').toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'}); $('fechaHoy').textContent=f.charAt(0).toUpperCase()+f.slice(1)+' · Panel';
  }
  function grafica(){
    if(!rep) return; var D=rep.dias.slice(-rango), sv=$('chart'), W=600, Hh=200, mx=Math.max.apply(null,D.map(function(x){ return x.total }).concat([1000]));
    mx=Math.ceil(mx/10000)*10000; sv.textContent='';
    var pts=D.map(function(x,i){ return [D.length===1?W/2:i*W/(D.length-1), Hh-8-(x.total/mx)*(Hh-20)] });
    function curva(p){ var dd='M'+p[0][0]+' '+p[0][1]; for(var i=0;i<p.length-1;i++){ var a=p[i-1]||p[i], b=p[i], c=p[i+1], e=p[i+2]||c; dd+=' C'+(b[0]+(c[0]-a[0])/6)+' '+(b[1]+(c[1]-a[1])/6)+','+(c[0]-(e[0]-b[0])/6)+' '+(c[1]-(e[1]-b[1])/6)+','+c[0]+' '+c[1] } return dd }
    var defs=d.createElementNS(NS,'defs'), lg=d.createElementNS(NS,'linearGradient'); lg.id='gArea'; lg.setAttribute('x1','0'); lg.setAttribute('x2','0'); lg.setAttribute('y1','0'); lg.setAttribute('y2','1');
    [['0','rgba(59,130,246,.45)'],['1','rgba(59,130,246,0)']].forEach(function(z){ var st=d.createElementNS(NS,'stop'); st.setAttribute('offset',z[0]); st.setAttribute('stop-color',z[1]); lg.appendChild(st) }); defs.appendChild(lg); sv.appendChild(defs);
    var cv=curva(pts), area=d.createElementNS(NS,'path'); area.setAttribute('d',cv+' L'+W+' '+Hh+' L0 '+Hh+' Z'); area.setAttribute('fill','url(#gArea)'); sv.appendChild(area);
    var ln=d.createElementNS(NS,'path'); ln.setAttribute('d',cv); ln.setAttribute('fill','none'); ln.setAttribute('stroke','#60A5FA'); ln.setAttribute('stroke-width','2.5'); ln.setAttribute('vector-effect','non-scaling-stroke'); sv.appendChild(ln);
    var y=$('chY'); y.textContent=''; [mx,mx/2,0].forEach(function(v){ y.appendChild(el('span',null,v?'₡'+(v>=1000?String(Math.round(v/100)/10).replace('.',',')+'k':v):'')) });
    var X=$('chX'); X.textContent=''; [0,Math.floor((D.length-1)/2),D.length-1].forEach(function(i){ var f=new Date(D[i].fecha+'T12:00:00Z'); X.appendChild(el('span',null,f.getUTCDate()+' '+f.toLocaleDateString('es-CR',{month:'short',timeZone:'UTC'}))) });
    var tot=D.reduce(function(a,x){ return a+x.total },0), n=D.reduce(function(a,x){ return a+x.citas },0); $('chSub').textContent=col(tot)+' en '+n+(n===1?' lavado':' lavados')+' · últimos '+rango+' días';
  }
  d.querySelectorAll('.rangos button').forEach(function(b){ b.addEventListener('click',function(){ rango=+b.dataset.r; d.querySelectorAll('.rangos button').forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)) }); grafica() }) });
  function metaMes(){
    if(!rep) return; var M=rep.periodos.mes, meta=datos.config.metaMes||rep.periodos.mesAnterior.total||0, hoy=datos.hoy;
    var mesN=new Date(hoy+'T12:00:00Z').toLocaleDateString('es-CR',{month:'long',timeZone:'UTC'}), ult=new Date(Date.UTC(+hoy.slice(0,4),+hoy.slice(5,7),0)).getUTCDate(), quedan=ult-(+hoy.slice(8))+1;
    $('metaTit').textContent='Meta de '+mesN; $('metaSub').textContent=quedan+(quedan===1?' día':' días')+' para terminar el mes';
    var pct=meta?Math.min(100,Math.round(M.total/meta*100)):0; $('metaPct').textContent=meta?pct+'%':'—'; $('metaDe').textContent=meta?'de '+col(meta):'Ponga su meta en Ajustes';
    $('anillo').style.strokeDashoffset=String(314.16*(1-pct/100));
    var L=$('metaL'); L.textContent=''; [['Ganado este mes',col(M.total)],['Falta por día',meta&&M.total<meta?col(Math.ceil((meta-M.total)/quedan)):'—'],['Mes pasado',col(rep.periodos.mesAnterior.total)]].forEach(function(x){ var r=el('div'); r.appendChild(el('span',null,x[0])); r.appendChild(el('b',null,x[1])); L.appendChild(r) });
    if(!$('mMonto').value && datos.config.metaMes) $('mMonto').value=datos.config.metaMes;
  }
  $('mGuardar').addEventListener('click',function(){ var m=$('mMeta'); api('meta',{monto:$('mMonto').value}).then(function(j){ m.textContent=j.ok?'✓ Meta guardada.':(j.error||'No se pudo.'); m.className=j.ok?'msg bien':'msg mal'; if(j.ok) refrescar() }) });
  var NOM={pendiente:'Por confirmar',confirmada:'Confirmada',hecha:'Terminada',cancelada:'Cancelada',ausente:'No llegó'};
  var REC={push:'✓ al celular',whatsapp:'✓ WhatsApp','whatsapp+push':'✓ WhatsApp y celular',"sin-notificaciones":'no se pudo enviar',tarde:'no aplicó'};
  function citas(){
    var L=$('listaCitas'); L.textContent='';
    var lista=datos.citas.filter(function(c){
      if(filtro==='dia') return c.fecha===diaSel && c.estado!=='cancelada';
      if(filtro==='hoy') return c.fecha===datos.hoy;
      if(filtro==='prox') return c.fecha>=datos.hoy && c.estado!=='cancelada' && c.estado!=='hecha';
      if(filtro==='pend') return c.estado==='pendiente' && c.fecha>=datos.hoy;
      return c.fecha<datos.hoy || c.estado==='hecha';
    });
    if(filtro==='pasadas') lista.reverse();
    if(filtro==='dia'){ L.appendChild(boton('＋ Agendar cita '+elDia(diaSel),'b-tq dia-ag',function(){ abreFija(null,{fecha:diaSel}) })); var dt=el('div','dia-tit'), tl=fmtDia(diaSel); dt.appendChild(el('span',null,(tl==='Hoy'||tl==='Mañana'||tl==='Ayer'?tl:tl)+' · '+lista.length+(lista.length===1?' cita':' citas'))); dt.appendChild(boton('Ver próximas','',function(){ d.querySelector('.filtros button[data-f=prox]').click() })); L.appendChild(dt) }
    if(!lista.length){ L.appendChild(el('p','vacio',filtro==='dia'?'No hay citas ese día.':filtro==='hoy'?'No hay citas para hoy.':'No hay citas en esta lista.')); return }
    var dia='';
    lista.forEach(function(c){
      if(c.fecha!==dia){ dia=c.fecha; L.appendChild(el('p','dia',fmtDia(dia))) }
      var box=el('article','cita '+c.estado+(vistos&&$('badge').hidden===false&&c.estado==='pendiente'?' nueva':''));
      var top=el('div','c-top'); top.appendChild(el('b',null,fmtH(c.hora))); var chs=el('div','chips-c'); if(c.fija) chs.appendChild(el('span','chip fija','🔁 Fija')); chs.appendChild(el('span','chip '+c.estado,NOM[c.estado])); top.appendChild(chs); box.appendChild(top);
      box.appendChild(el('h3',null,c.nombre));
      var p=el('p'); var tel=el('a',null,c.tel.slice(0,4)+'-'+c.tel.slice(4)); tel.href='tel:+506'+c.tel; p.appendChild(tel); p.appendChild(d.createTextNode(' · '+c.vehiculo+(c.carro?' · '+c.carro:''))); box.appendChild(p);
      var p2=el('p'), lug=el('a',null,'📍 '+c.lugar); lug.target='_blank'; lug.rel='noopener noreferrer';
      lug.href=c.ubic?'https://www.google.com/maps/search/?api=1&query='+c.ubic.lat+','+c.ubic.lng:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.lugar+', Cartago, Costa Rica'); p2.appendChild(lug);
      if(c.ubic){ p2.appendChild(d.createTextNode(' · ')); var wz=el('a',null,'Waze'); wz.href='https://waze.com/ul?ll='+c.ubic.lat+','+c.ubic.lng+'&navigate=yes'; wz.target='_blank'; wz.rel='noopener noreferrer'; p2.appendChild(wz); p2.appendChild(el('span',null,' · ubicación marcada en el mapa ✓')) }
      box.appendChild(p2);
      var ch=el('div','chips-c'); if(c.pago) ch.appendChild(el('span','chip '+(c.pagado?'pagado':''),(c.pagado?'✓ Pagado · ':'💳 ')+c.pago));
      if(c.estado==='pendiente'||c.estado==='confirmada'){ if(c.r24) ch.appendChild(el('span','chip confirmada','🔔 24 h: '+(REC[c.r24]||c.r24))); if(c.r1) ch.appendChild(el('span','chip confirmada','🔔 1 h: '+(REC[c.r1]||c.r1))) }
      if(ch.childNodes.length) box.appendChild(ch);
      if(c.cambiada) box.appendChild(el('p',null,'🔁 El cliente la cambió (antes: '+c.cambiada+')'));
      if(c.encuesta){ var en=c.encuesta; box.appendChild(el('p','opi','★★★★★'.slice(0,en.general)+'☆☆☆☆☆'.slice(0,5-en.general)+' Opinión del cliente'+(en.comentario?': “'+en.comentario+'”':''))) }
      if(c.multa>0) box.appendChild(el('p','alerta','⚠️ Incluye multa pendiente de '+col(c.multa)+' por no presentarse antes.'));
      else if(c.multaCliente>0 && c.estado!=='ausente') box.appendChild(el('p','alerta','⚠️ Este cliente debe una multa de '+col(c.multaCliente)+'.'));
      var sv=el('div','servs'); c.lineas.forEach(function(l){ var r=el('div'); r.appendChild(el('span',null,l[0])); r.appendChild(el('span',null,col(l[1]))); sv.appendChild(r) });
      var tt=el('div','tot'); tt.appendChild(el('span',null,'Total estimado')); tt.appendChild(el('span',null,(c.desde?'desde ':'')+col(c.total))); sv.appendChild(tt); box.appendChild(sv);
      if(c.aroma) box.appendChild(el('p',null,'🌸 Aroma: '+c.aroma));
      if(c.nota) box.appendChild(el('p',null,'💬 '+c.nota));
      box.appendChild(mini(c.sellos,datos.meta));
      var acc=el('div','acc');
      if(c.estado==='pendiente'){
        acc.appendChild(boton('Confirmar','b-tq',function(){ accion(c,'confirmar',function(){ hojaWA('✓ Cita confirmada. Avísele a '+c.nombre.split(' ')[0]+':',c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! 👋 Le confirmamos su cita en Monzú Detallados para el '+fmtDia(c.fecha).toLowerCase()+' a las '+fmtH(c.hora)+' en '+c.lugar+'.\n\nSu tarjeta Monzú Club 💧: '+enlaceTarjeta(c.tarjeta)+'\nGuárdela en su celular y junte sellos para su lavado gratis.') }) },'ok'));
        acc.appendChild(boton('Cancelar','b-rojo',siPregunta('¿Cancelar la cita de '+c.nombre+'? La hora queda libre otra vez.','Sí, cancelar',function(){ accion(c,'cancelar') }),'x'));
      } else if(c.estado==='confirmada'){
        if(c.sellos>=datos.meta) acc.appendChild(boton('Canjear lavado gratis','b-oro',function(){ canjear(c.tarjeta,c.nombre) },'regalo'));
        acc.appendChild(boton('Terminado: dar sello','b-ok',function(){ accion(c,'terminar',function(j){ toast('✓ Sello agregado a '+c.nombre.split(' ')[0]+(c.sellos+1>=datos.meta?' · ¡Completó su tarjeta! 🎁':'')); trasTerminar(c,j) }) },'ok'));
        acc.appendChild(boton('WhatsApp','b-wa',function(){ abrirWA(c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! Le escribimos de Monzú Detallados sobre su cita del '+fmtDia(c.fecha).toLowerCase()+' a las '+fmtH(c.hora)+'.') },'wa'));
        acc.appendChild(boton(c.pagado?'Quitar pagado':'Marcar pagado','b-bor',function(){ accion(c,'pagado') }));
        if(c.inicio<=datos.ahora) acc.appendChild(boton('No llegó (multa)','b-rojo',siPregunta('¿'+c.nombre+' no llegó? Se le cobra una multa de '+col(datos.multaMonto)+' en su próxima cita.','Sí, no llegó',function(){ accion(c,'ausente',function(){ toast('Multa registrada. Saldrá en su próxima reserva.') }) })));
        acc.appendChild(boton('Cancelar','b-rojo',siPregunta('¿Cancelar la cita de '+c.nombre+'?','Sí, cancelar',function(){ accion(c,'cancelar') }),'x'));
      } else if(c.estado==='hecha'){
        if(c.sellos>=datos.meta) acc.appendChild(boton('Canjear lavado gratis','b-oro',function(){ canjear(c.tarjeta,c.nombre) },'regalo'));
        acc.appendChild(boton(c.pagado?'Quitar pagado':'Marcar pagado','b-bor',function(){ accion(c,'pagado') }));
      }
      if(c.estado==='pendiente'||c.estado==='confirmada') acc.appendChild(boton('Mover','b-bor',function(){ formMover(c,box) }));
      if(c.estado!=='cancelada') acc.appendChild(boton('✏️ Editar','b-bor',function(){ formEditar(c,box) }));
      if((c.estado==='pendiente'||c.estado==='confirmada')&&!c.fija){ var dsm=['domingos','lunes','martes','miércoles','jueves','viernes','sábados'][new Date(c.fecha+'T12:00:00Z').getUTCDay()];
        acc.appendChild(boton('🔁 Repetir cada semana','b-bor',siPregunta('¿Dejar a '+c.nombre+' con cita fija todos los '+dsm+' a las '+fmtH(c.hora)+'? Se le apartan solas las próximas semanas.','Sí, dejar fija',function(){
          api('fijar',{id:c.id}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } var nom=c.nombre.split(' ')[0];
            if(j.choques.length) toast('⚠️ '+j.choques.length+' semana(s) ya tenían otra cita a esa hora.',true); else toast('✓ Cita fija: '+(j.creadas+1)+' citas apartadas.');
            hojaWA('Avísele a '+nom+':',c.tel,'¡Hola '+nom+'! 👋 Le dejamos su cita fija en Monzú Detallados todos los '+dsm+' a las '+fmtH(c.hora)+'. Le llegan recordatorios antes de cada una y las puede ver o cambiar en su tarjeta: '+enlaceTarjeta(j.tarjeta)); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) }))) }
      if(acc.childNodes.length) box.appendChild(acc);
      L.appendChild(box);
    });
  }
  /* recordatorios de las próximas 24 horas: si el cliente no tiene notificaciones, se le manda por WhatsApp con un toque */
  function recordatorios(){
    var R=$('recs'); R.textContent='';
    var l=datos.citas.filter(function(c){ return (c.estado==='pendiente'||c.estado==='confirmada') && c.inicio>datos.ahora && c.inicio-datos.ahora<=24*36e5 });
    if(!l.length){ R.hidden=true; return } R.hidden=false;
    R.appendChild(el('b',null,datos.waAuto?'🔔 Recordatorios automáticos por WhatsApp (no tiene que hacer nada)':'🔔 Recordatorios de las próximas 24 horas'));
    l.forEach(function(c){ var f=el('div','rec'), t=el('div'); t.appendChild(el('span',null,fmtDia(c.fecha)+' '+fmtH(c.hora)+' · '+c.nombre));
      var est=c.r1||c.r24, fallo=est==='sin-notificaciones';
      t.appendChild(el('small',null,est&&!fallo?'Recordatorio enviado '+(REC[est]||''):datos.waAuto?'Se le envía solo por WhatsApp 24 h y 1 h antes':c.conNotificaciones?'Le llega solo al celular':'No activó notificaciones: mándelo por WhatsApp')); f.appendChild(t);
      if(fallo||(!datos.waAuto&&!c.conNotificaciones)) f.appendChild(boton('Recordar','b-wa',function(){ abrirWA(c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! 👋 Le recordamos su cita con Monzú Detallados '+fmtDia(c.fecha).toLowerCase()+' a las '+fmtH(c.hora)+' en '+c.lugar+'. Si no puede, cancele o cambie la hora desde su tarjeta: '+enlaceTarjeta(c.tarjeta)) },'wa'));
      R.appendChild(f) });
  }
  function accion(c,a,despues){
    api('cita',{id:c.id,accion:a}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } if(a==='cancelar') toast('Cita cancelada.'); if(a==='pagado') toast('✓ Pago actualizado.'); if(a==='confirmar') toast('✓ Cita confirmada. Avísele por WhatsApp.'); if(despues) despues(j); refrescar() })
      .catch(function(){ toast('Sin conexión. Intente de nuevo.',true) });
  }
  function sello(tk,nombre,fin){ api('sello',{t:tk,motivo:'Lavado'}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('✓ Sello agregado a '+nombre.split(' ')[0]+' ('+j.tarjeta.sellos+'/'+j.tarjeta.meta+')'+(j.tarjeta.sellos>=j.tarjeta.meta?' 🎁':'')); if(fin) fin(j); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) }
  function canjear(tk,nombre,fin){ pregunta('¿Canjear el lavado gratis de '+nombre+'? Su tarjeta vuelve a 0 sellos.','Sí, canjear').then(function(ok){ if(ok) canjearYa(tk,nombre,fin) }) }
  function canjearYa(tk,nombre,fin){ api('canjear',{t:tk}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('🎁 Premio canjeado. Tarjeta de '+nombre.split(' ')[0]+' reiniciada.'); if(fin) fin(j); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) }
  d.querySelectorAll('.filtros button').forEach(function(b){ b.addEventListener('click',function(){ filtro=b.dataset.f; diaSel=''; calendario(); d.querySelectorAll('.filtros button').forEach(function(x){ x.setAttribute('aria-pressed',String(x===b)) }); citas() }) });

  /* ---------- clientes ---------- */
  function clientes(){
    var L=$('listaCli'), q=$('buscar').value.trim().toLowerCase(); L.textContent='';
    var lista=datos.clientes.slice().sort(function(a,b){ return String(b.creado||'').localeCompare(String(a.creado||'')) }).filter(function(c){ return !q || c.nombre.toLowerCase().indexOf(q)>=0 || c.tel.indexOf(q.replace(/\D/g,''))>=0&&q.replace(/\D/g,'') });
    if(!lista.length){ L.appendChild(el('p','vacio',datos.clientes.length?'No hay clientes con esa búsqueda.':'Todavía no hay clientes. Se agregan solos con la primera reserva.')); return }
    lista.forEach(function(c){
      var box=el('div','cli'+(c.tel===ultimoTel?' recien':'')), top=el('div','cli-top'), izq=el('div');
      var nb=el('b',null,c.nombre); if(!c.tienePin) nb.appendChild(el('span','sinpin','Sin PIN')); izq.appendChild(nb); izq.appendChild(el('small',null,c.tel.slice(0,4)+'-'+c.tel.slice(4)+(c.carro?' · '+c.carro:'')+(c.premios?' · '+c.premios+' premio(s) canjeado(s)':'')));
      var em=el('em',null,c.sellos>=datos.meta?'🎁 Premio':c.sellos+'/'+datos.meta); if(c.sellos>=datos.meta) em.className='oro';
      top.appendChild(izq); top.appendChild(em); box.appendChild(top); box.appendChild(mini(c.sellos,datos.meta));
      var acc=el('div','acc');
      if(c.sellos>=datos.meta) acc.appendChild(boton('Canjear premio','b-oro',function(){ canjear(c.tarjeta,c.nombre) },'regalo'));
      else acc.appendChild(boton('Dar sello','b-ok',siPregunta('¿Dar un sello a '+c.nombre+'?','Sí, dar sello',function(){ sello(c.tarjeta,c.nombre) }),'gota'));
      if(c.multa>0) acc.appendChild(boton('Anular multa','b-bor',siPregunta('¿Anular la multa de '+col(c.multa)+' de '+c.nombre+'?','Sí, anular',function(){ api('perdonar-multa',{t:c.tarjeta}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('Multa anulada.'); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) })));
      acc.appendChild(boton('✏️ Editar','b-bor',function(){ formCliente(c,box) }));
      acc.appendChild(boton('Enviar tarjeta','b-wa',function(){ abrirWA(c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! 💧 Esta es su tarjeta Monzú Club, donde ve sus sellos: '+enlaceTarjeta(c.tarjeta)+'\nGuárdela en la pantalla de inicio de su celular para tenerla siempre a mano.') },'wa'));
      if(c.tienePin) acc.appendChild(boton('Restablecer PIN','b-bor',siPregunta('¿Restablecer el PIN de '+c.nombre+'? Le enviamos su tarjeta por WhatsApp para que cree uno nuevo.','Sí, restablecer',function(){
        api('pin-reset',{t:c.tarjeta}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } hojaWA('🔐 PIN restablecido. Mándele su tarjeta para que cree uno nuevo:',c.tel,'¡Hola '+c.nombre.split(' ')[0]+'! 🔐 Le restablecimos el PIN de Monzú Club. Abra su tarjeta aquí y cree uno nuevo: '+enlaceTarjeta(c.tarjeta)); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) })));
      acc.appendChild(boton('Eliminar','b-rojo',siPregunta('¿Eliminar a '+c.nombre+' y todos sus datos (tarjeta, sellos y citas)? No se puede deshacer.','Sí, eliminar',function(){
        api('borrar-cliente',{t:c.tarjeta}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('Cliente eliminado.'); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) }),'x'));
      box.appendChild(acc); L.appendChild(box);
    });
  }
  /* respaldo y seguridad */
  $('btnRespaldo').addEventListener('click',function(){
    fetch('/api/panel/respaldo',{headers:{authorization:'Bearer '+clave},cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error('x'); return r.blob() }).then(function(b){
      var a=el('a'); a.href=URL.createObjectURL(b); a.download='monzu-respaldo-'+(datos?datos.hoy:'')+'.json'; d.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove() },1000); toast('✓ Respaldo descargado. Guárdelo en un lugar seguro.') })
      .catch(function(){ toast('No se pudo descargar el respaldo.',true) });
  });
  $('btnCerrarTodo').addEventListener('click',function(){
    pregunta('¿Cerrar la sesión del panel en TODOS los celulares y computadoras? Tendrá que entrar otra vez con la contraseña.','Sí, cerrar todo').then(function(ok){ if(!ok) return;
    api('cerrar-todo',{}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } $('btnSalir').click(); $('loginMsg').textContent='Se cerraron todas las sesiones. Entre otra vez.'; $('loginMsg').className='msg bien' }) });
  });
  $('fNuevo').addEventListener('submit',function(e){
    e.preventDefault(); var m=$('mNuevo'), nombre=$('nNombre').value.trim(), tel=$('nTel').value.trim();
    if(nombre.length<3||!/^[2-8]\d{7}$/.test(tel.replace(/\D/g,'').replace(/^506/,''))){ m.textContent='Escriba el nombre y un teléfono de 8 dígitos.'; m.className='msg mal'; return }
    api('cliente',{nombre:nombre,tel:tel,carro:$('nCarro').value.trim()}).then(function(j){
      if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return }
      m.textContent=j.existia?'⚠️ Ese teléfono ya tenía tarjeta, a nombre de '+j.nombre+'. Cada número tiene una sola tarjeta: no se creó otra.':'✓ Tarjeta creada para '+j.nombre+'.'; m.className=j.existia?'msg mal':'msg bien';
      $('buscar').value=j.tel; ultimoTel=j.tel;
      hojaWA(j.existia?'Reenviarle su tarjeta a '+j.nombre.split(' ')[0]+':':'Mándele su tarjeta a '+j.nombre.split(' ')[0]+':',j.tel,'¡Hola '+j.nombre.split(' ')[0]+'! 💧 Bienvenido a Monzú Club. Esta es su tarjeta de cliente frecuente, donde ve sus sellos (10 sellos = lavado gratis): '+enlaceTarjeta(j.tarjeta)+'\nÁbrala, cree su PIN de 4 números y guárdela en la pantalla de inicio de su celular.');
      $('fNuevo').reset(); refrescar();
    }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' });
  });
  $('buscar').addEventListener('input',function(){ if(datos) clientes() });
  $('fImportar').addEventListener('submit',function(e){
    e.preventDefault(); var m=$('mImp');
    var filas=$('impTxt').value.split(/\r?\n/).map(function(l){ return l.trim() }).filter(Boolean).map(function(l){ return l.split(/\t|;|,/).map(function(x){ return x.trim() }) })
      .filter(function(f){ return !/^nombre$/i.test(f[0]) });
    if(!filas.length){ m.textContent='Pegue al menos un cliente.'; m.className='msg mal'; return }
    if(filas.length>500){ m.textContent='Máximo 500 por vez. Divida la lista.'; m.className='msg mal'; return }
    m.textContent='Importando '+filas.length+' clientes…'; m.className='msg';
    api('importar',{filas:filas}).then(function(j){
      if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return }
      m.textContent='✓ '+j.creados+' clientes nuevos'+(j.repetidos?' · '+j.repetidos+' ya existían':'')+(j.malos.length?' · revise las líneas '+j.malos.slice(0,15).join(', ')+' (falta nombre o teléfono)':''); m.className=j.malos.length?'msg mal':'msg bien';
      if(j.creados) $('impTxt').value=''; refrescar();
    }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' });
  });

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
    api('tarjeta',{t:tk}).then(function(j){
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

  /* ---------- agendar una cita desde el panel (y citas fijas) ---------- */
  var DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], DCORTO=['D','L','K','M','J','V','S'];
  function opcion(sel,v,t){ var o=el('option',null,t); o.value=v; sel.appendChild(o) }
  function llenaSelHoras(sel,conOtra,conVacia){ var a=sel.value; sel.textContent=''; if(conVacia) opcion(sel,'','Todo el día'); datos.config.horas.forEach(function(h){ opcion(sel,h,fmtH(h)) }); if(conOtra) opcion(sel,'otra','Otra hora…'); if(a) sel.value=a }
  function espacio(){
    var E=datos.espacio; if(!E||!E.usados){ $('eTxt').textContent='Sin dato todavía.'; return }
    var pct=Math.max(1,Math.round(E.usados/E.max*100)), por=E.clientes?E.usados/E.clientes:600, caben=Math.max(0,Math.floor((E.max*0.95-E.usados)/Math.max(por,300)));
    $('eBar').style.width=pct+'%'; $('eBar').classList.toggle('alto',pct>=75);
    $('eTxt').textContent='Usado: '+pct+'% · '+E.clientes+' clientes. Caben aproximadamente '+caben.toLocaleString('es-CR')+' clientes más.'+(pct>=75?' ⚠️ Avísele a Solanotech para ampliarla.':'');
  }
  function llenaCHora(){ llenaSelHoras($('cHora'),false,true) }
  /* ---------- calendario del mes ---------- */
  var calMes='', diaSel='', MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
  function calendario(){
    if(!datos) return; if(!calMes) calMes=datos.hoy.slice(0,7);
    var y=+calMes.slice(0,4), m=+calMes.slice(5,7), primero=calMes+'-01', dow=(new Date(primero+'T12:00:00Z').getUTCDay()+6)%7, ult=new Date(Date.UTC(y,m,0)).getUTCDate(), C=datos.config;
    $('calMes').textContent=MESES[m-1].charAt(0).toUpperCase()+MESES[m-1].slice(1)+' '+y;
    var por={}, enMes=0; datos.citas.forEach(function(c){ if(c.estado==='cancelada') return; (por[c.fecha]=por[c.fecha]||[]).push(c.estado); if(c.fecha.slice(0,7)===calMes) enMes++ });
    $('calSub').textContent=enMes+(enMes===1?' cita':' citas')+' este mes · toque un día';
    var G=$('calGrid'); G.textContent=''; var total=Math.ceil((dow+ult)/7)*7, f=sumaDias(primero,-dow);
    for(var i=0;i<total;i++,f=sumaDias(f,1)){ (function(f){
      var b=el('button','cal-d'), l=por[f]||[], dw=new Date(f+'T12:00:00Z').getUTCDay(), cerr=C.cerrados.some(function(x){ return !x.hora&&f>=x.desde&&f<=x.hasta });
      b.type='button'; if(f.slice(0,7)!==calMes) b.classList.add('otro'); if(f===datos.hoy) b.classList.add('hoy'); if(f===diaSel) b.classList.add('sel');
      if(cerr||C.dias.indexOf(dw)<0) b.classList.add('cerrado'); if(l.length>=C.horas.length) b.classList.add('lleno'); if(!l.length) b.classList.add('vacio');
      b.appendChild(el('span','n',String(+f.slice(8)))); b.appendChild(el('span','c',l.length?String(l.length):'·'));
      var p=el('span','pts'); l.slice(0,5).forEach(function(e){ p.appendChild(el('i',e)) }); b.appendChild(p);
      b.setAttribute('aria-label',fmtDia(f)+': '+(l.length?l.length+(l.length===1?' cita':' citas'):'sin citas')+(cerr?' (cerrado)':''));
      b.addEventListener('click',function(){ diaSel=f; filtro='dia'; d.querySelectorAll('.filtros button').forEach(function(x){ x.setAttribute('aria-pressed','false') }); if(f.slice(0,7)!==calMes) calMes=f.slice(0,7); calendario(); citas(); $('listaCitas').scrollIntoView({behavior:'smooth',block:'start'}) });
      G.appendChild(b) })(f) }
  }
  function mueveMes(n){ var y=+calMes.slice(0,4), m=+calMes.slice(5,7)-1+n; y+=Math.floor(m/12); m=((m%12)+12)%12; calMes=y+'-'+String(m+1).padStart(2,'0'); calendario() }
  $('calAnt').addEventListener('click',function(){ mueveMes(-1) }); $('calSig').addEventListener('click',function(){ mueveMes(1) }); $('calHoy').addEventListener('click',function(){ calMes=datos.hoy.slice(0,7); calendario() });
  function losDias(n){ return 'los '+DIAS[n]+(n===0||n===6?'s':'') }
  function elDia(f){ var t=fmtDia(f); return /^(Hoy|Mañana|Ayer)$/.test(t)?t.toLowerCase():'el '+t.toLowerCase() }
  function fijas(){
    var L=$('listaFijas'); L.textContent=''; $('nFijas').textContent=datos.fijas.length?'('+datos.fijas.length+')':'';
    if(!datos.fijas.length){ L.appendChild(el('p','ayuda izq','Todavía no hay citas fijas. Toque "＋ Nueva" para apartarle a un cliente el mismo día y hora cada semana.')); return }
    var C=datos.config.cat;
    datos.fijas.forEach(function(f){
      var box=el('div','fj'), top=el('div','fj-top'), t=el('div'); t.appendChild(el('b',null,f.nombre));
      var dur=f.hasta?(f.hasta<datos.hoy?'terminó '+elDia(f.hasta):'hasta '+elDia(f.hasta)+(f.semanas?' ('+f.semanas+' semanas)':'')):'sin fecha de fin';
      t.appendChild(el('small',null,'Todos '+losDias(f.dia)+' · '+fmtH(f.hora)+' · '+dur));
      var serv=[C.paq[f.paq]?C.paq[f.paq].n:'Solo adicionales'].concat((f.extras||[]).map(function(k){ return C.ext[k]?C.ext[k].n:k })).join(' + ');
      t.appendChild(el('small',null,serv+' · '+(f.veh==='suv'?'SUV':'Sedán')+' · '+f.pago+' · 📍 '+f.lugar)); top.appendChild(t); box.appendChild(top);
      var prox=datos.citas.filter(function(c){ return c.fija===f.id && c.fecha>=datos.hoy }).sort(function(a,b){ return (a.fecha+a.hora).localeCompare(b.fecha+b.hora) });
      var fe=el('div','fj-fechas');
      if(!prox.length) fe.appendChild(el('p','ayuda izq','No hay próximas fechas.'));
      prox.slice(0,10).forEach(function(c){ var salta=c.estado==='cancelada', r=el('div','fj-f'+(salta?' salta':''));
        r.appendChild(el('span',null,fmtDia(c.fecha)+' · '+fmtH(c.hora)+(c.cambiada?' (movida)':'')+(salta?' · saltada':'')));
        if(salta){ r.appendChild(el('span')); r.appendChild(boton('Reponer','b-bor',function(){ api('fija-reponer',{id:c.id}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('✓ Fecha repuesta.'); refrescar() }) })) }
        else if(c.estado==='pendiente'||c.estado==='confirmada'){
          r.appendChild(boton('Mover','b-bor',function(){ formMover(c,r) }));
          r.appendChild(boton('Saltar','b-rojo',siPregunta('¿Saltar la cita de '+f.nombre+' de '+elDia(c.fecha)+'? Esa semana no viene; las demás siguen igual.','Sí, saltar',function(){ api('cita',{id:c.id,accion:'cancelar'}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('Semana saltada.'); refrescar() }) })))
        } else { r.appendChild(el('span','chip '+c.estado,NOM[c.estado])); r.appendChild(el('span')) }
        fe.appendChild(r) });
      box.appendChild(fe);
      var acc=el('div','acc');
      acc.appendChild(boton('Editar','b-bor',function(){ abreFija(f) }));
      acc.appendChild(boton('Quitar','b-rojo',siPregunta('¿Quitar la cita fija de '+f.nombre+'? Se cancelan también las próximas fechas.','Sí, quitar',function(){ api('quitar-fija',{id:f.id}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } toast('Cita fija quitada · '+j.canceladas+' fechas canceladas.'); refrescar() }) })));
      box.appendChild(acc); L.appendChild(box);
    });
  }
  /* formulario de cita fija (nueva o editar) */
  var fjId='', fjTel='';
  function proxDia(dia,desde){ var f=desde||datos.hoy; while(new Date(f+'T12:00:00Z').getUTCDay()!==+dia) f=sumaDias(f,1); return f }
  function llenaFija(){
    var C=datos.config.cat;
    llenaSelHoras($('fjHora'),false);
    var ps=$('fjPaq'), primera=!ps.options.length, a=ps.value; ps.textContent=''; Object.keys(C.paq).forEach(function(k){ opcion(ps,k,C.paq[k].n) }); opcion(ps,'','Solo adicionales'); if(primera) ps.selectedIndex=0; else ps.value=a;
    var pg=$('fjPago'), b=pg.value; pg.textContent=''; datos.pagos.forEach(function(p){ opcion(pg,p,p) }); if(b) pg.value=b;
    var ex=$('fjExt'), marc=[].map.call(ex.querySelectorAll('input:checked'),function(i){ return i.value }); ex.textContent='';
    Object.keys(C.ext).forEach(function(k){ var x=C.ext[k]; if(x.oculto) return; var l=el('label','chk'), i=el('input'); i.type='checkbox'; i.value=k; i.checked=marc.indexOf(k)>=0; l.appendChild(i); l.appendChild(d.createTextNode(x.n)); ex.appendChild(l) });
    var dl=$('dlCli'); dl.textContent=''; datos.clientes.forEach(function(c){ var o=el('option'); o.value=c.nombre+' · '+c.tel.slice(0,4)+'-'+c.tel.slice(4); dl.appendChild(o) });
  }
  function frec(){ var r=d.querySelector('input[name=fjFrec]:checked'); return r?r.value:'una' }
  function diaDe(f){ return new Date((f||datos.hoy)+'T12:00:00Z').getUTCDay() }
  function totalFija(){
    var C=datos.config.cat, v=$('fjVeh').value, P=C.paq[$('fjPaq').value], t=P?P[v]:0, desde=false, sem=frec()==='semanal';
    [].forEach.call($('fjExt').querySelectorAll('input:checked'),function(i){ var x=C.ext[i.value]; if(!x) return; if(x.desde) desde=true; t+=(x.conPaq!=null&&P)?x.conPaq:x.p });
    $('fjTotal').textContent=t?(desde?'desde ':'')+col(t):'—'; $('fjTotLbl').textContent=sem?'Total cada semana':'Total';
    $('fjSemC').hidden=!sem; $('fjDiaLbl').textContent=sem?'Empieza el':'Día';
    var f=$('fjDesde').value||datos.hoy, h=$('fjHora').value||'08:00', n=+$('fjSemanas').value;
    // horas ocupadas de ese día
    var occ=datos.citas.filter(function(c){ return c.fecha===f && c.estado!=='cancelada' && c.id!==fjCita }).map(function(c){ return c.hora });
    [].forEach.call($('fjHora').options,function(o){ var lib=occ.indexOf(o.value)<0; o.textContent=fmtH(o.value)+(lib?'':' · ocupada'); o.disabled=!lib&&!fjId });
    $('fjResumen').textContent=sem?'Se apartan '+(n?n+' citas':'citas cada semana, sin fin')+': todos '+losDias(diaDe(f))+' a las '+fmtH(h)+', desde '+elDia(f)+(n?' hasta '+elDia(sumaDias(f,(n-1)*7)):'')+'.'
      :'Una sola cita: '+elDia(f)+', '+fmtH(h);
  }
  var fjCita='';
  ['fjHora','fjDesde','fjSemanas','fjPaq','fjVeh'].forEach(function(i){ $(i).addEventListener('change',totalFija) }); $('fjExt').addEventListener('change',totalFija); $('fjFrec').addEventListener('change',totalFija);
  $('fjBuscar').addEventListener('input',function(){
    var v=$('fjBuscar').value.trim(), dig=v.replace(/\D/g,'').slice(-8), q=v.toLowerCase(), c=null;
    if(dig.length===8) c=datos.clientes.filter(function(x){ return x.tel===dig })[0];
    if(!c&&q.length>=3){ var m=datos.clientes.filter(function(x){ return x.nombre.toLowerCase()===q }); if(m.length===1) c=m[0] }
    fjTel=c?c.tel:''; $('fjCliTxt').textContent=c?'✓ '+c.nombre+' · '+c.tel.slice(0,4)+'-'+c.tel.slice(4)+(c.carro?' · '+c.carro:''):'Busque al cliente. ¿Es nuevo? Toque “Nuevo contacto”.';
  });
  /* abre el formulario: nueva cita (una vez o fija) o editar una cita fija */
  function abreFija(f,op){
    op=op||{}; llenaFija(); var F=$('fFija'); F.hidden=false; $('mFija').textContent=''; fjId=f?f.id:''; fjTel=f?f.tel:'';
    $('fjTit').textContent=f?'Editar cita fija de '+f.nombre:'Agendar cita'; $('fjCliC').hidden=!!f; $('fjCliTxt').hidden=!!f; $('fjNuevoCli').hidden=!!f; $('fjNC').hidden=true; $('fjGuardar').textContent=f?'Guardar cambios':'Guardar cita';
    var fr=f?'semanal':(op.frec||'una'); d.querySelectorAll('input[name=fjFrec]').forEach(function(r){ r.checked=r.value===fr; r.disabled=!!f });
    if(f){ var ini=f.desde<datos.hoy?datos.hoy:f.desde; while(diaDe(ini)!==f.dia) ini=sumaDias(ini,1); $('fjDesde').value=ini; $('fjHora').value=f.hora; if($('fjHora').value!==f.hora){ opcion($('fjHora'),f.hora,fmtH(f.hora)); $('fjHora').value=f.hora } $('fjSemanas').value=String(f.semanas||0);
      $('fjPaq').value=f.paq||''; $('fjVeh').value=f.veh; $('fjPago').value=f.pago; $('fjLugar').value=f.lugar; [].forEach.call($('fjExt').querySelectorAll('input'),function(i){ i.checked=(f.extras||[]).indexOf(i.value)>=0 }) }
    else { $('fjBuscar').value=''; $('fjLugar').value=''; $('fjDesde').value=op.fecha&&op.fecha>=datos.hoy?op.fecha:datos.hoy; $('fjSemanas').value='7'; $('fjCliTxt').textContent='Busque al cliente. ¿Es nuevo? Toque “Nuevo contacto”.'; [].forEach.call($('fjExt').querySelectorAll('input'),function(i){ i.checked=false });
      var libre=[].filter.call($('fjHora').options,function(o){ return !datos.citas.some(function(c){ return c.fecha===$('fjDesde').value&&c.hora===o.value&&c.estado!=='cancelada' }) })[0]; if(libre) $('fjHora').value=libre.value }
    $('fjDesde').min=datos.hoy; totalFija(); F.scrollIntoView({behavior:'smooth',block:'start'}); if(!f) setTimeout(function(){ $('fjBuscar').focus() },350);
  }
  $('fjNueva').addEventListener('click',function(){ abreFija(null,{frec:'semanal'}) });
  $('calAgendar').addEventListener('click',function(){ abreFija(null,{fecha:diaSel||''}) });
  $('fjNuevoCli').addEventListener('click',function(){ var b=$('fjNC'); b.hidden=!b.hidden; if(!b.hidden){ var v=$('fjBuscar').value.trim(); if(/\d{4}/.test(v)) $('ncTel').value=v; else if(v) $('ncNombre').value=v; $('ncNombre').focus() } });
  $('ncCrear').addEventListener('click',function(){ var m=$('mNC');
    api('cliente',{nombre:$('ncNombre').value.trim(),tel:$('ncTel').value,carro:$('ncCarro').value.trim()}).then(function(j){
      if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return }
      fjTel=j.tel; $('fjBuscar').value=j.nombre+' · '+j.tel.slice(0,4)+'-'+j.tel.slice(4); $('fjCliTxt').textContent=(j.existia?'✓ Ese teléfono ya era de ':'✓ Contacto creado: ')+j.nombre+' · '+j.tel.slice(0,4)+'-'+j.tel.slice(4);
      $('fjNC').hidden=true; $('ncNombre').value=''; $('ncTel').value=''; $('ncCarro').value=''; m.textContent=''; refrescar();
    }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' }) });
  $('fjCerrar').addEventListener('click',function(){ $('fFija').hidden=true });
  $('fFija').addEventListener('submit',function(e){
    e.preventDefault(); var m=$('mFija'), sem=frec()==='semanal';
    if(!fjId&&!fjTel){ m.textContent='Busque y elija un cliente, o toque “Nuevo contacto”.'; m.className='msg mal'; return }
    var fecha=$('fjDesde').value||datos.hoy, base={tel:fjTel,hora:$('fjHora').value,paq:$('fjPaq').value,veh:$('fjVeh').value,extras:[].map.call($('fjExt').querySelectorAll('input:checked'),function(i){ return i.value }),pago:$('fjPago').value,lugar:$('fjLugar').value.trim()};
    m.textContent='Guardando…'; m.className='msg';
    var p=sem?api('fija-guardar',Object.assign({id:fjId||undefined,dia:diaDe(fecha),desde:fecha,semanas:+$('fjSemanas').value},base)):api('agendar',Object.assign({fecha:fecha},base));
    p.then(function(j){
      if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return }
      $('fFija').hidden=true; var nom=j.nombre.split(' ')[0], n=+$('fjSemanas').value;
      if(sem){
        if(j.choques.length) toast('⚠️ '+j.choques.length+' fecha(s) ya tenían otra cita a esa hora: '+j.choques.map(function(c){ return fmtDia(c.fecha) }).join(', '),true); else toast('✓ '+(fjId?'Cita fija actualizada':'Cita fija guardada')+' · '+j.creadas+' fechas apartadas.');
        hojaWA('Avísele a '+nom+':',j.tel,'¡Hola '+nom+'! 👋 '+(fjId?'Le actualizamos':'Le dejamos')+' su cita fija en Monzú Detallados: todos '+losDias(diaDe(fecha))+' a las '+fmtH(base.hora)+(n?' por '+n+' semanas':'')+'. Le llegan recordatorios antes de cada una y las ve en su tarjeta: '+enlaceTarjeta(j.tarjeta));
      } else {
        toast('✓ Cita guardada · '+fmtDia(fecha)+' '+fmtH(base.hora));
        hojaWA('Avísele a '+nom+':',j.tel,'¡Hola '+nom+'! 👋 Le apartamos su cita en Monzú Detallados para '+elDia(fecha)+' a las '+fmtH(base.hora)+'. Le llega un recordatorio antes y la puede ver o cambiar en su tarjeta: '+enlaceTarjeta(j.tarjeta));
      }
      refrescar();
    }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' });
  });
  /* ---------- editar una cita (pago, servicio, dirección, nota y datos del cliente) ---------- */
  function campoP(lbl,elem){ var c=el('div','campo'), l=el('label',null,lbl); c.appendChild(l); c.appendChild(elem); return c }
  function inpP(v,ph,tipo){ var i=el('input'); i.value=v||''; i.placeholder=ph||''; if(tipo){ i.type=tipo; i.inputMode=tipo==='tel'?'tel':'text' } return i }
  function selP(ops,v){ var s=el('select'); ops.forEach(function(o){ opcion(s,o[0],o[1]) }); s.value=v; return s }
  function formEditar(c,box){
    var ya=box.querySelector('.editar'); if(ya){ ya.remove(); return }
    var C=datos.config.cat, sel=c.sel||{}, f=el('div','editar caja-p');
    if(!c.sel){ sel.paq=Object.keys(C.paq).filter(function(k){ return (c.lineas[0]||[''])[0].indexOf(C.paq[k].n)===0 })[0]||''; sel.veh=/SUV/.test(c.vehiculo)?'suv':'sedan'; sel.extras=Object.keys(C.ext).filter(function(k){ return c.lineas.some(function(l){ return l[0].indexOf(C.ext[k].n)===0 }) }) }
    f.appendChild(el('b','tit-p','✏️ Editar cita'));
    var nom=inpP(c.nombre,'Nombre'), tel=inpP(c.tel.slice(0,4)+'-'+c.tel.slice(4),'8888-0000','tel'), car=inpP(c.carro,'Carro (opcional)');
    var d1=el('div','dos-p'); d1.appendChild(campoP('Nombre',nom)); d1.appendChild(campoP('Teléfono',tel)); f.appendChild(d1); f.appendChild(campoP('Carro',car));
    var pg=selP(datos.pagos.map(function(p){ return [p,p] }),c.pago||datos.pagos[0]);
    var pq=selP(Object.keys(C.paq).map(function(k){ return [k,C.paq[k].n] }).concat([['','Solo adicionales']]),sel.paq||''), vh=selP([['sedan','Sedán'],['suv','SUV · Pick up']],sel.veh||'sedan');
    var d2=el('div','dos-p'); d2.appendChild(campoP('Pago',pg)); d2.appendChild(campoP('Vehículo',vh)); f.appendChild(d2); f.appendChild(campoP('Servicio',pq));
    var ex=el('div','chks'); Object.keys(C.ext).forEach(function(k){ var x=C.ext[k]; if(x.oculto&&(sel.extras||[]).indexOf(k)<0) return; var l=el('label','chk'), i=el('input'); i.type='checkbox'; i.value=k; i.checked=(sel.extras||[]).indexOf(k)>=0; l.appendChild(i); l.appendChild(d.createTextNode(x.n)); ex.appendChild(l) });
    var ce=el('div','campo'); ce.appendChild(el('span','lbl-p','Adicionales')); ce.appendChild(ex); f.appendChild(ce);
    var lu=inpP(c.lugar,'Dirección'), no=inpP(c.nota,'Nota (opcional)'); f.appendChild(campoP('Dirección',lu)); f.appendChild(campoP('Nota',no));
    var tot=el('div','tot-p'); tot.appendChild(el('span',null,'Nuevo total')); var tb=el('b',null,''); tot.appendChild(tb); f.appendChild(tot);
    function calc(){ var P=C.paq[pq.value], t=P?P[vh.value]:0, desde=false; [].forEach.call(ex.querySelectorAll('input:checked'),function(i){ var x=C.ext[i.value]; if(!x) return; if(x.desde) desde=true; t+=(x.conPaq!=null&&P)?x.conPaq:x.p }); t+=(c.multa||0); tb.textContent=(desde?'desde ':'')+col(t) }
    [pq,vh,ex].forEach(function(e){ e.addEventListener('change',calc) }); calc();
    var m=el('p','msg'), acc=el('div','acc');
    acc.appendChild(boton('Cerrar','b-bor',function(){ f.remove() }));
    acc.appendChild(boton('Guardar cambios','b-tq',function(){
      m.textContent='Guardando…'; m.className='msg';
      var cambiaCli=nom.value.trim()!==c.nombre||tel.value.replace(/\D/g,'').replace(/^506/,'')!==c.tel;
      var p1=cambiaCli?api('editar-cliente',{t:c.tarjeta,nombre:nom.value.trim(),tel:tel.value}):Promise.resolve({ok:true});
      p1.then(function(j){ if(!j.ok) throw new Error(j.error||'No se pudo cambiar el cliente.');
        return api('editar-cita',{id:c.id,pago:pg.value,paq:pq.value,veh:vh.value,extras:[].map.call(ex.querySelectorAll('input:checked'),function(i){ return i.value }),lugar:lu.value.trim(),nota:no.value.trim(),carro:car.value.trim()}) })
       .then(function(j){ if(!j.ok) throw new Error(j.error||'No se pudo guardar.'); f.remove(); toast('✓ Cita actualizada · total '+col(j.total)); refrescar() })
       .catch(function(e){ m.textContent=e.message||'Sin conexión.'; m.className='msg mal' });
    }));
    f.appendChild(acc); f.appendChild(m); box.appendChild(f); nom.focus();
  }
  /* editar un cliente desde la lista de Clientes */
  function formCliente(c,box){
    var ya=box.querySelector('.editar'); if(ya){ ya.remove(); return }
    var f=el('div','editar caja-p'), nom=inpP(c.nombre,'Nombre'), tel=inpP(c.tel.slice(0,4)+'-'+c.tel.slice(4),'8888-0000','tel'), car=inpP(c.carro,'Carro (opcional)'), m=el('p','msg');
    f.appendChild(el('b','tit-p','✏️ Editar cliente')); var d1=el('div','dos-p'); d1.appendChild(campoP('Nombre',nom)); d1.appendChild(campoP('Teléfono',tel)); f.appendChild(d1); f.appendChild(campoP('Carro',car));
    var acc=el('div','acc'); acc.appendChild(boton('Cerrar','b-bor',function(){ f.remove() }));
    acc.appendChild(boton('Guardar','b-tq',function(){ api('editar-cliente',{t:c.tarjeta,nombre:nom.value.trim(),tel:tel.value,carro:car.value.trim()}).then(function(j){ if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return } f.remove(); toast('✓ Cliente actualizado.'); refrescar() }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' }) }));
    f.appendChild(acc); f.appendChild(m); box.appendChild(f); nom.focus();
  }

  /* mover una cita */
  function formMover(c,box){
    if(box.querySelector('.mover')){ box.querySelector('.mover').remove(); return }
    var f=el('div','mover'), dd=el('div','dos-p'), c1=el('div','campo'), c2=el('div','campo'), fe=el('input'), ho=el('select');
    fe.type='date'; fe.value=c.fecha; fe.min=datos.hoy; fe.setAttribute('aria-label','Nuevo día'); llenaSelHoras(ho,false); if(datos.config.horas.indexOf(c.hora)<0) opcion(ho,c.hora,fmtH(c.hora)); ho.value=c.hora; ho.setAttribute('aria-label','Nueva hora');
    c1.appendChild(fe); c2.appendChild(ho); dd.appendChild(c1); dd.appendChild(c2); f.appendChild(dd);
    f.appendChild(boton('Guardar el cambio','b-tq',function(){ api('mover',{id:c.id,fecha:fe.value,hora:ho.value}).then(function(j){ if(!j.ok){ toast(j.error||'No se pudo.',true); return } f.remove();
      var nom=c.nombre.split(' ')[0]; hojaWA('✓ Cita movida. Avísele a '+nom+':',c.tel,'¡Hola '+nom+'! Le cambiamos su cita de Monzú Detallados para el '+fmtDia(fe.value).toLowerCase()+' a las '+fmtH(ho.value)+'. Cualquier cosa nos escribe. Su tarjeta: '+enlaceTarjeta(j.tarjeta)); refrescar() }).catch(function(){ toast('Sin conexión.',true) }) }));
    box.appendChild(f);
  }
  /* pedir reseña al terminar */
  function trasTerminar(c,j){
    var nom=c.nombre.split(' ')[0];
    if(j.resena) toast('✓ Sello agregado · encuesta enviada '+(/whatsapp/.test(j.resena)?'por WhatsApp':'al celular')+' ⭐');
    else if(j.tarjeta) hojaWA('✓ Sello agregado. Mándele la encuesta a '+nom+' ⭐',c.tel,'¡Gracias por lavar con Monzú, '+nom+'! 💧 ¿Cómo le fue? Cuéntenos en 1 minuto qué le pareció el trabajo: '+enlaceTarjeta(j.tarjeta)+'#encuesta');
  }

  /* ---------- ganancias ---------- */
  function reporte(){
    var R=$('rep'); api('reporte').then(function(j){ R.textContent=''; if(!j.ok){ R.appendChild(el('p','vacio',j.error||'No se pudo cargar.')); return }
      var P=j.periodos, g=el('div','rep-g');
      [['Hoy',P.hoy],['Esta semana',P.semana],['Este mes',P.mes],['Mes pasado',P.mesAnterior]].forEach(function(x){ var c=el('div','rep-c'); c.appendChild(el('small',null,x[0])); c.appendChild(el('b',null,col(x[1].total))); c.appendChild(el('span',null,x[1].citas+(x[1].citas===1?' lavado':' lavados')+(x[1].ausentes?' · '+x[1].ausentes+' no llegaron':''))); g.appendChild(c) });
      R.appendChild(g);
      var D14=j.dias.slice(-14), b=el('div','caja-p'); b.appendChild(el('b','tit-p','Últimos 14 días')); var br=el('div','barras'), bl=el('div','barras-l'), mx=Math.max.apply(null,D14.map(function(x){ return x.total }).concat([1]));
      D14.forEach(function(x){ var v=el('div'); v.style.height=Math.max(2,Math.round(x.total/mx*100))+'%'; v.title=x.fecha+': '+col(x.total); br.appendChild(v); bl.appendChild(el('span',null,String(+x.fecha.slice(8)))) });
      b.appendChild(br); b.appendChild(bl); R.appendChild(b);
      var pp=el('div','caja-p'); pp.appendChild(el('b','tit-p','Este mes por forma de pago')); var lst=el('div','pp'), mt=Math.max(1,P.mes.total);
      Object.keys(P.mes.porPago).forEach(function(k){ var r=el('div'), barra=el('i'); barra.style.width=Math.round(P.mes.porPago[k]/mt*100)+'%'; var w=el('span'); w.appendChild(barra); r.appendChild(el('span',null,k)); r.appendChild(w); r.appendChild(el('b',null,col(P.mes.porPago[k]))); lst.appendChild(r) });
      pp.appendChild(lst); pp.appendChild(el('p','ayuda izq','Marcado como pagado: '+col(P.mes.pagado)+' de '+col(P.mes.total)+(P.mes.multas?' · multas cobradas: '+col(P.mes.multas):''))); R.appendChild(pp);
      if(j.porCobrar.length){ var pc=el('div','caja-p'); pc.appendChild(el('b','tit-p','Por cobrar ('+j.porCobrar.length+')')); j.porCobrar.slice(-15).reverse().forEach(function(c){ var r=el('div','fila'), t=el('div'); t.appendChild(el('b',null,c.nombre)); t.appendChild(el('small',null,fmtDia(c.fecha)+' · '+(c.pago||''))); r.appendChild(t); r.appendChild(el('b',null,col(c.total))); pc.appendChild(r) }); R.appendChild(pc) }
      var ms=Object.keys(j.meses).sort().reverse(); if(ms.length){ var hm=el('div','caja-p'); hm.appendChild(el('b','tit-p','Por mes')); ms.slice(0,12).forEach(function(k){ var M=j.meses[k], r=el('div','fila'), t=el('div'), x=new Date(k+'-15T12:00:00Z'); t.appendChild(el('b',null,x.toLocaleDateString('es-CR',{month:'long',year:'numeric'}))); t.appendChild(el('small',null,M.citas+' lavados · '+Object.keys(M.porPago).map(function(p){ return p+' '+col(M.porPago[p]) }).join(' · '))); r.appendChild(t); r.appendChild(el('b',null,col(M.total))); hm.appendChild(r) }); R.appendChild(hm) }
      var O=j.opiniones; if(O){ var oc=el('div','caja-p'); oc.appendChild(el('b','tit-p','⭐ Opiniones de los clientes'));
        if(!O.total) oc.appendChild(el('p','ayuda izq','Todavía no hay encuestas. Al marcar un lavado como Terminado, al cliente le llega la encuesta.'));
        else { var top=el('div','opi-top'), big=el('div','opi-big'); big.appendChild(el('b',null,String(O.general).replace('.',','))); big.appendChild(el('span','opi-est','★★★★★'.slice(0,Math.round(O.general))+'☆☆☆☆☆'.slice(0,5-Math.round(O.general)))); big.appendChild(el('small',null,O.total+(O.total===1?' opinión':' opiniones')+(O.terminadas?' · respondió el '+Math.round(O.total/O.terminadas*100)+'%':''))); top.appendChild(big);
          var asp=el('div','pp'); [['Puntualidad',O.puntualidad],['Calidad',O.calidad],['Trato',O.trato]].forEach(function(x){ if(x[1]==null) return; var rr=el('div'), w=el('span'), ba=el('i'); ba.style.width=(x[1]/5*100)+'%'; w.appendChild(ba); rr.appendChild(el('span',null,x[0])); rr.appendChild(w); rr.appendChild(el('b',null,String(x[1]).replace('.',',')+' ★')); asp.appendChild(rr) }); top.appendChild(asp); oc.appendChild(top);
          if(O.recomiendan!=null) oc.appendChild(el('p','ayuda izq','👍 El '+O.recomiendan+'% lo recomendaría con sus amigos.'));
          O.ultimas.forEach(function(x){ var f=el('div','fila'+(x.general<=3?' opi-mal':'')), t=el('div'); t.appendChild(el('b',null,'★★★★★'.slice(0,x.general)+'☆☆☆☆☆'.slice(0,5-x.general)+'  '+x.nombre)); t.appendChild(el('small',null,fmtDia(x.fecha)+' · '+x.servicio.split(' · ')[0]+(x.recomienda===false?' · no lo recomendaría':''))); if(x.comentario) t.appendChild(el('small',null,'“'+x.comentario+'”')); f.appendChild(t);
            if(x.general<=3) f.appendChild(boton('Escribirle','b-wa',function(){ abrirWA(x.tel,'¡Hola '+x.nombre.split(' ')[0]+'! Le escribimos de Monzú Detallados. Vimos su opinión del lavado y nos importa mucho: ¿nos cuenta qué pasó para arreglarlo?') },'wa'));
            oc.appendChild(f) }) }
        R.appendChild(oc) }
      R.appendChild(el('p','ayuda','Suma las citas marcadas como Pagado o Terminado, el día en que entró la plata. La tapicería "desde" suma el precio base.'));
    }).catch(function(){ R.textContent=''; R.appendChild(el('p','vacio','Sin conexión.')) });
  }

  /* ---------- ajustes: horario, días cerrados, precios, reseñas ---------- */
  var hTmp=null, ajListos=false;
  function ajustes(forzar){
    if(ajListos&&!forzar){ cerrados(); return } ajListos=true; var C=datos.config;
    hTmp=C.horas.slice(); pintaHorasAj();
    var hd=$('hDias'); hd.textContent=''; [1,2,3,4,5,6,0].forEach(function(n){ var l=el('label','chk'), i=el('input'); i.type='checkbox'; i.value=n; i.checked=C.dias.indexOf(n)>=0; l.appendChild(i); l.appendChild(d.createTextNode(DIAS[n].charAt(0).toUpperCase()+DIAS[n].slice(1,3))); hd.appendChild(l) });
    $('cDesde').min=datos.hoy; $('cHasta').min=datos.hoy;
    servicios(C.cat); $('rUrl').value=C.resena||''; cerrados();
  }
  function pintaHorasAj(){ var c=$('hHoras'); c.textContent=''; hTmp.sort().forEach(function(h){ var s=el('span','chk x'); s.appendChild(d.createTextNode(fmtH(h))); var b=el('button',null,'✕'); b.type='button'; b.setAttribute('aria-label','Quitar '+fmtH(h)); b.addEventListener('click',function(){ hTmp=hTmp.filter(function(x){ return x!==h }); pintaHorasAj() }); s.appendChild(b); c.appendChild(s) }) }
  $('hAgregar').addEventListener('click',function(){ var v=$('hNueva').value; if(!/^\d\d:\d\d$/.test(v)) return; if(hTmp.indexOf(v)<0) hTmp.push(v); $('hNueva').value=''; pintaHorasAj() });
  $('hGuardar').addEventListener('click',function(){ var m=$('mHorario'), dias=[].map.call($('hDias').querySelectorAll('input:checked'),function(i){ return +i.value });
    api('horario',{horas:hTmp,dias:dias}).then(function(j){ if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return } m.textContent='✓ Horario guardado. Ya se ve en la página.'; m.className='msg bien'; refrescar() }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' }) });
  function cerrados(){ var L=$('listaCerrados'); L.textContent=''; var l=datos.config.cerrados.filter(function(x){ return x.hasta>=datos.hoy }).sort(function(a,b){ return a.desde.localeCompare(b.desde) });
    l.forEach(function(x){ var r=el('div','fila'), t=el('div'); t.appendChild(el('b',null,x.hora?'⛔ '+fmtDia(x.desde)+' · '+fmtH(x.hora):'⛔ '+(x.desde===x.hasta?fmtDia(x.desde):fmtDia(x.desde)+' al '+fmtDia(x.hasta).toLowerCase()))); if(x.motivo) t.appendChild(el('small',null,x.motivo)); r.appendChild(t);
      r.appendChild(boton('Abrir','b-bor',function(){ api('abrir',{id:x.id}).then(function(){ toast('Listo: se puede reservar otra vez.'); refrescar() }) })); L.appendChild(r) }) }
  $('cGuardar').addEventListener('click',function(){ var m=$('mCerrar'), x={desde:$('cDesde').value,hasta:$('cHasta').value||$('cDesde').value,hora:$('cHora').value,motivo:$('cMotivo').value.trim()};
    if(!x.desde){ m.textContent='Elija el día.'; m.className='msg mal'; return }
    api('cerrar',x).then(function(j){ if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return }
      m.textContent='✓ Cerrado.'+(j.afectadas.length?' Ojo: hay '+j.afectadas.length+' cita(s) esos días. Muévalas o cancélelas en Citas.':''); m.className=j.afectadas.length?'msg mal':'msg bien';
      $('cDesde').value=''; $('cHasta').value=''; $('cMotivo').value=''; refrescar() }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' }) });
  function inp(v,ph,tipo){ var i=el('input'); i.value=v==null?'':v; i.placeholder=ph; if(tipo){ i.type=tipo; i.inputMode='numeric' } i.setAttribute('aria-label',ph); return i }
  function servicios(cat){
    var sp=$('sPaq'); sp.textContent='';
    Object.keys(cat.paq).forEach(function(k){ var P=cat.paq[k], f=el('div','paq-f'); f.dataset.k=k;
      var n=inp(P.n,'Nombre'); n.dataset.c='n'; f.appendChild(n); var t=el('div','dos-p'), a=inp(P.sedan,'Precio sedán','number'), b=inp(P.suv,'Precio SUV / Pick up','number'); a.dataset.c='sedan'; b.dataset.c='suv';
      var ca=el('div','campo'), cb=el('div','campo'), la=el('label',null,'Sedán ₡'), lb=el('label',null,'SUV ₡'); ca.appendChild(la); ca.appendChild(a); cb.appendChild(lb); cb.appendChild(b); t.appendChild(ca); t.appendChild(cb); f.appendChild(t);
      var ci=el('div','campo'), li=el('label',null,'Qué incluye (uno por línea)'), ta=el('textarea'); ta.rows=5; ta.value=(P.incluye||[]).join('\n'); ta.dataset.c='incluye'; ci.appendChild(li); ci.appendChild(ta); f.appendChild(ci); sp.appendChild(f) });
    var se=$('sExt'); se.textContent=''; Object.keys(cat.ext).forEach(function(k){ se.appendChild(filaExt(k,cat.ext[k])) });
  }
  function filaExt(k,x){ var f=el('div','ext-f'); f.dataset.k=k; var t=el('div','tres'), n=inp(x.n,'Nombre'), p=inp(x.p,'Precio ₡','number'), c=inp(x.conPaq,'Con paquete ₡','number'); n.dataset.c='n'; p.dataset.c='p'; c.dataset.c='conPaq'; t.appendChild(n); t.appendChild(p); t.appendChild(c); f.appendChild(t);
    var o=el('div','chks'); [['desde','Precio "desde"'],['oculto','Ocultar (no se ofrece)']].forEach(function(z){ var l=el('label','chk'), i=el('input'); i.type='checkbox'; i.dataset.c=z[0]; i.checked=!!x[z[0]]; l.appendChild(i); l.appendChild(d.createTextNode(z[1])); o.appendChild(l) });
    var q=el('button','chk','🗑 Quitar'); q.type='button'; q.addEventListener('click',function(){ f.remove() }); o.appendChild(q); f.appendChild(o); return f }
  $('sAgregar').addEventListener('click',function(){ var k='s'+Date.now().toString(36).slice(-6); $('sExt').appendChild(filaExt(k,{n:'',p:''})); $('sExt').lastChild.querySelector('input').focus() });
  $('sGuardar').addEventListener('click',function(){ var m=$('mServ'), cat={paq:{},ext:{}};
    [].forEach.call($('sPaq').querySelectorAll('.paq-f'),function(f){ var g=function(c){ return f.querySelector('[data-c='+c+']').value }; cat.paq[f.dataset.k]={n:g('n'),sedan:g('sedan'),suv:g('suv'),incluye:g('incluye').split('\n').map(function(s){ return s.trim() }).filter(Boolean)} });
    [].forEach.call($('sExt').querySelectorAll('.ext-f'),function(f){ var g=function(c){ return f.querySelector('[data-c='+c+']') }; if(!g('n').value.trim()&&!g('p').value) return; cat.ext[f.dataset.k]={n:g('n').value,p:g('p').value,conPaq:g('conPaq').value,desde:g('desde').checked,oculto:g('oculto').checked} });
    api('servicios',{cat:cat}).then(function(j){ if(!j.ok){ m.textContent=j.error||'No se pudo.'; m.className='msg mal'; return } m.textContent='✓ Precios guardados. Ya se ven en la página.'; m.className='msg bien'; refrescar().then(function(){ servicios(datos.config.cat) }) }).catch(function(){ m.textContent='Sin conexión.'; m.className='msg mal' }) });
  $('rGuardar').addEventListener('click',function(){ var m=$('mRes'); api('resena',{url:$('rUrl').value.trim()}).then(function(j){ m.textContent=j.ok?'✓ Enlace guardado.':(j.error||'No se pudo.'); m.className=j.ok?'msg bien':'msg mal'; if(j.ok) refrescar() }) });

  /* ---------- pestañas ---------- */
  d.querySelectorAll('.tabs button').forEach(function(b){ b.addEventListener('click',function(){
    d.querySelectorAll('.tabs button').forEach(function(x){ x.setAttribute('aria-selected',String(x===b)) });
    d.querySelectorAll('.sec').forEach(function(s){ if(s.id) s.classList.toggle('on',s.id==='sec-'+b.dataset.sec) });
    $('hojaWA').hidden=true; if(b.dataset.sec!=='escanear') paraCam(); if(b.dataset.sec==='ganancias') reporte(); if(b.dataset.sec==='citas'){ $('badge').hidden=true }
    scrollTo(0,0);
  }) });

  /* sesión guardada */
  if(clave){ api('resumen').then(function(j){ if(j.ok) arrancar(j); else { clave=''; try{ localStorage.removeItem(GUARDA) }catch(e){} } }).catch(function(){}) }
})();
