(function(){
  'use strict';
  var d=document, $=function(i){ return d.getElementById(i) };
  var META=10, QRS=__QRS__;
  var GOTA='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5c-.4 0-.7.2-.9.5C9.4 5.6 5.5 10.9 5.5 14.5a6.5 6.5 0 0 0 13 0c0-3.6-3.9-8.9-5.6-11.5a1.1 1.1 0 0 0-.9-.5z"/></svg>';
  var REGALO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></svg>';
  var CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  function base(){ return {
    cli:[
      {id:'MZ-7K4Q',n:'Andrea Mora',carro:'Toyota RAV4 · gris',s:7,hist:[['Sello · Lavado Deluxe','12 oct'],['Sello · Lavado básico','28 set'],['Sello · Lavado + Aroma','14 set']]},
      {id:'MZ-2P9X',n:'Carlos Brenes',carro:'Hyundai Tucson · negro',s:9,hist:[['Sello · Lavado básico','20 oct'],['Sello · Lavado Deluxe','6 oct']]},
      {id:'MZ-5T1C',n:'Daniela Solís',carro:'Suzuki Swift · rojo',s:3,hist:[['Sello · Lavado básico','25 oct'],['Tarjeta creada','2 set']]}
    ],
    citas:[
      {h:'9:00 a. m.',c:0,paq:'Lavado Deluxe',lugar:'Tres Ríos, La Unión',hecho:false},
      {h:'11:30 a. m.',c:1,paq:'Lavado + Tapicería',lugar:'Cartago centro',hecho:false},
      {h:'2:00 p. m.',c:2,paq:'Lavado básico',lugar:'Paraíso',hecho:false}
    ],
    hoy:0, cur:0 } }
  var S=base();
  var movil=matchMedia('(max-width:900px)');

  /* ---- hora ---- */
  function hora(){ try{ var t=new Intl.DateTimeFormat('es-CR',{timeZone:'America/Costa_Rica',hour:'numeric',minute:'2-digit',hour12:false}).format(new Date()); $('hora1').textContent=t; $('hora2').textContent=t }catch(e){} }
  hora(); setInterval(hora,30000);

  /* ---- vista cliente ---- */
  var sel=$('cliSel');
  S.cli.forEach(function(c,i){ var o=d.createElement('option'); o.value=i; o.textContent=c.n; sel.appendChild(o) });
  sel.addEventListener('change',function(){ S.cur=+sel.value; tarjeta(-1) });
  function tarjeta(nuevo){
    var c=S.cli[S.cur]; sel.value=S.cur;
    $('tjNombre').textContent=c.n; $('tjCarro').textContent=c.carro; $('tjCodigo').textContent=c.id;
    var premio=c.s>=META; $('tarjeta').classList.toggle('premio',premio); $('premioMsg').classList.toggle('on',premio);
    var cont=$('sellos'); cont.textContent='';
    for(var i=0;i<META;i++){
      var e=d.createElement('div'); e.className='sello'+(i<c.s?' on':'')+(i===META-1&&i>=c.s?' regalo':'')+(i===nuevo?' nuevo':'');
      e.innerHTML=(i===META-1&&i>=c.s)?REGALO:GOTA; e.setAttribute('aria-hidden','true'); cont.appendChild(e);
    }
    $('sellos').setAttribute('aria-label',c.s+' de '+META+' sellos');
    $('tjCuenta').textContent=Math.min(c.s,META)+' / '+META;
    $('tjFalta').textContent=premio?'¡Lavado gratis listo!':'Le faltan '+(META-c.s)+(META-c.s===1?' lavado':' lavados')+' para el lavado gratis';
    $('tjBarra').style.width=(Math.min(c.s,META)/META*100)+'%';
    $('qrCli').innerHTML=QRS[c.id];
    var h=$('hist'); h.textContent='';
    c.hist.slice(0,6).forEach(function(x,k){ var r=d.createElement('div'); if(k===0&&nuevo>=0) r.className='nuevo'; var b=d.createElement('b'); b.textContent=x[0]; var s=d.createElement('span'); s.textContent=x[1]; r.appendChild(b); r.appendChild(s); h.appendChild(r) });
  }
  var tNoti;
  function noti(t,p){ $('notiT').textContent=t; $('notiP').textContent=p; var n=$('noti'); n.classList.add('on'); clearTimeout(tNoti); tNoti=setTimeout(function(){ n.classList.remove('on') },4200) }

  /* pantalla de inicio */
  $('icoMz').style.backgroundImage='url("'+d.querySelector('.noti img').src+'")';
  $('btnInicio').addEventListener('click',function(){ $('inicioOv').classList.add('on') });
  $('cerrarOv').addEventListener('click',function(){ $('inicioOv').classList.remove('on') });
  d.querySelectorAll('.so-tabs button').forEach(function(b){ b.addEventListener('click',function(){
    d.querySelectorAll('.so-tabs button').forEach(function(x){ x.setAttribute('aria-selected',String(x===b)) });
    $('pasosIos').hidden=b.dataset.so!=='ios'; $('pasosAnd').hidden=b.dataset.so!=='and' }) });

  /* ---- acciones del dueño ---- */
  var tToast;
  function toast(t){ var e=$('pnToast'); e.textContent=t; e.classList.add('on'); clearTimeout(tToast); tToast=setTimeout(function(){ e.classList.remove('on') },2600) }
  function mostrarCliente(i,nuevo){
    S.cur=i; tarjeta(nuevo); $('scrollCli').scrollTo({top:0,behavior:'smooth'});
    if(movil.matches) setTimeout(function(){ vista('cli') },700);
  }
  function darSello(i,paq){
    var c=S.cli[i]; if(c.s>=META) return;
    c.s++; S.hoy++; c.hist.unshift(['Sello · '+(paq||'Lavado'),'Hoy']);
    toast('✓ Sello agregado a '+c.n.split(' ')[0]+' ('+c.s+'/'+META+')');
    mostrarCliente(i,c.s-1);
    setTimeout(function(){
      if(c.s>=META) noti('🎁 ¡Lavado gratis desbloqueado!','Completó sus '+META+' sellos. Muestre su tarjeta en la próxima cita.');
      else noti('¡Sello agregado! '+c.s+' de '+META,'Gracias por lavar con Monzú. Le faltan '+(META-c.s)+' para su lavado gratis.');
    },movil.matches?900:350);
    panel();
  }
  function canjear(i){
    var c=S.cli[i]; if(c.s<META) return;
    c.s=0; c.hist.unshift(['🎁 Premio canjeado: lavado gratis','Hoy']);
    toast('🎁 Premio canjeado. La tarjeta de '+c.n.split(' ')[0]+' vuelve a empezar.');
    mostrarCliente(i,-1); setTimeout(function(){ noti('¡Disfrute su lavado gratis!','Su tarjeta Monzú Club empieza de nuevo. ¡Gracias por su lealtad!') },movil.matches?900:350);
    panel();
  }
  function boton(txt,cls,fn,icono){ var b=d.createElement('button'); b.type='button'; b.className='btn-ok'+(cls?' '+cls:''); b.innerHTML=icono||''; b.appendChild(d.createTextNode(txt)); b.addEventListener('click',fn); return b }
  function mini(s){ var m=d.createElement('span'); m.className='mini-sellos'; for(var i=0;i<META;i++){ var x=d.createElement('i'); if(i<s) x.className='on'; m.appendChild(x) } return m }
  function panel(){
    /* citas */
    var sc=$('sec-citas'); sc.textContent='';
    S.citas.forEach(function(ct){
      var c=S.cli[ct.c], box=d.createElement('div'); box.className='cita';
      var top=d.createElement('div'); top.className='cita-top';
      var h=d.createElement('b'); h.textContent=ct.h; var st=d.createElement('span'); st.textContent=ct.hecho?'Terminado':'Confirmada'; if(ct.hecho) st.className='hecho';
      top.appendChild(h); top.appendChild(st); box.appendChild(top);
      var p=d.createElement('p'); var st2=d.createElement('strong'); st2.textContent=c.n; p.appendChild(st2); p.appendChild(d.createTextNode(' · '+ct.paq)); box.appendChild(p);
      var p2=d.createElement('p'); p2.textContent=c.carro+' · '+ct.lugar; box.appendChild(p2);
      var ses=d.createElement('div'); ses.className='ses'; ses.appendChild(mini(c.s)); ses.appendChild(d.createTextNode(' '+Math.min(c.s,META)+'/'+META+' sellos')); box.appendChild(ses);
      if(c.s>=META) box.appendChild(boton('Canjear lavado gratis','btn-premio',function(){ canjear(ct.c) },REGALO));
      else if(ct.hecho){ var bb=boton('Sello dado ✓','',function(){}); bb.disabled=true; box.appendChild(bb) }
      else box.appendChild(boton('Terminado: dar sello','',function(){ ct.hecho=true; darSello(ct.c,ct.paq) },CHECK));
      sc.appendChild(box);
    });
    /* clientes */
    var k=$('kpis'); k.textContent='';
    [[S.cli.length,'Clientes en el club'],[S.hoy,'Sellos dados hoy'],[S.cli.filter(function(c){return c.s>=META}).length,'Premios listos'],[S.cli.filter(function(c){return c.s>=META-2&&c.s<META}).length,'Cerca del premio']].forEach(function(x){
      var e=d.createElement('div'); var b=d.createElement('b'); b.textContent=x[0]; var s=d.createElement('small'); s.textContent=x[1]; e.appendChild(b); e.appendChild(s); k.appendChild(e) });
    var l=$('listaCli'); l.textContent='';
    S.cli.slice().sort(function(a,b){ return b.s-a.s }).forEach(function(c){
      var e=d.createElement('div'); e.className='cli'; var izq=d.createElement('div'); var b=d.createElement('b'); b.textContent=c.n; var sm=d.createElement('small'); sm.textContent=c.carro+' · '+c.id;
      izq.appendChild(b); izq.appendChild(sm); izq.appendChild(mini(c.s)); var em=d.createElement('em'); em.textContent=c.s>=META?'🎁 Premio':c.s+'/'+META; if(c.s>=META) em.className='oro';
      e.appendChild(izq); e.appendChild(em); l.appendChild(e) });
  }
  /* pestañas del panel */
  d.querySelectorAll('.pn-tabs button').forEach(function(b){ b.addEventListener('click',function(){
    d.querySelectorAll('.pn-tabs button').forEach(function(x){ x.setAttribute('aria-selected',String(x===b)) });
    d.querySelectorAll('.pn-sec').forEach(function(s){ s.classList.toggle('on',s.id==='sec-'+b.dataset.sec) }) }) });

  /* escanear (simulado: lee la tarjeta que muestra el celular del cliente) */
  $('btnEsc').addEventListener('click',function(){
    var z=$('escZona'), i=S.cur, c=S.cli[i]; z.textContent='';
    var cam=d.createElement('div'); cam.className='camara';
    var q=d.createElement('div'); q.className='qr-v'; q.innerHTML=QRS[c.id];
    var m=d.createElement('div'); m.className='marco'; var ln=d.createElement('div'); ln.className='linea'; var tx=d.createElement('p'); tx.textContent='Buscando código…';
    cam.appendChild(q); cam.appendChild(m); cam.appendChild(ln); cam.appendChild(tx); z.appendChild(cam);
    setTimeout(function(){
      z.textContent='';
      var h=d.createElement('div'); h.className='hallado';
      var t=d.createElement('div'); t.textContent='✓ Tarjeta encontrada · '+c.id; t.className='ok-esc';
      var b=d.createElement('b'); b.textContent=c.n;
      var p=d.createElement('div'); p.className='ses'; p.appendChild(mini(c.s)); p.appendChild(d.createTextNode(' '+Math.min(c.s,META)+'/'+META+' sellos · '+c.carro));
      h.appendChild(t); h.appendChild(b); h.appendChild(p);
      if(c.s>=META) h.appendChild(boton('Canjear lavado gratis','btn-premio',function(){ canjear(i); z.textContent='' },REGALO));
      else h.appendChild(boton('Dar sello','',function(){ darSello(i,'Lavado'); z.textContent='' },CHECK));
      z.appendChild(h);
    },1700);
  });
  $('reiniciar').addEventListener('click',function(){ S=base(); tarjeta(-1); panel(); toast('Demostración reiniciada') });

  /* pestañas cliente / dueño en celular */
  function vista(v){
    $('tabCli').setAttribute('aria-selected',String(v==='cli')); $('tabDue').setAttribute('aria-selected',String(v==='due'));
    $('ladoCli').classList.toggle('ver',v==='cli'); $('ladoDue').classList.toggle('ver',v==='due');
  }
  $('tabCli').addEventListener('click',function(){ vista('cli') });
  $('tabDue').addEventListener('click',function(){ vista('due') });
  function ajusta(){ if(!movil.matches){ $('ladoCli').classList.add('ver'); $('ladoDue').classList.add('ver') } else vista($('tabDue').getAttribute('aria-selected')==='true'?'due':'cli') }
  movil.addEventListener?movil.addEventListener('change',ajusta):movil.addListener(ajusta);

  tarjeta(-1); panel(); ajusta();
  setTimeout(function(){ noti('Bienvenida a Monzú Club 💧','Pruebe: en el panel del dueño toque "Terminado: dar sello".') },1200);
})();
