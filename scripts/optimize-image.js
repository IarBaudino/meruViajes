/**
 * Optimiza una imagen individual a AVIF.
 * Uso: npm run optimize:image -- ruta/imagen.jpg
 */
const path = require("path");
const sharp = require("sharp");

const input = process.argv[2];

if (!input) {
  console.error("Uso: npm run optimize:image -- ruta/imagen.jpg");
  process.exit(1);
}

const resolved = path.resolve(input);
const out = resolved.replace(/\.[^.]+$/, ".avif");

sharp(resolved)
  .avif({ quality: 80 })
  .toFile(out)
  .then(() => console.log(`Generado: ${out}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
