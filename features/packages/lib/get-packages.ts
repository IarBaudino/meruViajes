import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { ExcursionPackage } from "@/types/catalog";
import {
  mapFirestorePackage,
  PACKAGES_COLLECTION,
} from "@/features/packages/lib/firestore-mapper";

export { PACKAGES_COLLECTION };

export async function getActivePackages(): Promise<ExcursionPackage[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const db = getAdminFirestore();
  if (!db) return [];

  const snapshot = await db
    .collection(PACKAGES_COLLECTION)
    .where("active", "==", true)
    .get();

  return snapshot.docs
    .map((doc) => mapFirestorePackage(doc.id, doc.data()))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function byHomeOrderThenTitle(
  a: ExcursionPackage,
  b: ExcursionPackage
) {
  const orderA = Number.isFinite(a.homeOrder) ? Number(a.homeOrder) : 100;
  const orderB = Number.isFinite(b.homeOrder) ? Number(b.homeOrder) : 100;
  if (orderA !== orderB) return orderA - orderB;
  return a.title.localeCompare(b.title, "es");
}

/** Paquetes activos destacados para el home. */
export async function getHomeFeaturedPackages(limit = 6): Promise<ExcursionPackage[]> {
  const all = await getActivePackages();
  return all.filter((p) => p.featuredOnHome).sort(byHomeOrderThenTitle).slice(0, limit);
}

export async function getPackageBySlug(slug: string): Promise<ExcursionPackage | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;

  const snapshot = await db
    .collection(PACKAGES_COLLECTION)
    .where("slug", "==", slug)
    .where("active", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0]!;
  return mapFirestorePackage(doc.id, doc.data());
}

export async function getAllPackagesAdmin(): Promise<ExcursionPackage[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const db = getAdminFirestore();
  if (!db) return [];

  const snapshot = await db.collection(PACKAGES_COLLECTION).get();
  return snapshot.docs
    .map((doc) => mapFirestorePackage(doc.id, doc.data()))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function getPackageByIdAdmin(id: string): Promise<ExcursionPackage | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;
  const doc = await db.collection(PACKAGES_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return mapFirestorePackage(doc.id, doc.data()!);
}
