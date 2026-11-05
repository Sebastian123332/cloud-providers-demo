# Recordatorios automáticos por WhatsApp (sin tocar nada)

Cuando esto está listo, el servidor manda solo un WhatsApp a cada cliente que agendó:
- **24 horas antes** de la cita.
- **1 hora antes** de la cita.

El dueño no toca ningún botón. Se usa la API oficial de WhatsApp de Meta, así que el número no corre riesgo de bloqueo.

**Costo:**
- Meta cobra cada recordatorio. Es unos pocos colones por mensaje y se cobra a una tarjeta que el dueño registra en Meta.
- La tarifa exacta de Costa Rica está en la tabla oficial: https://developers.facebook.com/docs/whatsapp/pricing
- Si un cliente le escribió al número en las últimas 24 horas, ese recordatorio es gratis.

---

## Lo que necesita el dueño
- Un **chip nuevo**, prepago de Kölbi, Liberty o Claro, solo para la API. El número que se registra en la API **no puede estar usándose en la app de WhatsApp**.
- Una cuenta de Facebook y una tarjeta de crédito o débito.

## Paso 1. Crear la app en Meta
1. Entre a **developers.facebook.com** → **Mis apps** → **Crear app**.
2. Caso de uso: **"Conectar con clientes por WhatsApp"** → nombre `Monzu Recordatorios`.
3. Cuando pida una **cuenta comercial (Business)**, cree una a nombre de Monzú Detallados.

## Paso 2. Agregar el número
1. En la app: **WhatsApp → Configuración de la API** (API Setup) → **Agregar número de teléfono**.
2. Ponga el número del chip nuevo, el nombre visible `Monzú Detallados` y la categoría *Servicios automotrices*.
3. Verifíquelo con el código que llega por SMS.
4. **Copie el "Identificador del número de teléfono"** (Phone number ID). Es un número largo.

## Paso 3. Método de pago
**business.facebook.com → WhatsApp Manager → Configuración de pagos → Agregar método de pago.**

## Paso 4. Crear la plantilla del mensaje
1. Entre a **WhatsApp Manager → Plantillas de mensaje → Crear plantilla**.
2. Llene así:
   - **Categoría:** Utilidad.
   - **Nombre:** `recordatorio_cita`. Tiene que ser exactamente ese.
   - **Idioma:** Español.
3. En **Cuerpo**, copie tal cual:

   ```
   Hola {{1}}, le recordamos su cita con Monzú Detallados {{2}} a las {{3}} en {{4}}. Si no puede llegar, cancele o cambie la hora desde su tarjeta: {{5}} ¡Gracias!
   ```

4. Ejemplos que pide Meta: `Andrea` · `mañana` · `10:00 a. m.` · `Tres Ríos, casa 25` · `https://demomonzu.sebas43br.workers.dev/tarjeta.html`.
5. Envíela a revisión. Normalmente la aprueban en minutos o en pocas horas.

## Paso 5. Llave permanente (token)
1. Vaya a **business.facebook.com → Configuración del negocio → Usuarios → Usuarios del sistema → Agregar**.
2. Cree un usuario con rol **Administrador**.
3. **Asignar activos:** la app `Monzu Recordatorios` y la cuenta de WhatsApp, las dos con control total.
4. Toque **Generar token**:
   - App: `Monzu Recordatorios`.
   - Vencimiento: **Nunca**.
   - Permisos: `whatsapp_business_messaging` y `whatsapp_business_management`.
5. **Copie el token.** Solo se muestra una vez. No lo mande por chat: péguelo directo en Cloudflare, en el paso 6.

## Paso 6. Ponerlo en Cloudflare
1. **Cloudflare → demomonzu → Ajustes → Variables y secretos → Agregar.**
2. Agregue estas dos variables:

   | Nombre | Tipo | Valor |
   |---|---|---|
   | `WA_TOKEN` | **Secreto** | el token del paso 5 |
   | `WA_NUMERO_ID` | Texto | el identificador del paso 2 |

3. **Implementar.**

## Listo
- En el panel, en **Citas**, arriba dice **"Recordatorios automáticos por WhatsApp (no tiene que hacer nada)"**. Cada cita muestra *✓ WhatsApp* cuando se envió.
- Si un mensaje no se puede enviar, por ejemplo porque el número no tiene WhatsApp, esa cita sale con un botón **Recordar** para mandarlo a mano.
- **Mientras no esté configurado:**
  - les llega una notificación al celular a los clientes que activaron "🔔 Recordatorios" en su tarjeta;
  - a los demás, el panel les muestra el botón **Recordar**.
