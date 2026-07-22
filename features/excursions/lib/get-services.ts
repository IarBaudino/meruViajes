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

function byHomeOrderThenTitle(a: Service, b: Service) {
  const orderA = Number.isFinite(a.homeOrder) ? Number(a.homeOrder) : 100;
  const orderB = Number.isFinite(b.homeOrder) ? Number(b.homeOrder) : 100;
  if (orderA !== orderB) return orderA - orderB;
  return a.title.localeCompare(b.title, "es");
}

/** Excursiones activas destacadas para el home, ordenadas por importancia. */
export async function getHomeFeaturedServices(limit = 6): Promise<Service[]> {
  const all = await getActiveServices();
  const featured = all.filter((s) => s.featuredOnHome).sort(byHomeOrderThenTitle);
  if (featured.length > 0) return featured.slice(0, limit);
  return all.slice(0, Math.min(3, limit));
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

export async function getAllServicesAdmin(): Promise<Service[]> {
  if (!isFirebaseAdminConfigured()) return [];

  const db = getAdminFirestore();
  if (!db) return [];

  const snapshot = await db.collection(SERVICES_COLLECTION).get();

  return snapshot.docs
    .map((doc) => mapFirestoreService(doc.id, doc.data()))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function getServiceByIdAdmin(id: string): Promise<Service | null> {
  if (!isFirebaseAdminConfigured()) return null;

  const db = getAdminFirestore();
  if (!db) return null;

  const doc = await db.collection(SERVICES_COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  return mapFirestoreService(doc.id, doc.data()!);
}

export async function getServiceCategoriesFromList(services: Service[]): Promise<string[]> {
  const set = new Set<string>();
  for (const s of services) {
    if (s.category) set.add(s.category);
  }
  return Array.from(set).sort();
}
