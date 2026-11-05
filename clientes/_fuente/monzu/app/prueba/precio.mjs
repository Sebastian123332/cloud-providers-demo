const B='http://localhost:8790/api/';
const f2=(()=>{const d=new Date(Date.now()+5*864e5); if(d.getDay()===0) d.setDate(d.getDate()+1); return d.toISOString().slice(0,10)})();
const t=await fetch(B+'reservar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nombre:'Tramposo Prueba',tel:'87500000',fecha:f2,hora:'08:00',lugar:'Cartago centro',consentimiento:true,paq:'deluxe',veh:'suv',extras:['motor','inventado','motor'],lineas:[['Detallado Deluxe',1]]})}).then(x=>x.json());
const s=(await fetch(B+'panel/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clave:'MonzuPrueba2026'})}).then(x=>x.json())).sesion;
const c=(await fetch(B+'panel/resumen',{headers:{authorization:'Bearer '+s}}).then(x=>x.json())).citas.find(c=>c.tel==='87500000');
console.log(JSON.stringify({reservo:t.ok,mandoElNavegador:'₡1',totalGuardado:c.total,lineas:c.lineas,vehiculo:c.vehiculo}));
