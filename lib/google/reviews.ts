import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { GoogleReviewItem, GoogleReviewsCache } from "@/types/catalog";

export const GOOGLE_REVIEWS_COLLECTION = "googleReviewsCache";
export const GOOGLE_REVIEWS_DOC = "main";

export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

export async function getCachedGoogleReviews(): Promise<GoogleReviewsCache | null> {
  if (!isFirebaseAdminConfigured()) return null;
  const db = getAdminFirestore();
  if (!db) return null;

  const doc = await db.collection(GOOGLE_REVIEWS_COLLECTION).doc(GOOGLE_REVIEWS_DOC).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    placeId: typeof data.placeId === "string" ? data.placeId : "",
    rating: typeof data.rating === "number" ? data.rating : undefined,
    userRatingsTotal:
      typeof data.userRatingsTotal === "number" ? data.userRatingsTotal : undefined,
    reviews: Array.isArray(data.reviews) ? (data.reviews as GoogleReviewItem[]) : [],
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt ?? new Date(),
  };
}

type PlacesNewReview = {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
};

type PlacesNewDetails = {
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesNewReview[];
  error?: { message?: string; status?: string };
};

/** Places API (New) — Place Details with reviews. */
export async function refreshGoogleReviews(placeId: string): Promise<GoogleReviewsCache> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY no configurada");
  }
  if (!placeId.trim()) {
    throw new Error("Place ID vacío");
  }

  const url = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId.trim())}`
  );
  url.searchParams.set("languageCode", "es");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews",
    },
    next: { revalidate: 0 },
  });

  const json = (await res.json()) as PlacesNewDetails;

  if (!res.ok) {
    throw new Error(json.error?.message ?? `Places API error (${res.status})`);
  }

  const reviews: GoogleReviewItem[] = (json.reviews ?? [])
    .filter((r) => r.text?.text && r.authorAttribution?.displayName)
    .slice(0, 6)
    .map((r) => ({
      authorName: r.authorAttribution!.displayName!,
      rating: r.rating ?? 5,
      text: r.text!.text!,
      relativeTime: r.relativePublishTimeDescription,
      profilePhotoUrl: r.authorAttribution?.photoUri,
    }));

  const cache: GoogleReviewsCache = {
    placeId: placeId.trim(),
    rating: json.rating,
    userRatingsTotal: json.userRatingCount,
    reviews,
    updatedAt: new Date(),
  };

  const db = getAdminFirestore();
  if (db) {
    await db.collection(GOOGLE_REVIEWS_COLLECTION).doc(GOOGLE_REVIEWS_DOC).set({
      ...cache,
      updatedAt: new Date(),
    });
  }

  return cache;
}
