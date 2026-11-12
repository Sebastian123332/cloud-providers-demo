/* Fashionista Sneakers — capa de datos compartida por la tienda (index.html) y el panel (admin.html).
   En esta demo el inventario vive en el navegador (localStorage).
   En la versión final estas mismas funciones leen y escriben en Supabase (ver supabase/schema.sql). */
(function(){
  const KEY = "fs_inv_v1";

  const TAXO = {
    generos:   ["Hombre","Mujer","Niños","Unisex"],
    categorias:["Calzado","Ropa","Accesorios"],
    deportes:  ["Basketball","Running","Lifestyle","Fútbol","Training","Skate"],
    colores:   ["Negro","Blanco","Gris","Rojo","Azul","Verde","Morado","Café","Rosado"],
    tallas: {
      "Calzado:Hombre": ["7","7.5","8","8.5","9","9.5","10","10.5","11","12"],
      "Calzado:Mujer":  ["5","5.5","6","6.5","7","7.5","8","8.5","9"],
      "Calzado:Unisex": ["6","7","8","9","10","11"],
      "Calzado:Niños":  ["11C","12C","13C","1Y","2Y","3Y","4Y","5Y","6Y"],
      "Ropa:Niños":     ["4","6","8","10","12","14"],
      "Ropa":           ["XS","S","M","L","XL","XXL"],
      "Accesorios":     ["Única"]
    }
  };
  const COLOR_HEX = {Negro:"#151515",Blanco:"#f2f2f2",Gris:"#8a8d94",Rojo:"#c8192e",Azul:"#1d3f8f",Verde:"#1f6b3a",Morado:"#7a2bb5",Café:"#7b4a2c",Rosado:"#e58fb0"};

  function tallasPara(cat, gen){
    return TAXO.tallas[cat+":"+gen] || TAXO.tallas[cat] || ["Única"];
  }

  /* ---------- datos de ejemplo (deterministas) ---------- */
  function seed(){
    let r = 7;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    const pick = a => a[Math.floor(rnd()*a.length)];
    const shoes = [
      ["Nike","Air Force 1 '07","Lifestyle",72000],["Nike","Dunk Low Retro","Lifestyle",82000],["Nike","Pegasus 41","Running",89000],
      ["Nike","LeBron Witness 8","Basketball",76000],["Nike","Court Shot","Lifestyle",44900],["Nike","Mercurial Vapor 16 Club","Fútbol",52000],
      ["Jordan","Air Jordan 1 Mid","Basketball",98000],["Jordan","Jordan Max Aura 6","Basketball",79000],["Jordan","Air Jordan 4 Retro","Lifestyle",145000],
      ["Adidas","Samba OG","Lifestyle",79000],["Adidas","Ultraboost 5","Running",115000],["Adidas","Dame 9","Basketball",84000],
      ["Adidas","Copa Pure 2 League","Fútbol",48000],["Adidas","Campus 00s","Lifestyle",72000],
      ["Puma","Suede Classic","Lifestyle",49000],["Puma","Velocity Nitro 3","Running",78000],["Puma","MB.03","Basketball",92000],
      ["New Balance","550","Lifestyle",85000],["New Balance","Fresh Foam 880","Running",88000],
      ["Under Armour","HOVR Phantom 3","Running",69000],["Under Armour","Curry 11","Basketball",105000],
      ["Vans","Old Skool","Skate",48000],["Vans","Sk8-Hi","Skate",52000],
      ["Fila","Emil","Running",20950],["Reebok","Nano X4","Training",74000],["Nike","Metcon 9","Training",82000]
    ];
    const clothes = [
      ["Nike","Hoodie Club Fleece","hoodie",38000],["Nike","Camiseta Dri-FIT","tee",19000],["Jordan","Camiseta Jumpman","tee",22000],
      ["Adidas","Jacket Firebird","hoodie",45000],["Adidas","Camiseta Trefoil","tee",18000],["Puma","Hoodie Essentials","hoodie",32000],
      ["Under Armour","Camiseta Tech 2.0","tee",16000],["Nike","Short Challenger","tee",21000]
    ];
    const acc = [["New Era","Gorra 9FIFTY","cap",24000],["Nike","Gorra Club","cap",18000],["Jordan","Gorra Jumpman","cap",21000]];
    const out = []; let n = 1;
    const mk = (cat, gen, brand, name, dep, price, kind) => {
      const color = pick(TAXO.colores), color2 = pick(TAXO.colores.filter(c=>c!==color));
      const stock = {};
      tallasPara(cat, gen).forEach(t => { const x = rnd(); stock[t] = x < .22 ? 0 : x < .4 ? 1 : Math.floor(rnd()*8)+1; });
      const sale = rnd() < .2;
      const p = Math.round(price * (gen==="Niños" ? .62 : 1) / 100) * 100;
      out.push({
        id: "FS-" + String(n++).padStart(4,"0"), cat, gen, brand, name, dep: dep || "", color, color2, kind,
        price: p, oferta: sale ? Math.round(p * .8 / 100) * 100 : null,
        stock, foto: null, activo: true, nuevo: rnd() < .15
      });
    };
    shoes.forEach(([b,nm,d,pr]) => {
      mk("Calzado","Hombre",b,nm,d,pr,"shoe");
      if (rnd() < .55) mk("Calzado","Mujer",b,nm,d,Math.round(pr*.95),"shoe");
      if (rnd() < .3)  mk("Calzado","Niños",b,nm,d,pr,"shoe");
    });
    clothes.forEach(([b,nm,k,pr]) => {
      mk("Ropa","Hombre",b,nm,"Lifestyle",pr,k);
      if (rnd() < .5) mk("Ropa","Mujer",b,nm,"Lifestyle",pr,k);
      if (rnd() < .3) mk("Ropa","Niños",b,nm,"Lifestyle",pr,k);
    });
    acc.forEach(([b,nm,k,pr]) => mk("Accesorios","Unisex",b,nm,"Lifestyle",pr,k));
    return {version:1, productos: out, deportes: TAXO.deportes.slice(), pedidos: []};
  }

  /* ---------- almacenamiento ---------- */
  function load(){
    try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && Array.isArray(d.productos)) { d.pedidos = d.pedidos || []; return d; } } catch(e){}
    return seed();
  }
  function save(db){
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch(e){ return false; }
  }
  function reset(){ try{ localStorage.removeItem(KEY); }catch(e){} return seed(); }

  /* ---------- utilidades ---------- */
  /* Orden natural de tallas: 11C…13C, 1Y…6Y, 5…12.5, XS…XXL */
  const sizeKey = s => { const n=parseFloat(s); if(/C$/i.test(s)) return n; if(/Y$/i.test(s)) return 20+n; if(!isNaN(n)) return 40+n; const i=["XS","S","M","L","XL","XXL","Única"].indexOf(s); return 100+(i<0?50:i); };
  const sizes = p => Object.keys(p.stock).sort((a,b)=>sizeKey(a)-sizeKey(b));
  const total = p => Object.values(p.stock).reduce((a,b)=>a+(+b||0),0);
  const precio = p => p.oferta && p.oferta < p.price ? p.oferta : p.price;
  const crc = n => "₡" + Math.round(n).toLocaleString("es-CR").replace(/[.,  ]/g," ").replace(/ /g," ");

  /* Ilustración del producto cuando todavía no tiene foto */
  function art(p){
    const a = COLOR_HEX[p.color] || "#999", b = COLOR_HEX[p.color2] || "#ddd";
    if (p.kind === "shoe") return `<svg viewBox="0 0 200 120" aria-hidden="true"><ellipse cx="100" cy="104" rx="84" ry="7" fill="#000" opacity=".35"/><path d="M18 78c0-18 6-36 16-48 9 0 18 6 27 12 12 7 22 10 34 10 18 0 30 9 48 17 17 7 40 6 45 15 3 6 0 13-6 16H32c-8 0-14-8-14-22z" fill="${a}"/><path d="M18 88h172c0 5-2 8-6 10H32c-8 0-14-4-14-10z" fill="${b}"/><path d="M70 58c20 6 48 6 70 0-6 10-28 18-52 16" fill="none" stroke="${b}" stroke-width="7" stroke-linecap="round"/><path d="M60 42l8 10M72 46l7 10M84 48l6 10" stroke="${b}" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>`;
    if (p.kind === "hoodie") return `<svg viewBox="0 0 200 160" aria-hidden="true"><path d="M70 20c8-8 52-8 60 0l40 22 14 56-24 6-8-30v74H48V74l-8 30-24-6 14-56z" fill="${a}"/><path d="M78 22c4 22 40 22 44 0" fill="none" stroke="${b}" stroke-width="5"/><path d="M92 40v26M108 40v26" stroke="${b}" stroke-width="3" stroke-linecap="round"/><rect x="70" y="104" width="60" height="22" rx="6" fill="none" stroke="${b}" stroke-width="3" opacity=".7"/></svg>`;
    if (p.kind === "cap") return `<svg viewBox="0 0 200 140" aria-hidden="true"><path d="M40 92c0-40 26-62 60-62s60 22 60 62z" fill="${a}"/><path d="M40 92h120c22 0 34 6 34 12-30 6-90 6-154-2z" fill="${a}" opacity=".85"/><rect x="84" y="56" width="32" height="18" rx="4" fill="${b}"/><circle cx="100" cy="30" r="4" fill="${b}"/></svg>`;
    return `<svg viewBox="0 0 200 160" aria-hidden="true"><path d="M72 18 30 40l14 34 18-8v80h76V66l18 8 14-34-42-22c-6 10-16 16-28 16s-22-6-28-16z" fill="${a}"/><path d="M72 18c6 10 16 16 28 16s22-6 28-16" fill="none" stroke="${b}" stroke-width="4"/><circle cx="100" cy="84" r="14" fill="${b}" opacity=".85"/></svg>`;
  }
  const visual = p => p.foto ? `<img src="${p.foto}" alt="${p.brand} ${p.name}" loading="lazy">` : art(p);


  /* Logos de tarjetas aceptadas (reemplazar por los oficiales que entregue el banco o la pasarela) */
  let lid = 0;
  function cardLogos(withSinpe){
    const k = ++lid;
    const visa = `<svg class="cardlogo" viewBox="0 0 60 38" role="img" aria-label="Visa"><rect width="60" height="38" rx="5" fill="#fff"/><text x="30" y="26.5" text-anchor="middle" font-family="Arial Black,Arial,Helvetica,sans-serif" font-weight="900" font-style="italic" font-size="17" fill="#1a1f71" letter-spacing="-.5">VISA</text></svg>`;
    const mc = `<svg class="cardlogo" viewBox="0 0 60 38" role="img" aria-label="Mastercard"><defs><clipPath id="mcc${k}"><circle cx="24.5" cy="19" r="11"/></clipPath></defs><rect width="60" height="38" rx="5" fill="#fff"/><circle cx="24.5" cy="19" r="11" fill="#eb001b"/><circle cx="35.5" cy="19" r="11" fill="#f79e1b"/><circle cx="35.5" cy="19" r="11" fill="#ff5f00" clip-path="url(#mcc${k})"/></svg>`;
    const amex = `<svg class="cardlogo" viewBox="0 0 60 38" role="img" aria-label="American Express"><rect width="60" height="38" rx="5" fill="#1f72cd"/><text x="30" y="17.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="8.4" fill="#fff" letter-spacing=".3">AMERICAN</text><text x="30" y="27.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="8.4" fill="#fff" letter-spacing=".3">EXPRESS</text></svg>`;
    const sinpe = withSinpe ? `<span class="cardmark">SINPE Móvil</span>` : "";
    return `<span class="cards">${visa}${mc}${amex}${sinpe}</span>`;
  }
  window.FS = { KEY, cardLogos, sizeKey, sizes, TAXO, COLOR_HEX, tallasPara, load, save, reset, total, precio, crc, art, visual };
})();
