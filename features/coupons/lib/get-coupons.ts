import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { Coupon } from "@/types/coupon";
import {
  COUPONS_COLLECTION,
  mapFirestoreCoupon,
  normalizeCouponCode,
} from "@/features/coupons/lib/firestore-mapper";

export { COUPONS_COLLECTION, normalizeCouponCode };

export async function getAllCouponsAdmin(): Promise<Coupon[]> {
  if (!isFirebaseAdminConfigured()) return [];
  const db = getAdminFirestore();
  if (!db) return [];
  const snapshot = await db.collection(COUPONS_COLLECTION).get();
  return snapshot.docs
    .map((doc) => mapFirestoreCoupon(doc.id, doc.data()))
    .sort((a, b) => a.code.localeCompare(b.code, "es"));
}

export async function getCouponByIdAdmin(id: string): Promise<Coupon | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;
  const doc = await db.collection(COUPONS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return mapFirestoreCoupon(id, doc.data()!);
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  const snapshot = await db
    .collection(COUPONS_COLLECTION)
    .where("code", "==", normalized)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0]!;
  return mapFirestoreCoupon(doc.id, doc.data());
}
