# Medios en Supabase Storage

Compresión **antes** de subir para ahorrar espacio y egress.

## Estrategia

| Tipo | Dónde se comprime | Ruta de subida |
|------|-------------------|----------------|
| Imagen | Servidor (Sharp) | `POST /api/upload-image` |
| Vídeo | Cliente (FFmpeg.wasm) | URL firmada `POST /api/storage/signed-upload` |

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=meru-media
ADMIN_UPLOAD_SECRET=          # dev / scripts (header x-admin-upload-key)
NEXT_PUBLIC_ADMIN_UPLOAD_KEY= # solo local; opcional espejo del secret
```

## Carpetas permitidas

`categories`, `content`, `excursions` (perfil products), `team`, `blog`

## Uso en admin

```tsx
import { uploadAdminMedia } from "@/lib/admin-media-upload";

const result = await uploadAdminMedia(file, "excursions", (p) => {
  console.log(p.phase, p.progress, p.message);
});
```

UI de prueba: `/admin` → componente **AdminMediaUploader**.

## Scripts batch (mismo path → URLs no cambian)

```bash
npm run recompress:storage -- --dry-run
npm run recompress:storage -- --folder=excursions --min-kb=150 --min-savings=0.15

npm run recompress:videos -- --dry-run
npm run recompress:videos -- --min-mb=1 --min-savings=0.2 --ffmpeg=ffmpeg
```

## Supabase Console

1. Crear bucket `meru-media` (público para URLs de excursiones, o RLS según necesidad).
2. Políticas: lectura pública si las URLs van en el sitio; escritura solo service role / signed upload.

## Límites

- Imagen API: 12 MB entrada; cliente recomienda 5 MB.
- Vídeo post-compresión: máx. 30 MB.
- GIF animado: passthrough sin comprimir.
