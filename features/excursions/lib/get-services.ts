import type { Service } from "@/types";
import { mapFirestoreService } from "@/features/excursions/lib/firestore-mapper";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const SERVICES_COLLECTION = "services";

async function fetchActiveFromFirestore(): Promise<Service[]> {
  const db = getAdminFirestore();
  if (!db) return [];

  const snapshot = await db
    .collection(SERVICES_COLLECTION)
    .where("active", "==", true)
    .get();

  return snapshot.docs
    .map((doc) => mapFirestoreService(doc.id, doc.data()))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

/** Solo Firestore — sin datos demo ni fallback. */
export async function getActiveServices(): Promise<Service[]> {
  if (!isFirebaseAdminConfigured()) {
    return [];
  }
  return fetchActiveFromFirestore();
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  const db = getAdminFirestore();
  if (!db) return null;

  const snapshot = await db
    .collection(SERVICES_COLLECTION)
    .where("slug", "==", slug)
    .where("active", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0]!;
  return mapFirestoreService(doc.id, doc.data());
}

export async function getServiceCategoriesFromList(services: Service[]): Promise<string[]> {
  const set = new Set<string>();
  for (const s of services) {
    if (s.category) set.add(s.category);
  }
  return Array.from(set).sort();
}
