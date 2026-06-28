"use client";

import type { StorageFolder } from "@/lib/storage/storage-folders";
import {
  MAX_IMAGE_CLIENT_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  isVideoFile,
} from "@/lib/storage/storage-folders";
import { compressVideoForWeb, type VideoCompressProgress } from "@/lib/storage/compress-video-client";
import { getSupabaseBrowser, getBrowserStorageBucket } from "@/lib/storage/supabase-browser";

export type UploadProgress = {
  phase: "compressing" | "uploading";
  progress: number;
  message: string;
};

export type AdminMediaUploadResult = {
  success: boolean;
  publicId?: string;
  url?: string;
  width?: number;
  height?: number;
  resourceType: "image" | "video";
  optimized?: boolean;
  error?: string;
};

function getAdminUploadHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  const key = process.env.NEXT_PUBLIC_ADMIN_UPLOAD_KEY;
  if (key) headers["x-admin-upload-key"] = key;
  return headers;
}

async function uploadImageViaApi(
  file: File,
  folder: StorageFolder,
  onProgress?: (p: UploadProgress) => void
): Promise<AdminMediaUploadResult> {
  if (file.size > MAX_IMAGE_CLIENT_BYTES) {
    return {
      success: false,
      resourceType: "image",
      error: `La imagen supera ${MAX_IMAGE_CLIENT_BYTES / (1024 * 1024)} MB en cliente. Elegí un archivo más liviano.`,
    };
  }

  onProgress?.({ phase: "uploading", progress: 10, message: "Comprimiendo y subiendo imagen…" });

  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);

  const res = await fetch("/api/upload-image", {
    method: "POST",
    headers: getAdminUploadHeaders(),
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    return { success: false, resourceType: "image", error: json.error ?? "Error al subir imagen" };
  }

  onProgress?.({ phase: "uploading", progress: 100, message: "Imagen subida" });

  return {
    success: true,
    publicId: json.publicId,
    url: json.url,
    width: json.width,
    height: json.height,
    resourceType: "image",
    optimized: json.optimized,
  };
}

async function uploadVideoViaSignedUrl(
  file: File,
  folder: StorageFolder,
  onProgress?: (p: UploadProgress) => void
): Promise<AdminMediaUploadResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";

  onProgress?.({ phase: "uploading", progress: 20, message: "Solicitando URL firmada…" });

  const signRes = await fetch("/api/storage/signed-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminUploadHeaders(),
    },
    body: JSON.stringify({
      folder,
      filename: file.name,
      contentType: file.type || "video/mp4",
      extension: ext,
      resourceType: "video",
    }),
  });

  const signJson = await signRes.json();
  if (!signRes.ok) {
    return { success: false, resourceType: "video", error: signJson.error ?? "Error al firmar subida" };
  }

  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return { success: false, resourceType: "video", error: "Supabase cliente no configurado" };
  }

  onProgress?.({ phase: "uploading", progress: 50, message: "Subiendo vídeo…" });

  const bucket = getBrowserStorageBucket();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(signJson.path, signJson.token, file, {
      contentType: file.type || "video/mp4",
    });

  if (error) {
    return { success: false, resourceType: "video", error: error.message };
  }

  onProgress?.({ phase: "uploading", progress: 100, message: "Vídeo subido" });

  return {
    success: true,
    publicId: signJson.path,
    url: signJson.url,
    resourceType: "video",
    optimized: signJson.optimized ?? true,
  };
}

/**
 * Orquestador: vídeo → comprimir en cliente + signed upload; imagen → API Sharp.
 */
export async function uploadAdminMedia(
  file: File,
  folder: StorageFolder,
  onProgress?: (p: UploadProgress) => void
): Promise<AdminMediaUploadResult> {
  if (isVideoFile(file)) {
    onProgress?.({ phase: "compressing", progress: 0, message: "Preparando compresión de vídeo…" });

    const videoFile = await compressVideoForWeb(file, (p: VideoCompressProgress) => {
      onProgress?.({
        phase: "compressing",
        progress: p.progress,
        message: p.message,
      });
    });

    if (videoFile.size > MAX_VIDEO_UPLOAD_BYTES) {
      return {
        success: false,
        resourceType: "video",
        error: `El vídeo supera ${MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024)} MB tras compresión.`,
      };
    }

    const optimized = videoFile.size < file.size;
    const result = await uploadVideoViaSignedUrl(videoFile, folder, onProgress);
    return { ...result, optimized: result.success ? optimized : false };
  }

  return uploadImageViaApi(file, folder, onProgress);
}
