import sharp from "sharp";
import type { StorageFolder } from "@/lib/storage/storage-folders";
import { resolveImageProfile } from "@/lib/storage/storage-folders";

const GIF_HEADER = Buffer.from("GIF");

export type CompressImageResult = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  width: number;
  height: number;
  passthrough: boolean;
};

function isAnimatedGif(buffer: Buffer): boolean {
  if (buffer.length < 6 || !buffer.subarray(0, 3).equals(GIF_HEADER)) {
    return false;
  }
  const probe = buffer.toString("binary", 0, Math.min(buffer.length, 512 * 1024));
  return probe.includes("NETSCAPE2.0");
}

export async function compressImageForWeb(
  input: Buffer,
  folder: StorageFolder
): Promise<CompressImageResult> {
  if (isAnimatedGif(input)) {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    return {
      buffer: input,
      contentType: "image/gif",
      extension: "gif",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      passthrough: true,
    };
  }

  const profile = resolveImageProfile(folder);

  const buildPipeline = () =>
    sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: profile.maxWidth,
        height: profile.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });

  try {
    const webpBuffer = await buildPipeline().webp({ quality: profile.quality }).toBuffer();
    const meta = await sharp(webpBuffer).metadata();
    return {
      buffer: webpBuffer,
      contentType: "image/webp",
      extension: "webp",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      passthrough: false,
    };
  } catch {
    const jpegBuffer = await buildPipeline()
      .jpeg({ quality: profile.quality, mozjpeg: true })
      .toBuffer();
    const meta = await sharp(jpegBuffer).metadata();
    return {
      buffer: jpegBuffer,
      contentType: "image/jpeg",
      extension: "jpg",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      passthrough: false,
    };
  }
}
