  /* ===== Generador de proformas (herramienta interna) ===== */
  (function(){
    var pf=$('pf'); if(!pf) return;
    var F_REG='__F_REG__', F_BOLD='__F_BOLD__', F_TIT='__F_TIT__';
    var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
    var CAMPOS=['ciudad','fecha','cliente','cedula','actividad','tel','correo','dir','proyecto','horas','extra','iva','pago','obs'];
    var DEL_CLIENTE=['cliente','cedula','actividad','tel','correo','dir','proyecto','obs'];
    var GUARDA='dieca-proforma', MAX_LINEAS=10;
    var LINEA_BASE={d:'Servicio de grúa mensual (200 horas)',c:'1',p:'7.500.000'};
    var cont=$('pf-lineas');
    function hoyISO(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') }
    function limpia(t){ return String(t||'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim() }
    function v(k){ return limpia($('pf-'+k).value) }
    function entero(t){ return parseInt(String(t).replace(/[^\d]/g,''),10)||0 }
    function num(k){ return entero($('pf-'+k).value) }
    function miles(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.') }
    function col(n){ return '₡'+miles(n) }
    function cedula(c){ var d=c.replace(/\D/g,''); if(d.length===10) return d[0]+'-'+d.slice(1,4)+'-'+d.slice(4); if(d.length===9) return d[0]+'-'+d.slice(1,5)+'-'+d.slice(5); return c }
    function fechaTxt(){
      var f=$('pf-fecha').value, d=/^\d{4}-\d{2}-\d{2}$/.test(f) ? new Date(f+'T12:00:00') : new Date();
      return (v('ciudad')||'Cartago')+', '+d.getDate()+' de '+MESES[d.getMonth()]+' del '+d.getFullYear();
    }

    /* --- filas de servicios --- */
    function filas(){ return Array.prototype.slice.call(cont.querySelectorAll('.ln')) }
    function campo(cls,etiqueta,valor,max,modo){
      var i=document.createElement('input'); i.className=cls; i.setAttribute('aria-label',etiqueta); i.value=valor||'';
      if(max) i.maxLength=max; if(modo) i.inputMode=modo; return i;
    }
    function agrega(l,foco){
      if(filas().length>=MAX_LINEAS) return;
      var f=document.createElement('div'); f.className='ln';
      var d=campo('d','Descripción del servicio',l&&l.d,120); d.placeholder='Ej. Servicio de grúa x2 semanal';
      var c=campo('c','Cantidad',l&&l.c!=null?l.c:'1',4,'numeric');
      var p=campo('p','Precio unitario en colones',l&&l.p,14,'numeric'); p.placeholder='0';
      var t=document.createElement('output');
      var x=document.createElement('button'); x.type='button'; x.textContent='✕'; x.setAttribute('aria-label','Quitar este servicio');
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
      $('pf-mas').textContent=n>=MAX_LINEAS?'Máximo '+MAX_LINEAS+' servicios':'+ Agregar servicio';
    }

    function datos(){
      var iva=num('iva'), h=num('horas'), x=num('extra'), mas=iva>0?' más IVA':'';
      var ls=lineas(), usadas=ls.filter(function(l){ return l.d && l.p>0 });
      var sub=usadas.reduce(function(a,l){ return a+l.t },0), imp=sub*iva/100;
      var datosCli=[];
      if(v('cedula')) datosCli.push('Cédula jurídica: '+cedula(v('cedula')));
      if(v('tel')) datosCli.push('Teléfono: '+v('tel'));
      if(v('correo')) datosCli.push('Correo: '+v('correo'));
      if(v('dir')) datosCli.push(v('dir'));
      if(v('actividad')) datosCli.push('Actividad económica '+v('actividad'));
      var pr=v('proyecto') ? ' del proyecto '+v('proyecto')+':' : ' del proyecto:';
      var extraTxt=x>0 ? col(x)+mas+' la hora adicional'+(h>0?' después de las '+h+' del mes':'') : '';
      var frase;
      if(usadas.length===1){
        var u=usadas[0];
        frase=u.d+(u.c>1?' (x'+u.c+')':'')+' '+col(u.t)+mas+(extraTxt?' y '+extraTxt:'')+'.';
      } else {
        frase=extraTxt ? 'La hora adicional tiene un costo de '+col(x)+mas+(h>0?' después de las '+h+' horas del mes':'')+'.' : '';
      }
      var tot=[];
      if(iva>0){ tot.push(['Subtotal',col(sub),'sub']); tot.push(['IVA ('+iva+'%)',col(imp),'sub']) }
      tot.push(['Total',col(sub+imp),'tot']);
      if(x>0) tot.push(['Hora adicional ('+col(x)+(iva>0?' + IVA '+col(x*iva/100):'')+')',col(x*(1+iva/100)),'sub']);
      return {
        fecha:fechaTxt(), cliente:v('cliente'), datos:datosCli,
        saludo:'Estimados señores, por este medio adjunto la cotización solicitada'+pr,
        servicio:frase, items:usadas, todas:ls, totales:tot, sub:sub,
        obs:String($('pf-obs').value||'').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g,' ').trim(), pago:v('pago')||'Sistema de pago de contado'
      };
    }
    function celda(tr,txt,tag){ var c=document.createElement(tag||'td'); c.textContent=txt; tr.appendChild(c); return c }
    function vista(){
      var D=datos();
      D.todas.forEach(function(l){ l.el.querySelector('output').textContent=l.p?col(l.t):'—' });
      var tt=$('pf-totales'); tt.textContent='';
      D.totales.forEach(function(f){ var s=document.createElement(f[2]==='tot'?'b':'span'); s.textContent=f[0]+': '+f[1]; tt.appendChild(s) });
      $('hv-fecha').textContent=D.fecha; $('hv-cliente').textContent=D.cliente||'Nombre del cliente';
      $('hv-datos').textContent=D.datos.join('\n'); $('hv-saludo').textContent=D.saludo; $('hv-servicio').textContent=D.servicio;
      $('hv-obs').textContent=D.obs; $('hv-pago').textContent=D.pago;
      var t=$('hv-tabla'); t.textContent='';
      var th=document.createElement('tr'); ['Descripción','Cant.','Precio unit.','Total'].forEach(function(x){ celda(th,x,'th') }); t.appendChild(th);
      (D.items.length?D.items:[{d:'(agregue un servicio)',c:1,p:0,t:0}]).forEach(function(l){
        var tr=document.createElement('tr'); celda(tr,l.d); celda(tr,String(l.c)); celda(tr,col(l.p)); celda(tr,col(l.t)); t.appendChild(tr) });
      D.totales.forEach(function(f){
        var tr=document.createElement('tr'); tr.className=f[2]; var a=celda(tr,f[0]); a.colSpan=3; celda(tr,f[1]); t.appendChild(tr) });
      /* achica la vista previa si el texto llega a la firma, igual que el PDF */
      var hoja=$('hoja'), banco=hoja.querySelector('.hoja-banco'), firma=hoja.querySelector('.hoja-firma');
      [1,.93,.86,.8,.74,.68].some(function(k){ hoja.style.setProperty('--k',k); return banco.getBoundingClientRect().bottom<=firma.getBoundingClientRect().top+2 });
    }
    function guarda(){ try{
      var o={}; CAMPOS.forEach(function(k){ o[k]=$('pf-'+k).value });
      o.lineas=filas().map(function(f){ return {d:f.querySelector('.d').value,c:f.querySelector('.c').value,p:f.querySelector('.p').value} });
      localStorage.setItem(GUARDA,JSON.stringify(o)) }catch(e){} }
    function carga(){
      var o=null; try{ o=JSON.parse(localStorage.getItem(GUARDA)||'null') }catch(e){}
      if(o) CAMPOS.forEach(function(k){ if(typeof o[k]==='string') $('pf-'+k).value=o[k] });
      var ls=o&&Array.isArray(o.lineas)?o.lineas.filter(function(l){ return l&&typeof l==='object' }).slice(0,MAX_LINEAS):null;
      if(!ls && o && typeof o.servicio==='string'){ /* datos guardados con la versión anterior */
        ls=[{d:o.servicio+(o.horas?' ('+o.horas+' horas)':''),c:'1',p:o.monto||''}];
      }
      (ls&&ls.length?ls:[LINEA_BASE]).forEach(function(l){ agrega({d:String(l.d||''),c:String(l.c||'1'),p:String(l.p||'')}) });
    }
    function cambio(){ botones(); vista(); guarda() }
    function msg(t,mal){ var m=$('pf-msg'); m.textContent=t; m.className='pro-msg '+(mal?'mal':'bien') }

    function dibuja(J,D,k){
      var doc=new J({unit:'pt',format:'letter'});
      doc.addFileToVFS('ArchivoR.ttf',F_REG); doc.addFont('ArchivoR.ttf','Archivo','normal');
      doc.addFileToVFS('ArchivoB.ttf',F_BOLD); doc.addFont('ArchivoB.ttf','Archivo','bold');
      doc.addFileToVFS('Titulo.ttf',F_TIT); doc.addFont('Titulo.ttf','Titulo','bold');
      doc.setProperties({title:'Proforma '+D.cliente, author:'Grúas Dieca S.A.'});
      doc.addImage(document.querySelector('.hoja-fondo').src,'JPEG',32,180,504,472);
      doc.setTextColor(17,17,17);
      doc.setFont('Titulo','bold'); doc.setFontSize(25); doc.text('GRÚAS DIECA S.A.',306,52,{align:'center'});
      doc.setLineWidth(1.4); doc.line(84,62,528,62);
      var L=84, R=528, W=R-L, fs=11*k, ld=14.5*k, y=158;
      doc.setLineHeightFactor(ld/fs);
      doc.setFont('Archivo','normal'); doc.setFontSize(fs); doc.text(D.fecha,R,y,{align:'right'});
      y+=ld*2.4; doc.text('Señores',L,y);
      y+=ld*1.6; doc.setFont('Archivo','bold');
      var cl=doc.splitTextToSize(D.cliente,W); doc.text(cl,L,y); y+=ld*(cl.length-1);
      doc.setFont('Archivo','normal'); doc.setFontSize(fs*.93);
      D.datos.forEach(function(l){ y+=ld*.92; doc.text(doc.splitTextToSize(l,W)[0],L,y) });
      doc.setFontSize(fs); y+=ld*1.9;
      var s=doc.splitTextToSize(D.saludo,W); doc.text(s,L,y); y+=ld*s.length+ld*.2;
      if(D.servicio){ var sv=doc.splitTextToSize(D.servicio,W); doc.text(D.servicio,L,y,{maxWidth:W,align:'justify'}); y+=ld*sv.length+ld*.3; }
      /* tabla: descripción | cant. | precio unit. | total */
      var fT=fs*.88, lT=ld*.9, cC=L+W*.60, cP=L+W*.80, cT=R-4, wD=W*.52;
      doc.setFontSize(fT); doc.setLineWidth(.5);
      doc.setFont('Archivo','bold'); doc.setDrawColor(17);
      doc.text('Descripción',L+4,y); doc.text('Cant.',cC,y,{align:'right'}); doc.text('Precio unit.',cP,y,{align:'right'}); doc.text('Total',cT,y,{align:'right'});
      doc.line(L,y+lT*.38,R,y+lT*.38); y+=lT*1.25;
      doc.setFont('Archivo','normal'); doc.setDrawColor(160);
      D.items.forEach(function(l){
        var dl=doc.splitTextToSize(l.d,wD);
        doc.text(dl,L+4,y); doc.text(String(l.c),cC,y,{align:'right'}); doc.text(col(l.p),cP,y,{align:'right'}); doc.text(col(l.t),cT,y,{align:'right'});
        y+=lT*(dl.length-1); doc.line(L,y+lT*.38,R,y+lT*.38); y+=lT*1.2;
      });
      D.totales.forEach(function(f){
        var b=f[2]==='tot'; doc.setFont('Archivo',b?'bold':'normal');
        doc.text(f[0],cP,y,{align:'right'}); doc.text(f[1],cT,y,{align:'right'});
        if(b){ doc.setDrawColor(17); doc.line(cC-40,y+lT*.38,R,y+lT*.38) }
        y+=lT*1.15;
      });
      doc.setDrawColor(17); doc.setFont('Archivo','normal'); doc.setFontSize(fs);
      if(D.obs){ y+=ld*.2; var ob=doc.splitTextToSize(D.obs,W); doc.text(ob,L,y); y+=ld*ob.length; }
      y+=ld*.6; doc.text('Quedo atento a sus órdenes',L,y);
      y+=ld*1.6; doc.setFont('Archivo','bold'); doc.text('Nota:',L,y);
      y+=ld; doc.text(D.pago,L,y);
      doc.setFont('Archivo','normal'); doc.setFontSize(fs*.95);
      ['Grúas DIECA S.A cédula jurídica','3-101-712098','Cuenta 100-01-054-001419-4','Cuenta cliente 15105410010014191','Banco Nacional','IBAN:CR 39015105410010014191']
        .forEach(function(l,i){ y+=ld*(i?0.95:1.4); doc.text(l,L,y) });
      var fin=y;
      doc.setFontSize(11); doc.setLineHeightFactor(1.15);
      [['Atentamente',548],['Diego Quirós Olivares',572],['Cedula 3-03380923',596],['Gerente General',620]].forEach(function(f){ doc.text(f[0],306,f[1],{align:'center'}) });
      doc.setLineWidth(.8); doc.line(84,731,528,731); doc.setFontSize(10);
      doc.text('San Nicolas, Cartago',84,745); doc.text('dquiros811@gmail.com',306,745,{align:'center'}); doc.text('8854-4150',528,745,{align:'right'});
      return {doc:doc, fin:fin};
    }
    function pdf(){
      var D=datos(), malas=0;
      $('pf-cliente').setAttribute('aria-invalid',!D.cliente);
      D.todas.forEach(function(l){
        var vacia=!l.d && !l.p, okD=!!l.d||vacia, okP=l.p>0||vacia;
        l.el.querySelector('.d').setAttribute('aria-invalid',!okD); l.el.querySelector('.p').setAttribute('aria-invalid',!okP);
        if(!okD||!okP) malas++;
      });
      if(!D.cliente){ msg('Falta el nombre del cliente.',true); return }
      if(!D.items.length){ msg('Agregue al menos un servicio con descripción y precio.',true); return }
      if(malas){ msg('Hay servicios sin descripción o sin precio. Complételos o quítelos con la ✕.',true); return }
      if(!window.jspdf || !window.jspdf.jsPDF){ msg('No se pudo cargar el generador de PDF. Revise la conexión a internet y vuelva a intentar.',true); return }
      try{
        var r, ks=[1,.93,.86,.8,.74,.68];
        for(var i=0;i<ks.length;i++){ r=dibuja(window.jspdf.jsPDF,D,ks[i]); if(r.fin<=528) break; }
        var nombre=('Proforma '+D.cliente+' '+D.fecha.replace(/^[^,]*,\s*/,'')).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim().slice(0,90);
        r.doc.save(nombre+'.pdf');
        msg(r.fin<=528 ? 'Listo: la proforma se descargó en PDF.' : 'Se descargó, pero hay mucho texto: revise que no tape la firma y acorte descripciones u observaciones.', r.fin>528);
      }catch(e){ msg('No se pudo crear el PDF. Intente de nuevo.',true) }
    }
    carga();
    if(!$('pf-fecha').value) $('pf-fecha').value=hoyISO();
    pf.addEventListener('input',function(e){ if(e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); cambio() });
    pf.addEventListener('submit',function(e){ e.preventDefault() });
    $('pf-mas').addEventListener('click',function(){ agrega({d:'',c:'1',p:''},true); cambio() });
    $('pf-pdf').addEventListener('click',pdf);
    $('pf-limpiar').addEventListener('click',function(){
      DEL_CLIENTE.forEach(function(k){ $('pf-'+k).value='' }); $('pf-fecha').value=hoyISO();
      cambio(); $('pf-cliente').focus(); msg('',false) });
    botones(); vista();
  })();

