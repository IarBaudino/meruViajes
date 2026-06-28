/**
 * Carpetas permitidas en Supabase Storage (bucket meru-media).
 * `excursions` usa el perfil de compresión de `products`.
 */
export const STORAGE_FOLDERS = [
  "categories",
  "content",
  "excursions",
  "team",
  "blog",
] as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[number];

export function isStorageFolder(value: string): value is StorageFolder {
  return (STORAGE_FOLDERS as readonly string[]).includes(value);
}

export type ImageCompressProfile = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

/** Perfiles de referencia — excursions → products */
export const IMAGE_COMPRESS_PROFILES: Record<
  "categories" | "content" | "products" | "team" | "blog",
  ImageCompressProfile
> = {
  categories: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  content: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  products: { maxWidth: 1400, maxHeight: 1800, quality: 84 },
  team: { maxWidth: 800, maxHeight: 800, quality: 85 },
  blog: { maxWidth: 1200, maxHeight: 800, quality: 82 },
};

export function resolveImageProfile(folder: StorageFolder): ImageCompressProfile {
  if (folder === "excursions") return IMAGE_COMPRESS_PROFILES.products;
  return IMAGE_COMPRESS_PROFILES[folder];
}

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export const MAX_IMAGE_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_IMAGE_CLIENT_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 30 * 1024 * 1024;

export const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "m4v",
  "hevc",
  "webm",
  "avi",
  "wmv",
  "3gp",
  "mkv",
]);

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? VIDEO_EXTENSIONS.has(ext) : false;
}

export function getStorageBucket(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "meru-media";
}

export function getPublicStorageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = getStorageBucket();
  if (!base) return path;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
