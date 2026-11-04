(function(){
  'use strict';
  var d=document, $=function(i){ return d.getElementById(i) };
  var NS='http://www.w3.org/2000/svg', CLAVE='monzu-tarjeta', ultimo=null, tPoll=null;
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
    var pc=$('proxCita'); pc.hidden=!j.proxima; if(j.proxima) pc.textContent='📅 Próxima cita: '+fmtFL(j.proxima.fecha)+', '+fmtH(j.proxima.hora)+(j.proxima.estado==='confirmada'?' · confirmada ✓':' · por confirmar');
    var h=$('hist'); h.textContent='';
    t.hist.forEach(function(x){ var r=d.createElement('div'), b=d.createElement('b'), sp=d.createElement('span'); b.textContent=x[0]; sp.textContent=fmtF(x[1]); r.appendChild(b); r.appendChild(sp); h.appendChild(r) });
  }
  function muestra(id){ ['cargando','sinTarjeta','vista'].forEach(function(x){ $(x).hidden=x!==id }) }
  function carga(primera){
    if(!tk){ muestra('sinTarjeta'); return }
    fetch('/api/tarjeta?t='+encodeURIComponent(tk),{headers:{accept:'application/json'},cache:'no-store'})
      .then(function(r){ return r.json().then(function(j){ return {r:r,j:j} }) })
      .then(function(o){
        if(!o.j.ok){ if(o.r.status===404){ try{ localStorage.removeItem(CLAVE) }catch(e){} $('sinTxt').textContent='No encontramos esa tarjeta. Revise el enlace que le enviamos o escríbanos por WhatsApp.'; muestra('sinTarjeta') } return }
        var s=o.j.tarjeta.sellos, antes=ultimo;
        var nuevo=antes!==null && s>antes;
        if(primera||nuevo||antes===null||s!==antes||JSON.stringify(o.j)!==carga.prev){ pinta(o.j,nuevo); carga.prev=JSON.stringify(o.j) }
        if(primera){ dibujaQR(location.origin+'/tarjeta.html?t='+tk); muestra('vista') }
        if(nuevo){ if(navigator.vibrate) navigator.vibrate([80,60,120]); toast(s>=o.j.tarjeta.meta?'🎁 ¡Lavado gratis desbloqueado!':'💧 ¡Sello agregado! '+s+' de '+o.j.tarjeta.meta,' Gracias por lavar con Monzú.') }
        if(antes!==null && s<antes && s===0) toast('🎁 ¡Disfrute su lavado gratis!',' Su tarjeta empieza de nuevo.');
        ultimo=s;
      })
      .catch(function(){ if(primera){ $('sinTxt').textContent='No hay conexión en este momento. Revise su internet e intente de nuevo.'; muestra('sinTarjeta') } });
  }
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
