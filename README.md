# Plantilla web para agencias de viajes

Repo base para copiar en cada cliente: catálogo de excursiones y paquetes, reservas, área de usuario y panel de administración. No incluye la marca de ningún cliente; la identidad se carga por `.env` y `/admin/contenido`. Cada agencia es un despliegue propio (Firebase + Supabase + Vercel).

Para levantar una agencia nueva, seguí [docs/NUEVA-AGENCIA.md](docs/NUEVA-AGENCIA.md).

La identidad (nombre, ciudad, WhatsApp, SEO, colores) vive en `config/brand.ts` y se configura con variables `NEXT_PUBLIC_BRAND_*`. Los textos de marketing se editan en `/admin/contenido`.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (tokens `brand-*`)
- Firebase (Auth + Firestore)
- next-auth v4, **Supabase Storage**, Resend, Zustand, Framer Motion

## Requisitos

- Node.js 20+
- Cuenta Firebase (proyecto **nuevo por cliente**)
- Cuenta Resend (emails de consultas y reservas)
- Cuenta Supabase (Storage) — ver [docs/MEDIA-STORAGE.md](docs/MEDIA-STORAGE.md)

## Setup local

1. Clonar e instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env.local
```

3. Completar `.env.local`: identidad de la agencia, Firebase, Resend y `NEXTAUTH_SECRET` (generar con `openssl rand -base64 32`).

4. En Firebase Console:
   - Crear proyecto
   - Habilitar Authentication (Email/Password y Google)
   - Crear Firestore Database
   - Registrar app web y copiar config al `.env.local`
   - Generar clave de cuenta de servicio para Admin SDK
   - Desplegar reglas e índices (`firestore.rules`, `firestore.indexes.json`)

5. Ejecutar en desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run grant-admin -- email@ejemplo.com` | Asignar rol admin |
| `npm run seed:services` | *(Opcional)* Carga JSON de ejemplo — omitir en un cliente nuevo |
| `npm run recompress:storage` | Recomprimir imágenes en Supabase (batch) |
| `npm run recompress:videos` | Recomprimir vídeos con ffmpeg CLI |
| `npm run optimize:images` | Convertir imágenes de `public/` a AVIF |

## Estructura

```
config/           → Identidad de la agencia (brand.ts)
app/(public)/     → Home, excursiones, paquetes, checkout
app/(auth)/       → Login, registro
app/mi-cuenta/    → Área de usuario
app/admin/        → Panel admin
app/api/          → Route handlers
components/       → UI y layout
features/         → Lógica por dominio
lib/              → Firebase, Resend, storage, WhatsApp
schemas/          → Validación Zod
```

## Deploy (Vercel)

1. Conectar el repositorio (o un fork por cliente) en Vercel
2. Configurar todas las variables de `.env.example`
3. `FIREBASE_ADMIN_PRIVATE_KEY`: pegar con `\n` para saltos de línea
4. Desplegar reglas Firestore desde Firebase Console

Webhook Getnet (producción): `https://TU_DOMINIO/api/payments/getnet/webhook`
