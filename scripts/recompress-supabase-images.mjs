#!/usr/bin/env node
/**
 * Recomprime imágenes en Supabase Storage (mismo path → URLs sin cambiar).
 *
 * Uso:
 *   node --env-file=.env.local scripts/recompress-supabase-images.mjs
 *   node --env-file=.env.local scripts/recompress-supabase-images.mjs --dry-run
 *   node --env-file=.env.local scripts/recompress-supabase-images.mjs --folder=excursions --min-kb=150 --min-savings=0.15
 */
import {
  downloadObject,
  folderFromPath,
  isGifPath,
  isImagePath,
  isVideoPath,
  listAllObjects,
  parseArgs,
  uploadObject,
} from "./lib/supabase-storage-rest.mjs";
import { compressImageForWeb } from "./lib/compress-image-core.mjs";

const flags = parseArgs(process.argv.slice(2));
const dryRun = Boolean(flags["dry-run"]);
const folderFilter = flags.folder ? String(flags.folder) : null;
const minKb = Number(flags["min-kb"] ?? 150);
const minSavings = Number(flags["min-savings"] ?? 0.15);

async function main() {
  const objects = await listAllObjects(folderFilter ? `${folderFilter}/` : "");
  let processed = 0;
  let skipped = 0;

  for (const obj of objects) {
    const path = obj.name;
    if (!isImagePath(path) || isGifPath(path) || isVideoPath(path)) {
      skipped++;
      continue;
    }

    const folder = folderFromPath(path);
    const original = await downloadObject(path);
    if (original.length < minKb * 1024) {
      skipped++;
      continue;
    }

    const result = await compressImageForWeb(original, folder);
    if (result.passthrough) {
      skipped++;
      continue;
    }

    const savings = (original.length - result.buffer.length) / original.length;
    if (savings < minSavings) {
      skipped++;
      continue;
    }

    processed++;
    const kbBefore = (original.length / 1024).toFixed(1);
    const kbAfter = (result.buffer.length / 1024).toFixed(1);
    console.log(
      `${dryRun ? "[dry-run] " : ""}${path}: ${kbBefore}KB → ${kbAfter}KB (${(savings * 100).toFixed(1)}%)`
    );

    if (!dryRun) {
      await uploadObject(path, result.buffer, result.contentType, { upsert: true });
    }
  }

  console.log(`Listo. Procesadas: ${processed}, omitidas: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
