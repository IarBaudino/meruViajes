# Meru Viajes y Turismo

Aplicación web para **Meru Turismo** (Ushuaia, Tierra del Fuego): catálogo de excursiones, reservas, panel de usuario y administración.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Firebase (Auth + Firestore)
- next-auth v4, **Supabase Storage** (medios), Resend, Zustand, Framer Motion

## Requisitos

- Node.js 20+
- Cuenta Firebase (proyecto nuevo)
- Cuenta Resend (emails de consultas)
- Cuenta Supabase (Storage para imágenes y vídeos) — ver [docs/MEDIA-STORAGE.md](docs/MEDIA-STORAGE.md)

## Setup local

1. Clonar e instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env.local
```

3. Completar `.env.local` con credenciales de Firebase, Resend y `NEXTAUTH_SECRET` (generar con `openssl rand -base64 32`).

4. En Firebase Console:
   - Crear proyecto
   - Habilitar Authentication (Email/Password y Google)
   - Crear Firestore Database
   - Registrar app web y copiar config al `.env.local`
   - Generar clave de cuenta de servicio para Admin SDK
   - Desplegar reglas: `firestore.rules`

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
| `npm run seed:services` | *(Opcional)* Carga JSON de ejemplo — omitir si creás excursiones vos |
| `npm run recompress:storage` | Recomprimir imágenes en Supabase (batch) |
| `npm run recompress:videos` | Recomprimir vídeos con ffmpeg CLI |
| `npm run optimize:images` | Convertir imágenes de `public/` a AVIF |

## Estructura

```
app/(public)/     → Home, excursiones
app/(auth)/       → Login, registro
app/mi-cuenta/    → Área de usuario (Fase 4–5)
app/admin/        → Panel admin (Fase 6)
app/api/          → Route handlers
components/       → UI y layout
features/         → Lógica por dominio
lib/              → Firebase, Resend, Cloudinary
schemas/          → Validación Zod
```

## Fases del proyecto

- **Fase 1–2** ✅ Scaffold + Home con formulario de consultas
- **Fase 3** ✅ Catálogo Firestore + seed + descuentos en modelo
- **Fase 4** Auth Firebase + next-auth + perfil
- **Fase 5** Carrito, reservas, emails confirmación
- **Fase 6** Admin CRUD + Cloudinary
- **Fase 7** SEO, deploy, pulido

## Deploy (Vercel)

1. Conectar repositorio en Vercel
2. Configurar todas las variables de `.env.example`
3. `FIREBASE_ADMIN_PRIVATE_KEY`: pegar con `\n` para saltos de línea
4. Desplegar reglas Firestore desde Firebase Console
