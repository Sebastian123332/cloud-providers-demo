const B='http://localhost:8790/api/';
const post=(r,d,h={})=>fetch(B+r,{method:'POST',headers:{'content-type':'application/json',...h},body:JSON.stringify(d)}).then(x=>x.json());
const f=(()=>{const d=new Date(Date.now()+3*864e5); if(d.getDay()===0) d.setDate(d.getDate()+1); return d.toISOString().slice(0,10)})();
const r=await post('reservar',{nombre:'Ana Pérez',tel:'87200000',fecha:f,hora:'13:00',lugar:'Cartago <b>centro</b>',nota:'<img src=x onerror=alert(1)><script>alert(2)</script>',lineas:[['Detallado Premium',16000],['<svg onload=alert(3)>',1]],consentimiento:true,vehiculo:'Sedán'});
const s=(await post('panel/login',{clave:'MonzuPrueba2026'})).sesion;
const res=await fetch(B+'panel/resumen',{headers:{authorization:'Bearer '+s}}).then(x=>x.json());
const c=res.citas.find(x=>x.tel==='87200000');
console.log(JSON.stringify({reservo:r.ok,nota:c.nota,lugar:c.lugar,lineas:c.lineas,quedanSignos:/[<>]/.test(JSON.stringify(c))},null,1));
