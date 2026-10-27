  /* ===== Generador de proformas (herramienta interna) ===== */
  (function(){
    var pf=$('pf'); if(!pf) return;
    var F_REG='__F_REG__', F_BOLD='__F_BOLD__', F_TIT='__F_TIT__';
    var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
    var CAMPOS=['ciudad','fecha','cliente','cedula','actividad','tel','correo','dir','proyecto','servicio','monto','horas','extra','iva','pago','obs'];
    var DEL_CLIENTE=['cliente','cedula','actividad','tel','correo','dir','proyecto','obs'];
    var GUARDA='dieca-proforma';
    function hoyISO(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') }
    function v(k){ return String($('pf-'+k).value||'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim() }
    function num(k){ return parseInt(String($('pf-'+k).value).replace(/[^\d]/g,''),10)||0 }
    function col(n){ return '₡'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.') }
    function cedula(c){ var d=c.replace(/\D/g,''); if(d.length===10) return d[0]+'-'+d.slice(1,4)+'-'+d.slice(4); if(d.length===9) return d[0]+'-'+d.slice(1,5)+'-'+d.slice(5); return c }
    function fechaTxt(){
      var f=$('pf-fecha').value, d=/^\d{4}-\d{2}-\d{2}$/.test(f) ? new Date(f+'T12:00:00') : new Date();
      return (v('ciudad')||'Cartago')+', '+d.getDate()+' de '+MESES[d.getMonth()]+' del '+d.getFullYear();
    }
    function datos(){
      var iva=num('iva'), m=num('monto'), h=num('horas'), x=num('extra'), mas=iva>0?' más IVA':'';
      var lineas=[];
      if(v('cedula')) lineas.push('Cédula jurídica: '+cedula(v('cedula')));
      if(v('tel')) lineas.push('Teléfono: '+v('tel'));
      if(v('correo')) lineas.push('Correo: '+v('correo'));
      if(v('dir')) lineas.push(v('dir'));
      if(v('actividad')) lineas.push('Actividad económica '+v('actividad'));
      var pr=v('proyecto') ? ' del proyecto '+v('proyecto')+':' : ' del proyecto:';
      var filas=[[v('servicio')+' ('+h+' horas)',col(m)]];
      if(iva>0) filas.push(['IVA ('+iva+'%)',col(m*iva/100)]);
      filas.push(['Total mensual',col(m*(1+iva/100)),'tot']);
      if(x>0) filas.push(['Hora adicional ('+col(x)+(iva>0?' + IVA '+col(x*iva/100):'')+')',col(x*(1+iva/100))]);
      return {
        fecha:fechaTxt(), cliente:v('cliente'), lineas:lineas,
        saludo:'Estimados señores, por este medio adjunto la cotización solicitada'+pr,
        servicio:v('servicio')+' '+h+' horas '+col(m)+mas+(x>0?' y '+col(x)+mas+' la hora adicional después de las '+h+' del mes.':'.'),
        filas:filas, obs:String($('pf-obs').value||'').replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g,' ').trim(), pago:v('pago')||'Sistema de pago de contado',
        monto:m
      };
    }
    function vista(){
      var D=datos();
      $('hv-fecha').textContent=D.fecha; $('hv-cliente').textContent=D.cliente||'Nombre del cliente';
      $('hv-datos').textContent=D.lineas.join('\n'); $('hv-saludo').textContent=D.saludo; $('hv-servicio').textContent=D.servicio;
      $('hv-obs').textContent=D.obs; $('hv-pago').textContent=D.pago;
      var t=$('hv-tabla'); t.textContent='';
      D.filas.forEach(function(f){ var tr=document.createElement('tr'); if(f[2]) tr.className=f[2];
        var a=document.createElement('td'); a.textContent=f[0]; var b=document.createElement('td'); b.textContent=f[1];
        tr.appendChild(a); tr.appendChild(b); t.appendChild(tr) });
    }
    function guarda(){ try{ var o={}; CAMPOS.forEach(function(k){ o[k]=$('pf-'+k).value }); localStorage.setItem(GUARDA,JSON.stringify(o)) }catch(e){} }
    function carga(){ try{ var o=JSON.parse(localStorage.getItem(GUARDA)||'null'); if(o) CAMPOS.forEach(function(k){ if(typeof o[k]==='string') $('pf-'+k).value=o[k] }) }catch(e){} }
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
      D.lineas.forEach(function(l){ y+=ld*.92; doc.text(doc.splitTextToSize(l,W)[0],L,y) });
      doc.setFontSize(fs); y+=ld*1.9;
      var s=doc.splitTextToSize(D.saludo,W); doc.text(s,L,y); y+=ld*s.length+ld*.2;
      var sv=doc.splitTextToSize(D.servicio,W); doc.text(D.servicio,L,y,{maxWidth:W,align:'justify'}); y+=ld*sv.length+ld*.3;
      doc.setFontSize(fs*.95); doc.setLineWidth(.5);
      D.filas.forEach(function(f){
        doc.setFont('Archivo',f[2]?'bold':'normal'); doc.setDrawColor(f[2]?17:150);
        doc.text(f[0],L+6,y); doc.text(f[1],R-6,y,{align:'right'}); doc.line(L,y+ld*.38,R,y+ld*.38); y+=ld*1.2;
      });
      doc.setDrawColor(17); doc.setFont('Archivo','normal'); doc.setFontSize(fs);
      if(D.obs){ y+=ld*.3; var ob=doc.splitTextToSize(D.obs,W); doc.text(ob,L,y); y+=ld*ob.length; }
      y+=ld*.7; doc.text('Quedo atento a sus órdenes',L,y);
      y+=ld*1.7; doc.setFont('Archivo','bold'); doc.text('Nota:',L,y);
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
      var D=datos();
      $('pf-cliente').setAttribute('aria-invalid',!D.cliente); $('pf-monto').setAttribute('aria-invalid',!(D.monto>0));
      if(!D.cliente || !(D.monto>0)){ msg('Falta el nombre del cliente o el monto mensual.',true); return }
      if(!window.jspdf || !window.jspdf.jsPDF){ msg('No se pudo cargar el generador de PDF. Revise la conexión a internet y vuelva a intentar.',true); return }
      try{
        var r, ks=[1,.93,.86,.8];
        for(var i=0;i<ks.length;i++){ r=dibuja(window.jspdf.jsPDF,D,ks[i]); if(r.fin<=528) break; }
        var nombre=('Proforma '+D.cliente+' '+D.fecha.replace(/^[^,]*,\s*/,'')).replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim().slice(0,90);
        r.doc.save(nombre+'.pdf');
        msg(r.fin<=528 ? 'Listo: la proforma se descargó en PDF.' : 'Se descargó, pero el texto es muy largo: revise que no tape la firma y acorte las observaciones.', r.fin>528);
      }catch(e){ msg('No se pudo crear el PDF. Intente de nuevo.',true) }
    }
    carga();
    if(!$('pf-fecha').value) $('pf-fecha').value=hoyISO();
    pf.addEventListener('input',function(e){ if(e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); vista(); guarda() });
    pf.addEventListener('submit',function(e){ e.preventDefault() });
    $('pf-pdf').addEventListener('click',pdf);
    $('pf-limpiar').addEventListener('click',function(){ DEL_CLIENTE.forEach(function(k){ $('pf-'+k).value='' }); $('pf-fecha').value=hoyISO(); vista(); guarda(); $('pf-cliente').focus(); msg('',false) });
    vista();
  })();

