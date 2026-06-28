/**
 * Convierte imágenes de public/ a AVIF.
 * Uso: npm run optimize:images
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const publicDir = path.join(__dirname, "..", "public");
const extensions = [".jpg", ".jpeg", ".png", ".webp"];

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!extensions.includes(ext)) return;

  const outPath = filePath.replace(ext, ".avif");
  await sharp(filePath).avif({ quality: 80 }).toFile(outPath);
  console.log(`✓ ${path.basename(outPath)}`);
}

async function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.log("No hay carpeta public/ con imágenes.");
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else await convertFile(full);
  }
}

walk(publicDir).catch(console.error);
