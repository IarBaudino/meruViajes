# Nueva agencia a partir de esta base

Copiá este repo por cada cliente. Es una plantilla (catálogo, reservas, admin) sin marca propia. Cada agencia es un **despliegue separado** (Firebase + Supabase + Vercel), no un multi-tenant.

## Checklist

1. **Clonar o copiar el repo** en un proyecto nuevo (o un branch/deploy distinto).
2. **Reemplazar `public/logo.png`** por el logo del cliente (PNG, fondo transparente si se puede).
3. **Copiar variables de entorno**

   ```bash
   cp .env.example .env.local
   ```

   Completar al menos:

   - Identidad: `NEXT_PUBLIC_BRAND_*`, WhatsApp, Instagram, ciudad
   - `NEXT_PUBLIC_APP_URL`
   - Firebase, Supabase, Resend, `NEXTAUTH_SECRET`
4. **Paleta** (opcional): `NEXT_PUBLIC_THEME_PRIMARY` y el resto. Se inyectan como CSS variables `brand-*`.
5. **Infra por cliente** (proyecto **nuevo**, nunca el de Meru ni el de otro cliente)
   - Proyecto Firebase nuevo (Auth email/password + Google, Firestore)
   - Desplegar `firestore.rules` y `firestore.indexes.json`
   - Bucket Supabase (`NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`)
   - Dominio verificado en Resend
   - Dominio autorizado en Firebase Auth

   Las excursiones, paquetes y textos viven en Firestore. Si copiás el `.env` de otro cliente, vas a ver (y podés pisar) su catálogo real.
6. **Primer admin**

   ```bash
   npm run grant-admin -- email@cliente.com
   ```

7. **Contenido** en `/admin/contenido`: hero, sobre nosotros, footer, Instagram, reseñas Google.
8. **Catálogo** en `/admin/excursiones` y `/admin/paquetes`. El seed de `scripts/data` es solo un ejemplo; no lo uses en un cliente real.
9. **Deploy en Vercel** con las mismas variables. Webhook Getnet: `https://DOMINIO/api/payments/getnet/webhook`

## Qué se edita en código vs admin

| En código / env | En `/admin/contenido` |
|---|---|
| Nombre, ciudad, WhatsApp, SEO, colores | Textos del home y footer |
| Logo (`public/logo.png`) | Fotos/videos del hero |
| Fuentes (`app/layout.tsx`) | Instagram (también se puede por env) |
| Firebase / Supabase / Resend | Place ID de Google Reviews |

## Qué no copiar de un cliente a otro

- `.env.local` y variables de Vercel
- Datos de Firestore (excursiones, órdenes, usuarios)
- Bucket de medios
- `public/logo.png`

## Defaults

`config/brand.ts` usa placeholders genéricos. Cada cliente tiene que definir las `NEXT_PUBLIC_BRAND_*` (y el resto del `.env`) antes de publicar.
