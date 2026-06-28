import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getStorageBucket } from "@/lib/storage/storage-folders";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  browserClient = createClient(url, anonKey);
  return browserClient;
}

export function getBrowserStorageBucket(): string {
  return getStorageBucket();
}
