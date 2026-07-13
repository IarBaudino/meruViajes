import type { Firestore } from "firebase-admin/firestore";
import { SERVICES_COLLECTION } from "@/features/excursions/lib/get-services";
import { uniqueStoragePathsFromUrls } from "@/lib/storage/storage-path";
import { removeStoragePaths } from "@/lib/storage/supabase-server";

export async function serviceHasBookings(db: Firestore, serviceId: string): Promise<boolean> {
  const snapshot = await db
    .collection("bookings")
    .where("serviceId", "==", serviceId)
    .limit(1)
    .get();
  return !snapshot.empty;
}

function collectServiceMediaUrls(data: Record<string, unknown>): string[] {
  const urls: string[] = [];

  if (Array.isArray(data.photos)) {
    for (const photo of data.photos) {
      if (typeof photo === "string") urls.push(photo);
    }
  }

  if (Array.isArray(data.seasonalPhotos)) {
    for (const entry of data.seasonalPhotos) {
      if (
        entry &&
        typeof entry === "object" &&
        "url" in entry &&
        typeof (entry as { url: unknown }).url === "string"
      ) {
        urls.push((entry as { url: string }).url);
      }
    }
  }

  return urls;
}

export async function deleteServiceDocument(
  db: Firestore,
  serviceId: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const docRef = db.collection(SERVICES_COLLECTION).doc(serviceId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return { ok: false, error: "Excursión no encontrada", status: 404 };
  }

  if (await serviceHasBookings(db, serviceId)) {
    return {
      ok: false,
      error:
        "Esta excursión tiene reservas asociadas. Desactivala en lugar de borrarla para no perder el historial.",
      status: 409,
    };
  }

  const data = (doc.data() ?? {}) as Record<string, unknown>;
  const storagePaths = uniqueStoragePathsFromUrls(collectServiceMediaUrls(data));

  if (storagePaths.length > 0) {
    const storageResult = await removeStoragePaths(storagePaths);
    if (storageResult.error) {
      console.error("[delete-service] supabase remove failed", storageResult.error);
      return {
        ok: false,
        error: `No se pudieron borrar los medios en Supabase: ${storageResult.error}`,
        status: 502,
      };
    }
  }

  await docRef.delete();
  return { ok: true };
}
