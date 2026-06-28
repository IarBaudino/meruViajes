#!/usr/bin/env node
/**
 * Recomprime vídeos en Supabase con ffmpeg del sistema (mismo path).
 *
 * Requiere ffmpeg en PATH o --ffmpeg=ruta
 *
 * Uso:
 *   node --env-file=.env.local scripts/recompress-supabase-videos.mjs --dry-run
 *   node --env-file=.env.local scripts/recompress-supabase-videos.mjs --min-mb=1 --min-savings=0.2
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  downloadObject,
  isVideoPath,
  listAllObjects,
  parseArgs,
  uploadObject,
} from "./lib/supabase-storage-rest.mjs";

const VIDEO_PROFILE = {
  maxWidth: 1280,
  crf: 28,
  audioBitrate: "128k",
  preset: "medium",
  outputMime: "video/mp4",
  minBytesToCompress: 512 * 1024,
};

const flags = parseArgs(process.argv.slice(2));
const dryRun = Boolean(flags["dry-run"]);
const minMb = Number(flags["min-mb"] ?? 1);
const minSavings = Number(flags["min-savings"] ?? 0.2);
const ffmpegBin = flags.ffmpeg ? String(flags.ffmpeg) : "ffmpeg";

function buildArgs(input, output, withAudio = true) {
  const base = [
    "-y",
    "-i",
    input,
    "-c:v",
    "libx264",
    "-preset",
    VIDEO_PROFILE.preset,
    "-crf",
    String(VIDEO_PROFILE.crf),
    "-movflags",
    "+faststart",
    "-vf",
    `scale='min(${VIDEO_PROFILE.maxWidth},iw)':-2`,
    "-pix_fmt",
    "yuv420p",
  ];
  if (withAudio) {
    base.push("-c:a", "aac", "-b:a", VIDEO_PROFILE.audioBitrate);
  } else {
    base.push("-an");
  }
  base.push(output);
  return base;
}

function transcode(inputPath, outputPath) {
  let r = spawnSync(ffmpegBin, buildArgs(inputPath, outputPath, true), { stdio: "pipe" });
  if (r.status !== 0) {
    r = spawnSync(ffmpegBin, buildArgs(inputPath, outputPath, false), { stdio: "pipe" });
  }
  if (r.status !== 0) {
    throw new Error(r.stderr?.toString() ?? "ffmpeg failed");
  }
}

async function main() {
  const objects = await listAllObjects();
  let processed = 0;
  let skipped = 0;

  for (const obj of objects) {
    const path = obj.name;
    if (!isVideoPath(path)) {
      skipped++;
      continue;
    }

    const original = await downloadObject(path);
    if (original.length < minMb * 1024 * 1024) {
      skipped++;
      continue;
    }
    if (original.length < VIDEO_PROFILE.minBytesToCompress) {
      skipped++;
      continue;
    }

    const dir = mkdtempSync(join(tmpdir(), "meru-vid-"));
    const inFile = join(dir, "in");
    const outFile = join(dir, "out.mp4");
    writeFileSync(inFile, original);

    try {
      transcode(inFile, outFile);
      const compressed = readFileSync(outFile);
      const savings = (original.length - compressed.length) / original.length;
      if (compressed.length >= original.length || savings < minSavings) {
        skipped++;
        continue;
      }

      processed++;
      console.log(
        `${dryRun ? "[dry-run] " : ""}${path}: ${(original.length / 1048576).toFixed(2)}MB → ${(compressed.length / 1048576).toFixed(2)}MB`
      );

      if (!dryRun) {
        const outPath = path.replace(/\.[^.]+$/, ".mp4");
        await uploadObject(outPath, compressed, VIDEO_PROFILE.outputMime, { upsert: true });
        if (outPath !== path) {
          console.warn(`  Nota: extensión cambiada a .mp4 (${outPath})`);
        }
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  console.log(`Listo. Procesados: ${processed}, omitidos: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
