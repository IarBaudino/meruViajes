import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicStorageUrl, getStorageBucket } from "@/lib/storage/storage-folders";

let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export async function uploadBufferToStorage(
  buffer: Buffer,
  path: string,
  contentType: string,
  options?: { upsert?: boolean }
): Promise<{ path: string; url: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase no configurado (SUPABASE_SERVICE_ROLE_KEY)");
  }

  const bucket = getStorageBucket();
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: options?.upsert ?? false,
    cacheControl: "31536000",
  });

  if (error) throw error;

  return { path, url: getPublicStorageUrl(path) };
}

export async function createSignedVideoUpload(path: string): Promise<{
  path: string;
  token: string;
  signedUrl: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const bucket = getStorageBucket();
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

  if (error || !data) {
    throw error ?? new Error("No se pudo crear URL firmada");
  }

  return {
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export function randomStorageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
