/** Perfil H.264 compartido: cliente (FFmpeg.wasm) y script batch (ffmpeg CLI). */
export const VIDEO_COMPRESS_PROFILE = {
  maxWidth: 1280,
  crf: 28,
  audioBitrate: "128k",
  preset: "medium",
  outputMime: "video/mp4",
  outputExt: "mp4",
  minBytesToCompress: 512 * 1024,
  minSavingsRatio: 0.1,
} as const;

export function shouldUseCompressedVideo(originalSize: number, compressedSize: number): boolean {
  if (originalSize < VIDEO_COMPRESS_PROFILE.minBytesToCompress) return false;
  if (compressedSize >= originalSize) return false;
  const savings = (originalSize - compressedSize) / originalSize;
  return savings >= VIDEO_COMPRESS_PROFILE.minSavingsRatio;
}

export function buildFfmpegVideoArgs(inputName: string, outputName: string): string[] {
  const { maxWidth, crf, preset, audioBitrate } = VIDEO_COMPRESS_PROFILE;
  return [
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    String(crf),
    "-movflags",
    "+faststart",
    "-vf",
    `scale='min(${maxWidth},iw)':-2`,
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    audioBitrate,
    outputName,
  ];
}

export function buildFfmpegVideoArgsNoAudio(inputName: string, outputName: string): string[] {
  const { maxWidth, crf, preset } = VIDEO_COMPRESS_PROFILE;
  return [
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-preset",
    preset,
    "-crf",
    String(crf),
    "-movflags",
    "+faststart",
    "-vf",
    `scale='min(${maxWidth},iw)':-2`,
    "-pix_fmt",
    "yuv420p",
    "-an",
    outputName,
  ];
}
