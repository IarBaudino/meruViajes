import { getStorageBucket } from "@/lib/storage/storage-folders";

/**
 * Extrae el path del objeto en el bucket a partir de una URL pública de Supabase.
 * Devuelve null si la URL no pertenece a nuestro bucket / proyecto.
 */
export function storagePathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const bucket = getStorageBucket();
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;

    const path = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    return path || null;
  } catch {
    return null;
  }
}

export function uniqueStoragePathsFromUrls(urls: string[]): string[] {
  const paths = new Set<string>();
  for (const url of urls) {
    const path = storagePathFromPublicUrl(url);
    if (path) paths.add(path);
  }
  return [...paths];
}
