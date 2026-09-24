/**
 * Helpers REST para scripts batch (listar / descargar / subir objetos).
 */

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "meru-media";
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  }
  return { url, key, bucket };
}

export async function listAllObjects(prefix = "") {
  const { url, key, bucket } = getSupabaseConfig();
  const items = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const endpoint = `${url}/storage/v1/object/list/${bucket}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prefix,
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });

    if (!res.ok) {
      throw new Error(`List failed: ${res.status} ${await res.text()}`);
    }

    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const entry of batch) {
      if (!entry?.name || entry.id == null) continue;
      const fullPath = prefix ? `${prefix}${entry.name}` : entry.name;
      items.push({ ...entry, name: fullPath });
    }

    if (batch.length < limit) break;
    offset += limit;
  }

  return items;
}

export async function downloadObject(path) {
  const { url, key, bucket } = getSupabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    headers: { Authorization: `Bearer ${key}`, apikey: key },
  });
  if (!res.ok) throw new Error(`Download ${path}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function uploadObject(path, buffer, contentType, { upsert = true } = {}) {
  const { url, key, bucket } = getSupabaseConfig();
  const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": contentType,
      "x-upsert": upsert ? "true" : "false",
      "cache-control": "31536000",
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Upload ${path}: ${res.status} ${await res.text()}`);
}

export function parseArgs(argv) {
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const [k, v] = arg.slice(2).split("=");
      flags[k] = v ?? true;
    }
  }
  return flags;
}

export function folderFromPath(path) {
  return path.split("/")[0] ?? "";
}

export function isImagePath(path) {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(path);
}

export function isVideoPath(path) {
  return /\.(mp4|mov|m4v|webm|avi|wmv|3gp|mkv)$/i.test(path);
}

export function isGifPath(path) {
  return /\.gif$/i.test(path);
}
