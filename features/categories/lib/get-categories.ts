import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { ServiceCategory } from "@/types/catalog";
import {
  mapFirestoreCategory,
  SERVICE_CATEGORIES_COLLECTION,
} from "@/features/categories/lib/firestore-mapper";

export { SERVICE_CATEGORIES_COLLECTION };

export async function getAllCategoriesAdmin(): Promise<ServiceCategory[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const db = getAdminFirestore();
  if (!db) return [];

  const snapshot = await db.collection(SERVICE_CATEGORIES_COLLECTION).get();
  return snapshot.docs
    .map((doc) => mapFirestoreCategory(doc.id, doc.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"));
}

export async function getVisibleCategories(): Promise<ServiceCategory[]> {
  const all = await getAllCategoriesAdmin();
  return all.filter((c) => c.visible);
}

export async function getCategoryByIdAdmin(id: string): Promise<ServiceCategory | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;
  const doc = await db.collection(SERVICE_CATEGORIES_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return mapFirestoreCategory(doc.id, doc.data()!);
}
