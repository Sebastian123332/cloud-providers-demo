# Correo profesional gratis: hola@ssolanotech.com

Los correos que lleguen a **hola@ssolanotech.com** caen en su Gmail, y desde Gmail usted responde **como** hola@ssolanotech.com. No paga nada.

Son 3 partes:
1. **Recibir:** reenvío gratis del dominio a su Gmail.
2. **Enviar:** "Enviar como" en Gmail.
3. **Ajuste anti-spam:** el registro SPF.

---

## Paso 0. ¿Dónde está el DNS de ssolanotech.com?

Entre a **https://www.whatsmydns.net/#NS/ssolanotech.com** y vea los "nameservers":

| Si dicen… | Use |
|---|---|
| `…ns.cloudflare.com` | **Opción A: Cloudflare.** Es la mejor. |
| `…nsone.net` (Netlify) u otro | **Opción B: ImprovMX.** También es gratis. |

---

## 1A. Recibir con Cloudflare Email Routing

1. **dash.cloudflare.com** → escoja `ssolanotech.com` → menú **Email** → **Email Routing** → **Get started**.
2. **Custom address:** escriba `hola`.
   - **Action:** *Send to an email*.
   - **Destination:** su Gmail.
   - Toque **Create and continue**.
3. Le llega un correo de Cloudflare a su Gmail. Toque **Verify email address**.
4. Vuelva a Cloudflare y toque **Add records and enable**. Cloudflare crea solo los registros MX y TXT.
5. **Pruebe:** desde otro correo, por ejemplo el de un amigo, mándele algo a hola@ssolanotech.com. Debe llegarle a su Gmail en segundos.

> Extra: en **Routing rules → Catch-all** puede activar *Send to an email* para que **cualquier cosa**@ssolanotech.com le llegue también (ventas@, soporte@…).

## 1B. Recibir con ImprovMX (si el DNS NO está en Cloudflare)

1. Entre a **improvmx.com**.
   - Escriba `ssolanotech.com` y su Gmail.
   - Cree la cuenta gratis.
2. En el panel donde está su DNS (Netlify → *Domains* → `ssolanotech.com` → *DNS records*, o donde compró el dominio), agregue:

   | Tipo | Nombre | Valor | Prioridad |
   |---|---|---|---|
   | MX | `@` | `mx1.improvmx.com` | 10 |
   | MX | `@` | `mx2.improvmx.com` | 20 |
   | TXT | `@` | `v=spf1 include:spf.improvmx.com ~all` | — |

3. En ImprovMX cree el alias `hola` → su Gmail.
4. Espere a que ImprovMX diga **"Email forwarding is active"**. Puede tardar de minutos a unas horas.

---

## 2. Enviar como hola@ssolanotech.com desde Gmail

**Antes:** Gmail pide una **contraseña de aplicación**.
1. Active la **Verificación en 2 pasos** en **myaccount.google.com → Seguridad**.
2. Entre a **myaccount.google.com/apppasswords**.
3. Póngale de nombre `Solanotech` y toque **Crear**.
4. **Copie las 16 letras.** No las comparta con nadie.

**Luego, en Gmail desde la compu:**
1. ⚙️ → **Ver toda la configuración** → pestaña **Cuentas e importación**.
2. En **Enviar como**, toque **Agregar otra dirección de correo**.
   - **Nombre:** `Solanotech`.
   - **Correo:** `hola@ssolanotech.com`.
   - Deje marcado *Tratar como alias*.
   - Toque **Siguiente**.
3. Llene los datos del servidor:
   - **Servidor SMTP:** `smtp.gmail.com`
   - **Puerto:** `587`
   - **Usuario:** su Gmail completo
   - **Contraseña:** las 16 letras del paso anterior
   - Deje marcado **TLS**.
   - Toque **Agregar cuenta**.
4. Gmail manda un código a hola@ssolanotech.com. Como ya se reenvía, le llega a su mismo Gmail. Ábralo y confirme.
5. En **Enviar como**:
   - toque **Establecer como predeterminado** al lado de hola@ssolanotech.com;
   - marque **"Responder desde la misma dirección a la que se envió el mensaje"**.

En el celular, la app de Gmail también le deja escoger el remitente: en **De:**, toque y elija hola@ssolanotech.com.

---

## 3. Que sus correos no caigan en spam (SPF)

Solo puede haber **un** registro TXT que empiece con `v=spf1`. Edite el que ya existe para que **también** incluya a Google:

- **Con Cloudflare:**
  `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all`
- **Con ImprovMX:**
  `v=spf1 include:spf.improvmx.com include:_spf.google.com ~all`

**Prueba final:** mándese un correo a un Hotmail o Outlook y revise que llegue a la bandeja de entrada y no a spam.

---

## Cuando ya funcione

Avísele a Claude para cambiar sebas43br@gmail.com por **hola@ssolanotech.com** en:
- la página: pie de página, datos para Google, privacidad y términos;
- el CV;
- LinkedIn;
- el perfil de Google Business.
