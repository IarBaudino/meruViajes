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
    `https://maps.googleapis.com/maps/api/place/details/json`
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews");
  url.searchParams.set("language", "es");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error("Error al consultar Google Places");
  }

  const json = (await res.json()) as {
    status: string;
    result?: {
      rating?: number;
      user_ratings_total?: number;
      reviews?: Array<{
        author_name?: string;
        rating?: number;
        text?: string;
        relative_time_description?: string;
        profile_photo_url?: string;
      }>;
    };
    error_message?: string;
  };

  if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new Error(json.error_message ?? `Places status: ${json.status}`);
  }

  const reviews: GoogleReviewItem[] = (json.result?.reviews ?? [])
    .filter((r) => r.text && r.author_name)
    .slice(0, 6)
    .map((r) => ({
      authorName: r.author_name!,
      rating: r.rating ?? 5,
      text: r.text!,
      relativeTime: r.relative_time_description,
      profilePhotoUrl: r.profile_photo_url,
    }));

  const cache: GoogleReviewsCache = {
    placeId,
    rating: json.result?.rating,
    userRatingsTotal: json.result?.user_ratings_total,
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
