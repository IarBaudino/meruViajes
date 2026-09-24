import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { GroupTrip } from "@/types/catalog";
import {
  mapFirestoreGroupTrip,
  GROUP_TRIPS_COLLECTION,
} from "@/features/group-trips/lib/firestore-mapper";

export { GROUP_TRIPS_COLLECTION };

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function byStartThenTitle(a: GroupTrip, b: GroupTrip) {
  if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
  return a.title.localeCompare(b.title, "es");
}

function byHomeOrderThenStart(a: GroupTrip, b: GroupTrip) {
  const orderA = Number.isFinite(a.homeOrder) ? Number(a.homeOrder) : 100;
  const orderB = Number.isFinite(b.homeOrder) ? Number(b.homeOrder) : 100;
  if (orderA !== orderB) return orderA - orderB;
  return byStartThenTitle(a, b);
}

export async function getActiveGroupTrips(): Promise<GroupTrip[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const db = getAdminFirestore();
  if (!db) return [];

  const snapshot = await db
    .collection(GROUP_TRIPS_COLLECTION)
    .where("active", "==", true)
    .get();

  const today = todayYmd();
  return snapshot.docs
    .map((doc) => mapFirestoreGroupTrip(doc.id, doc.data()))
    .filter((trip) => trip.endDate >= today)
    .sort(byStartThenTitle);
}

export async function getHomeFeaturedGroupTrips(limit = 6): Promise<GroupTrip[]> {
  const all = await getActiveGroupTrips();
  return all.filter((t) => t.featuredOnHome).sort(byHomeOrderThenStart).slice(0, limit);
}

export async function getGroupTripBySlug(slug: string): Promise<GroupTrip | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;

  const snapshot = await db
    .collection(GROUP_TRIPS_COLLECTION)
    .where("slug", "==", slug)
    .where("active", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0]!;
  return mapFirestoreGroupTrip(doc.id, doc.data());
}

export async function getAllGroupTripsAdmin(): Promise<GroupTrip[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const db = getAdminFirestore();
  if (!db) return [];

  const snapshot = await db.collection(GROUP_TRIPS_COLLECTION).get();
  return snapshot.docs
    .map((doc) => mapFirestoreGroupTrip(doc.id, doc.data()))
    .sort(byStartThenTitle);
}

export async function getGroupTripByIdAdmin(id: string): Promise<GroupTrip | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;
  const doc = await db.collection(GROUP_TRIPS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return mapFirestoreGroupTrip(id, doc.data()!);
}
