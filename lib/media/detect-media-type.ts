export function detectMediaType(url: string): "image" | "video" {
  const clean = (url.split("?")[0] ?? "").toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogg|ogv)$/.test(clean)) return "video";
  return "image";
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || detectMediaType(file.name) === "video";
}
