  /* proformas (herramienta interna) */
  (function(){
    var pf=$('pf'); if(!pf) return;
    var F_REG='__F_REG__', F_BOLD='__F_BOLD__', F_TIT='__F_TIT__', WEB='__WEB__';
    var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
    var CAMPOS=['cliente','cedula','tel','correo','dir','veh','placa','origen','destino','num','fecha','validez','iva','pago','obs','firma','cargo','fced','banco'];
    var DEL_CLIENTE=['cliente','cedula','tel','correo','dir','veh','placa','origen','destino','obs'];
    var GUARDA='hidalgo-proforma', CUENTA='hidalgo-proforma-sig', MAX_LINEAS=10;
    var LINEA_BASE={d:'Traslado con grúa underlift',c:'1',p:''};
    var cont=$('pf-lineas');
    function hoyISO(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') }
    function limpia(t){ return String(t||'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim() }
    function multi(t){ return String(t||'').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim() }
    function v(k){ return limpia($('pf-'+k).value) }
    function entero(t){ return parseInt(String(t).replace(/[^\d]/g,''),10)||0 }
    function num(k){ return entero($('pf-'+k).value) }
    function miles(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.') }
    function col(n){ return '₡'+miles(n) }
    function nro(){ return 'N.º '+String(num('num')||1).padStart(4,'0') }
    function cedula(c){ var d=c.replace(/\D/g,''); if(d.length===10) return d[0]+'-'+d.slice(1,4)+'-'+d.slice(4); if(d.length===9) return d[0]+'-'+d.slice(1,5)+'-'+d.slice(5); return c }
    function fechaD(){ var f=$('pf-fecha').value; return /^\d{4}-\d{2}-\d{2}$/.test(f) ? new Date(f+'T12:00:00') : new Date() }
    function fechaTxt(){ var d=fechaD(); return d.getDate()+' de '+MESES[d.getMonth()]+' de '+d.getFullYear() }
    function sig(){ try{ return parseInt(localStorage.getItem(CUENTA),10)||1 }catch(e){ return 1 } }

    /* --- líneas --- */
    function filas(){ return Array.prototype.slice.call(cont.querySelectorAll('.ln')) }
    function campo(cls,etiqueta,valor,max,modo){
      var i=document.createElement('input'); i.className=cls; i.setAttribute('aria-label',etiqueta); i.value=valor||'';
      if(max) i.maxLength=max; if(modo) i.inputMode=modo; return i;
    }
    function agrega(l,foco){
      if(filas().length>=MAX_LINEAS) return;
      var f=document.createElement('div'); f.className='ln';
      var d=campo('d','Descripción',l&&l.d,110); d.placeholder='Ej. Traslado San José – Limón';
      var c=campo('c','Cantidad',l&&l.c!=null?l.c:'1',4,'numeric');
      var p=campo('p','Precio unitario en colones',l&&l.p,14,'numeric'); p.placeholder='0';
      var t=document.createElement('output');
      var x=document.createElement('button'); x.type='button'; x.textContent='✕'; x.setAttribute('aria-label','Quitar esta línea');
      x.addEventListener('click',function(){ if(filas().length>1){ f.remove(); cambio() } });
      p.addEventListener('blur',function(){ var n=entero(p.value); p.value=n?miles(n):'' });
      f.appendChild(d); f.appendChild(c); f.appendChild(p); f.appendChild(t); f.appendChild(x);
      cont.appendChild(f); if(foco) d.focus();
    }
    function lineas(){
      return filas().map(function(f){
        var d=limpia(f.querySelector('.d').value), c=entero(f.querySelector('.c').value)||1, p=entero(f.querySelector('.p').value);
        return {d:d,c:c,p:p,t:c*p,el:f};
      });
    }
    function botones(){
      var n=filas().length;
      filas().forEach(function(f){ f.querySelector('button').disabled=n<2 });
      $('pf-mas').disabled=n>=MAX_LINEAS;
      $('pf-mas').textContent=n>=MAX_LINEAS?'Máximo '+MAX_LINEAS+' líneas':'+ Agregar línea';
    }

    function datos(){
      var iva=Math.min(99,num('iva')), ls=lineas(), usadas=ls.filter(function(l){ return l.d && l.p>0 });
      var sub=usadas.reduce(function(a,l){ return a+l.t },0), imp=Math.round(sub*iva/100);
      var cli=[];
      if(v('cedula')) cli.push('Cédula: '+cedula(v('cedula')));
      if(v('tel')) cli.push('Teléfono: '+v('tel'));
      if(v('correo')) cli.push('Correo: '+v('correo'));
      if(v('dir')) cli.push(v('dir'));
      var srv=[];
      if(v('veh')||v('placa')) srv.push('Vehículo: '+[v('veh'),v('placa')?'placa '+v('placa'):''].filter(Boolean).join(', '));
      if(v('origen')) srv.push('Desde: '+v('origen'));
      if(v('destino')) srv.push('Hasta: '+v('destino'));
      var tot=[];
      if(iva>0){ tot.push(['Subtotal',col(sub),'sub']); tot.push(['IVA ('+iva+'%)',col(imp),'sub']) }
      tot.push(['Total',col(sub+imp),'tot']);
      var dias=num('validez'), cond=[];
      if(v('pago')) cond.push('Forma de pago: '+v('pago')+'.');
      if(dias) cond.push('Esta proforma es válida por '+dias+' días.');
      var firma=v('firma')||'Grúas Hidalgo';
      return {
        num:nro(), fecha:fechaTxt(), cliente:v('cliente'), cli:cli, srv:srv.length?srv:['Servicio de grúa para pesados'],
        items:usadas, todas:ls, totales:tot, obs:multi($('pf-obs').value), cond:cond.join(' '),
        banco:multi($('pf-banco').value), firma:firma, cargo:[v('cargo'),v('fced')?'Cédula '+v('fced'):''].filter(Boolean).join(' · ')
      };
    }
    function celda(tr,txt,tag){ var c=document.createElement(tag||'td'); c.textContent=txt; tr.appendChild(c); return c }
    function vista(){
      var D=datos();
      D.todas.forEach(function(l){ l.el.querySelector('output').textContent=l.p?col(l.t):'—' });
      var tt=$('pf-totales'); tt.textContent='';
      D.totales.forEach(function(f){ var s=document.createElement(f[2]==='tot'?'b':'span'); s.textContent=f[0]+': '+f[1]; tt.appendChild(s) });
      $('hv-num').textContent=D.num; $('hv-fecha').textContent=D.fecha;
      $('hv-cliente').textContent=D.cliente||'Nombre del cliente'; $('hv-datos').textContent=D.cli.join('\n');
      $('hv-serv').textContent=D.srv.join('\n'); $('hv-obs').textContent=D.obs; $('hv-cond').textContent=D.cond;
      $('hv-banco').textContent=D.banco; $('hv-banco-c').classList.toggle('vacio',!D.banco);
      $('hv-firma').textContent=D.firma; $('hv-cargo').textContent=D.cargo;
      var t=$('hv-tabla'); t.textContent='';
      var th=document.createElement('tr'); ['Descripción','Cant.','Precio unit.','Total'].forEach(function(x){ celda(th,x,'th') }); t.appendChild(th);
      (D.items.length?D.items:[{d:'(agregue una línea con precio)',c:1,p:0,t:0}]).forEach(function(l){
        var tr=document.createElement('tr'); tr.className='it'; celda(tr,l.d); celda(tr,String(l.c)); celda(tr,col(l.p)); celda(tr,col(l.t)); t.appendChild(tr) });
      D.totales.forEach(function(f){ var tr=document.createElement('tr'); tr.className=f[2]; var a=celda(tr,f[0]); a.colSpan=3; celda(tr,f[1]); t.appendChild(tr) });
      /* achica la letra si no cabe, igual que el PDF */
      var hoja=$('hoja'), cuerpo=$('hv-cuerpo'), pie=hoja.querySelector('.h-pie');
      if(!hoja.getBoundingClientRect().height) return;
      [1,.93,.86,.8,.74,.68].some(function(k){ hoja.style.setProperty('--k',k); return cuerpo.getBoundingClientRect().bottom<=pie.getBoundingClientRect().top-4 });
    }
    function guarda(){ try{
      var o={}; CAMPOS.forEach(function(k){ o[k]=$('pf-'+k).value });
      o.lineas=filas().map(function(f){ return {d:f.querySelector('.d').value,c:f.querySelector('.c').value,p:f.querySelector('.p').value} });
      localStorage.setItem(GUARDA,JSON.stringify(o)) }catch(e){} }
    function carga(){
      var o=null; try{ o=JSON.parse(localStorage.getItem(GUARDA)||'null') }catch(e){}
      if(o&&typeof o==='object') CAMPOS.forEach(function(k){ if(typeof o[k]==='string') $('pf-'+k).value=o[k] });
      var ls=o&&Array.isArray(o.lineas)?o.lineas.filter(function(l){ return l&&typeof l==='object' }).slice(0,MAX_LINEAS):null;
      (ls&&ls.length?ls:[LINEA_BASE]).forEach(function(l){ agrega({d:String(l.d||''),c:String(l.c||'1'),p:String(l.p||'')}) });
    }
    function cambio(){ botones(); vista(); guarda() }
    function msg(t,mal){ var m=$('pf-msg'); m.textContent=t; m.className='pro-msg '+(mal?'mal':'bien') }

    /* --- PDF (carta, en puntos) --- */
    var NAVY=[10,14,26], AZUL=[43,58,168], GRIS=[241,243,247], TXT=[26,31,46], SUAVE=[74,81,99];
    function dibuja(J,D,k){
      var doc=new J({unit:'pt',format:'letter'});
      doc.addFileToVFS('BR.ttf',F_REG); doc.addFont('BR.ttf','Barlow','normal');
      doc.addFileToVFS('BB.ttf',F_BOLD); doc.addFont('BB.ttf','Barlow','bold');
      doc.addFileToVFS('BT.ttf',F_TIT); doc.addFont('BT.ttf','Titulo','bold');
      doc.setProperties({title:'Proforma '+D.num+' '+D.cliente, author:'Grúas Hidalgo'});
      var L=36, R=576, W=R-L, fs=9.5*k, ld=13*k;
      function fill(c){ doc.setFillColor(c[0],c[1],c[2]) } function ink(c){ doc.setTextColor(c[0],c[1],c[2]) }
      function lineas(t,w){ return t?doc.splitTextToSize(t,w):[] }
      /* marca de agua y encabezado */
      doc.addImage(document.querySelector('.hoja-marca').src,'PNG',156,300,300,273);
      fill(NAVY); doc.rect(0,0,612,117,'F'); fill(AZUL); doc.rect(0,112,612,5,'F');
      doc.addImage(document.querySelector('.h-logo').src,'PNG',36,14,98,89);
      ink([255,255,255]); doc.setFont('Titulo','bold'); doc.setFontSize(30); doc.text('GRÚAS HIDALGO',146,54);
      doc.setFont('Barlow','normal'); doc.setFontSize(9.5); ink([195,200,209]); doc.text('Grúa para camiones pesados · 24 horas · Todo Costa Rica',146,71);
      doc.setFont('Barlow','bold'); ink([255,255,255]); doc.text('WhatsApp 8838-1397 · '+WEB,146,86);
      doc.setFont('Titulo','bold'); doc.setFontSize(28); doc.text('PROFORMA',R,52,{align:'right'});
      doc.setFont('Barlow','bold'); doc.setFontSize(11); ink([140,156,255]); doc.text(D.num,R,70,{align:'right'});
      doc.setFont('Barlow','normal'); doc.setFontSize(9.5); ink([255,255,255]); doc.text(D.fecha,R,86,{align:'right'});
      /* cajas cliente / servicio */
      var y=139, cw=(W-12)/2, pad=10;
      doc.setFontSize(fs);
      doc.setFont('Barlow','bold'); var cn=lineas(D.cliente,cw-pad*2);
      doc.setFont('Barlow','normal');
      var cd=[]; D.cli.forEach(function(l){ cd=cd.concat(lineas(l,cw-pad*2)) });
      var sd=[]; D.srv.forEach(function(l){ sd=sd.concat(lineas(l,cw-pad*2)) });
      var h=Math.max(cn.length+cd.length,sd.length)*ld+ (12*k+6) + pad*1.4;
      [L,L+cw+12].forEach(function(x){ fill(GRIS); doc.rect(x,y,cw,h,'F'); fill(AZUL); doc.rect(x,y,3,h,'F') });
      ink(AZUL); doc.setFont('Titulo','bold'); doc.setFontSize(12*k);
      doc.text('CLIENTE',L+pad,y+pad+8*k); doc.text('SERVICIO',L+cw+12+pad,y+pad+8*k);
      var yy=y+pad+8*k+ld; ink(TXT); doc.setFontSize(fs);
      doc.setFont('Barlow','bold'); doc.text(cn,L+pad,yy); yy+=ld*cn.length;
      doc.setFont('Barlow','normal'); cd.forEach(function(l){ doc.text(l,L+pad,yy); yy+=ld });
      yy=y+pad+8*k+ld; sd.forEach(function(l){ doc.text(l,L+cw+12+pad,yy); yy+=ld });
      y+=h+ld*1.5;
      doc.text('Por este medio le presentamos la cotización solicitada para el servicio de grúa:',L,y); y+=ld*.9;
      /* tabla */
      var fT=9*k, rh=17*k, cC=L+W*.62, cP=L+W*.80, cT=R-6, wD=W*.55;
      doc.setFontSize(fT); fill(NAVY); doc.rect(L,y,W,rh,'F'); ink([255,255,255]); doc.setFont('Barlow','bold');
      var by=y+rh*.66; doc.text('Descripción',L+6,by); doc.text('Cant.',cC,by,{align:'right'}); doc.text('Precio unit.',cP,by,{align:'right'}); doc.text('Total',cT,by,{align:'right'});
      y+=rh; doc.setFont('Barlow','normal'); ink(TXT); doc.setDrawColor(213,217,226); doc.setLineWidth(.6);
      D.items.forEach(function(l,i){
        var dl=lineas(l.d,wD), hh=rh+(dl.length-1)*fT*1.25;
        if(i%2===0){ fill([246,247,250]); doc.rect(L,y,W,hh,'F') }
        var ty=y+rh*.66; doc.text(dl,L+6,ty); doc.text(String(l.c),cC,ty,{align:'right'}); doc.text(col(l.p),cP,ty,{align:'right'}); doc.text(col(l.t),cT,ty,{align:'right'});
        y+=hh; doc.line(L,y,R,y);
      });
      D.totales.forEach(function(f){
        var b=f[2]==='tot', ty=y+rh*.66;
        if(b){ fill(AZUL); doc.rect(cC-30,y+2,R-(cC-30),rh,'F'); ty+=2; ink([255,255,255]) } else ink(TXT);
        doc.setFont('Barlow',b?'bold':'normal'); doc.setFontSize(b?fT*1.12:fT);
        if(b){ ink(TXT); doc.text(f[0],cC-38,ty,{align:'right'}); ink([255,255,255]) } else doc.text(f[0],cP,ty,{align:'right'});
        doc.text(f[1],cT,ty,{align:'right'}); y+=b?rh+4:rh*.9;
      });
      ink(TXT); doc.setFont('Barlow','normal'); doc.setFontSize(fs); y+=ld*.6;
      if(D.obs){ var ob=lineas(D.obs,W); doc.text(ob,L,y+ld*.4); y+=ld*ob.length+ld*.4 }
      if(D.cond){ ink(SUAVE); var co=lineas(D.cond,W); doc.text(co,L,y+ld*.4); y+=ld*co.length+ld*.4; ink(TXT) }
      /* pago y firma */
      y+=ld*.8;
      var bw=W*.55, bl=lineas(D.banco,bw-20), bh=D.banco?(12*k+6)+bl.length*ld+14:0;
      var fy=y+Math.max(bh,54);
      if(D.banco){ fill(GRIS); doc.rect(L,y,bw,bh,'F'); ink(AZUL); doc.setFont('Titulo','bold'); doc.setFontSize(12*k); doc.text('DATOS PARA EL PAGO',L+10,y+8+8*k);
        ink(TXT); doc.setFont('Barlow','normal'); doc.setFontSize(fs); doc.text(bl,L+10,y+8+8*k+ld) }
      var fx=L+bw+20+(R-(L+bw+20))/2;
      doc.setDrawColor(26,31,46); doc.setLineWidth(.8); doc.line(fx-90,fy-26,fx+90,fy-26);
      ink(TXT); doc.setFont('Barlow','bold'); doc.setFontSize(fs); doc.text(D.firma,fx,fy-14,{align:'center'});
      doc.setFont('Barlow','normal'); ink(SUAVE); if(D.cargo) doc.text(D.cargo,fx,fy-2,{align:'center'});
      var fin=fy;
      /* pie */
      fill(AZUL); doc.rect(0,759,612,3,'F'); fill(NAVY); doc.rect(0,762,612,30,'F');
      ink([255,255,255]); doc.setFontSize(8.5); doc.text('Grúas Hidalgo · WhatsApp 8838-1397 · 24 horas · Todo Costa Rica',306,780,{align:'center'});
      return {doc:doc, fin:fin};
    }
    function pdf(){
      var D=datos(), malas=0;
      $('pf-cliente').setAttribute('aria-invalid',String(!D.cliente));
      D.todas.forEach(function(l){
        var vacia=!l.d && !l.p, okD=!!l.d||vacia, okP=l.p>0||vacia;
        l.el.querySelector('.d').setAttribute('aria-invalid',String(!okD)); l.el.querySelector('.p').setAttribute('aria-invalid',String(!okP));
        if(!okD||!okP) malas++;
      });
      if(!D.cliente){ msg('Falta el nombre del cliente.',true); $('pf-cliente').focus(); return }
      if(!D.items.length){ msg('Agregue al menos una línea con descripción y precio.',true); return }
      if(malas){ msg('Hay líneas sin descripción o sin precio. Complételas o quítelas con la ✕.',true); return }
      if(!window.jspdf || !window.jspdf.jsPDF){ msg('No se pudo cargar el generador de PDF. Revise la conexión a internet y vuelva a intentar.',true); return }
      try{
        var r, ks=[1,.93,.86,.8,.74,.68];
        for(var i=0;i<ks.length;i++){ r=dibuja(window.jspdf.jsPDF,D,ks[i]); if(r.fin<=748) break; }
        var nombre=('Proforma '+String(num('num')||1).padStart(4,'0')+' '+D.cliente).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim().slice(0,90).replace(/[.\s]+$/,'');
        r.doc.save(nombre+'.pdf');
        try{ var n=num('num')||1; if(n>=sig()) localStorage.setItem(CUENTA,String(n+1)) }catch(e){}
        msg(r.fin<=748 ? 'Listo: se descargó la proforma '+D.num+'.' : 'Se descargó, pero hay mucho texto: revise el PDF y acorte descripciones u observaciones.', r.fin>748);
      }catch(e){ msg('No se pudo crear el PDF. Intente de nuevo.',true) }
    }
    carga();
    if(!num('num')) $('pf-num').value=String(sig());
    if(!$('pf-fecha').value) $('pf-fecha').value=hoyISO();
    pf.addEventListener('input',function(e){ if(e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); cambio() });
    pf.addEventListener('submit',function(e){ e.preventDefault() });
    $('pf-mas').addEventListener('click',function(){ agrega({d:'',c:'1',p:''},true); cambio() });
    $('pf-pdf').addEventListener('click',pdf);
    $('pf-limpiar').addEventListener('click',function(){
      DEL_CLIENTE.forEach(function(k){ $('pf-'+k).value='' });
      filas().forEach(function(f){ f.remove() }); agrega(LINEA_BASE);
      $('pf-fecha').value=hoyISO(); $('pf-num').value=String(Math.max(sig(),(num('num')||0)+0));
      cambio(); $('pf-cliente').focus(); msg('Proforma nueva: '+nro()+'.',false) });
    /* se abre solo con el enlace privado ...#proformas (no hay botón público) */
    function abrirP(){ var x=$('dlg-proformas'); if(!x.open){ x.showModal(); x.scrollTop=0 } setTimeout(vista,30) }
    if(location.hash==='#proformas') setTimeout(abrirP,50);
    addEventListener('hashchange',function(){ if(location.hash==='#proformas') abrirP() });
    botones(); vista();
  })();
