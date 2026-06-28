import sharp from "sharp";

const GIF_HEADER = Buffer.from("GIF");

const PROFILES = {
  categories: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  content: { maxWidth: 1920, maxHeight: 1080, quality: 82 },
  products: { maxWidth: 1400, maxHeight: 1800, quality: 84 },
  excursions: { maxWidth: 1400, maxHeight: 1800, quality: 84 },
  team: { maxWidth: 800, maxHeight: 800, quality: 85 },
  blog: { maxWidth: 1200, maxHeight: 800, quality: 82 },
};

function isAnimatedGif(buffer) {
  if (buffer.length < 6 || !buffer.subarray(0, 3).equals(GIF_HEADER)) return false;
  const probe = buffer.toString("binary", 0, Math.min(buffer.length, 512 * 1024));
  return probe.includes("NETSCAPE2.0");
}

function resolveProfile(folder) {
  if (folder === "excursions") return PROFILES.products;
  return PROFILES[folder] ?? PROFILES.content;
}

export async function compressImageForWeb(input, folder) {
  if (isAnimatedGif(input)) {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    return {
      buffer: input,
      contentType: "image/gif",
      passthrough: true,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  }

  const profile = resolveProfile(folder);
  const build = () =>
    sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: profile.maxWidth,
        height: profile.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });

  try {
    const buffer = await build().webp({ quality: profile.quality }).toBuffer();
    const meta = await sharp(buffer).metadata();
    return {
      buffer,
      contentType: "image/webp",
      passthrough: false,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  } catch {
    const buffer = await build().jpeg({ quality: profile.quality, mozjpeg: true }).toBuffer();
    const meta = await sharp(buffer).metadata();
    return {
      buffer,
      contentType: "image/jpeg",
      passthrough: false,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
    };
  }
}
