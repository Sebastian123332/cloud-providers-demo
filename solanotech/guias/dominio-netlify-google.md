# Guía Solanotech: dominio, Netlify y Google

Pasos para que la página de un cliente tenga su propio dominio (`www.nombre.com`) y aparezca en Google.
Ejemplo usado: **Grúas Hidalgo** (sitio en Netlify `bright-cassata-df850f.netlify.app`).

> Los precios son aproximados: revíselos el día de la compra.

---

## 1. Escoger y comprar el dominio

**Recomendado: `.com`.** Es el más barato, el que la gente recuerda y el que funciona bien con Netlify.
Ejemplos: `gruashidalgo.com`, `gruashidalgocr.com`.

| Dónde | Precio aprox. `.com` | Comentario |
|---|---|---|
| **Porkbun** (porkbun.com) | ~US$11/año, renovación similar | Barato, privacidad gratis, panel fácil. **El que más recomiendo.** |
| **Cloudflare Registrar** | ~US$10/año (precio de costo) | El más barato al renovar, pero obliga a usar el DNS de Cloudflare. |
| **Namecheap** | ~US$7–10 el primer año, renueva ~US$16 | Ofertas el primer año, renovación más cara. |
| **Netlify** (dentro del panel) | ~US$15–20/año | El más fácil (se conecta solo), pero más caro. |
| **NIC Costa Rica** (nic.cr) | `.cr` / `.co.cr`, bastante más caro | Solo si el cliente quiere `.cr` sí o sí. |

Consejos:
- Compre **a nombre del cliente** o con su correo, para que el dominio sea de él.
- Active la **renovación automática**: si el dominio vence, la página se cae.
- Diga que **no** a extras como correo, hosting o "SEO": Netlify ya hospeda gratis.

---

## 2. Conectar el dominio a Netlify

1. Netlify → entre al sitio → **Domain management** → **Add a domain** → escriba `gruashidalgo.com` → **Verify** → **Add domain**.
2. Escoja **una** de estas dos opciones:

**Opción A (la más fácil): Netlify DNS**
- Netlify le muestra **4 nameservers** (tipo `dns1.p0X.nsone.net`).
- En Porkbun o Namecheap: dominio → **Nameservers** → cámbielos por esos 4 → guarde.
- Tarda entre 1 y 24 horas.

**Opción B: dejar el DNS donde se compró**
- Registro **A**: Host `@` → `75.2.60.5` (balanceador de Netlify).
- Registro **CNAME**: Host `www` → `bright-cassata-df850f.netlify.app`.
- Borre otros registros A o CNAME de `@` y `www` que el registrador haya puesto por defecto.

3. Netlify → **Domain management** → **HTTPS** → **Verify DNS configuration**. El certificado SSL (el candadito) se pone solo y es gratis.
4. Deje `www.gruashidalgo.com` como **Primary domain**. Netlify redirige el otro solo.

### Después de conectar el dominio, avisarle a Claude para:
- Cambiar `DOM` en `clientes/_fuente/hidalgo/build.py` y volver a generar la página. Eso actualiza:
  - el canonical,
  - la vista previa de WhatsApp,
  - el sitemap,
  - el encabezado del PDF de proformas.
- Regenerar el **QR de la página web** con el dominio nuevo.
- Subir de nuevo el zip a Netlify.

---

## 3. Google Business Profile (lo MÁS importante para un negocio local)

Es lo que hace que salga en **Google Maps** y en "grúa cerca de mí".

1. Entre a **business.google.com** con la cuenta de Google del cliente → **Agregar negocio**.
2. Nombre: **Grúas Hidalgo**. Categoría principal: **Servicio de grúa**. Opcional: **Servicio de remolque de camiones**.
3. ¿Tiene local donde atiende clientes? → **No**. Así queda como **negocio de área de servicio**, sin dirección pública.
4. Áreas de servicio: las 7 provincias.
5. Teléfono `8838-1397`, sitio web con el dominio nuevo y horario **abierto 24 horas** todos los días.
6. **Verificación**: Google pide un video corto del negocio (la grúa, rotulación, herramientas) o una llamada o SMS. Siga lo que le pida.
7. Ya verificado:
   - Suba **10 o más fotos reales**.
   - Agregue los servicios: Underlift, Arrastre y rescate, Grúa telescópica, Traslado de pesados.
   - Escriba una descripción con "grúa para camiones pesados en Costa Rica".
8. **Reseñas**: en el perfil → **Pedir reseñas** → copie el enlace. Con ese enlace se hace el **QR de reseñas** para la grúa. Cada cliente feliz = una reseña: esto es lo que más sube en Maps.

---

## 4. Google Search Console (para que Google lea la página)

1. Entre a **search.google.com/search-console** → **Agregar propiedad**.
2. Escoja **Dominio** y escriba `gruashidalgo.com`. Google da un registro **TXT** (`google-site-verification=...`).
3. Agréguelo en el DNS:
   - Con Netlify DNS: **Domains** → el dominio → **Add new record** → TXT, host `@`.
   - Si no, en el panel de Porkbun o Namecheap.
4. Presione **Verificar**. Puede tardar unos minutos.
5. Menú **Sitemaps** → escriba `sitemap.xml` → **Enviar**. La página ya trae `sitemap.xml` y `robots.txt`.
6. Menú **Inspección de URLs** → pegue `https://www.gruashidalgo.com/` → **Solicitar indexación**.
7. En 3 a 14 días empieza a aparecer. En **Rendimiento** se ve con qué búsquedas lo encuentran.

**Bing Webmaster Tools** (bing.com/webmasters) → **Importar desde Search Console**: listo en 1 minuto, y así también sale en Bing y Copilot.

---

## 5. Lo que ya trae la página (no hay que hacer nada)

- Título y descripción optimizados ("Grúa para pesados 24/7 en Costa Rica").
- Datos estructurados para Google: negocio local, 24/7, las 7 provincias, teléfono y logo.
- Vista previa para WhatsApp y Facebook (`og.jpg`).
- `sitemap.xml`, `robots.txt`, canonical e ícono para iPhone.
- HTTPS y cabeceras de seguridad (`_headers`).
- Rápida y adaptada a celular.

## 6. Para subir más en Google (a lo largo del tiempo)

- Enlace de la página en **Facebook**, **Instagram** y en el **perfil de WhatsApp Business**.
- Mismo nombre, teléfono y sitio en todas partes (Google, Facebook, directorios).
- Pedir reseñas en Google después de cada servicio (QR en la grúa).
- Publicar fotos de trabajos en el perfil de Google 1 o 2 veces por semana.
