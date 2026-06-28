"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  VIDEO_COMPRESS_PROFILE,
  buildFfmpegVideoArgs,
  buildFfmpegVideoArgsNoAudio,
  shouldUseCompressedVideo,
} from "@/lib/storage/compress-video-profile";

const CORE_VERSION = "0.12.6";
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

export type VideoCompressProgress = {
  phase: "loading" | "compressing";
  progress: number;
  message: string;
};

let ffmpegSingleton: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function loadFFmpeg(onProgress?: (p: VideoCompressProgress) => void): Promise<FFmpeg> {
  if (ffmpegSingleton?.loaded) return ffmpegSingleton;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    onProgress?.({ phase: "loading", progress: 0, message: "Cargando motor de vídeo…" });

    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => {
      onProgress?.({
        phase: "compressing",
        progress: Math.min(100, Math.round(progress * 100)),
        message: "Comprimiendo vídeo…",
      });
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegSingleton = ffmpeg;
    onProgress?.({ phase: "loading", progress: 100, message: "Listo" });
    return ffmpeg;
  })();

  return loadPromise;
}

function extFromName(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "mp4";
}

export async function compressVideoForWeb(
  file: File,
  onProgress?: (p: VideoCompressProgress) => void
): Promise<File> {
  if (file.size < VIDEO_COMPRESS_PROFILE.minBytesToCompress) {
    return file;
  }

  const inputExt = extFromName(file.name);
  const inputName = `input.${inputExt}`;
  const outputName = `output.${VIDEO_COMPRESS_PROFILE.outputExt}`;

  try {
    const ffmpeg = await loadFFmpeg(onProgress);
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    try {
      await ffmpeg.exec(buildFfmpegVideoArgs(inputName, outputName));
    } catch {
      await ffmpeg.exec(buildFfmpegVideoArgsNoAudio(inputName, outputName));
    }

    const data = await ffmpeg.readFile(outputName);
    const bytes =
      data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    const compressed = new File([bytes as BlobPart], file.name.replace(/\.[^.]+$/, `.${VIDEO_COMPRESS_PROFILE.outputExt}`), {
      type: VIDEO_COMPRESS_PROFILE.outputMime,
      lastModified: Date.now(),
    });

    if (!shouldUseCompressedVideo(file.size, compressed.size)) {
      return file;
    }

    return compressed;
  } catch (err) {
    console.warn("[compressVideoForWeb] Fallback al original:", err);
    return file;
  }
}

export async function ensureVideoUnderLimit(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;
  throw new Error(`El vídeo supera ${Math.round(maxBytes / (1024 * 1024))} MB tras compresión.`);
}
