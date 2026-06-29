import type { ImageCompressProfile } from "@/lib/storage/storage-folders";

const HEIC_EXT = new Set(["heic", "heif"]);

function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function canCompressImageInBrowser(file: File): boolean {
  if (file.type === "image/gif") return false;
  const ext = fileExtension(file.name);
  if (HEIC_EXT.has(ext)) return false;
  return file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "bmp"].includes(ext);
}

function scaleDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Comprime en el navegador (Canvas → WebP) antes de subir a Supabase.
 * Permite aceptar archivos grandes (ej. 25 MB) y enviar versiones livianas.
 */
export async function compressImageInBrowser(
  file: File,
  profile: ImageCompressProfile
): Promise<File> {
  if (!canCompressImageInBrowser(file)) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = scaleDimensions(
    bitmap.width,
    bitmap.height,
    profile.maxWidth,
    profile.maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo preparar la compresión");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const quality = Math.min(1, Math.max(0.1, profile.quality / 100));

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (!blob) {
    throw new Error("No se pudo generar la imagen comprimida");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
