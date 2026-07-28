import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  isGooglePlacesConfigured,
  refreshGoogleReviews,
} from "@/lib/google/reviews";

/**
 * Refresco semanal de reseñas de Google (cache en Firestore).
 * Vercel Cron: Authorization Bearer CRON_SECRET
 * Schedule: 1 vez por semana (domingo 12:00 UTC ≈ 09:00 AR).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "GOOGLE_PLACES_API_KEY no configurada",
    });
  }

  const settings = await getSiteSettings();
  const placeId = settings.googleReviews?.placeId?.trim();
  if (!placeId) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Sin Place ID en contenido web",
    });
  }

  if (settings.googleReviews?.enabled === false) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Sección de reseñas deshabilitada",
    });
  }

  try {
    const cache = await refreshGoogleReviews(placeId);
    console.info("[cron/refresh-google-reviews]", {
      placeId,
      reviews: cache.reviews.length,
      rating: cache.rating,
    });
    return NextResponse.json({
      ok: true,
      skipped: false,
      reviews: cache.reviews.length,
      rating: cache.rating,
      userRatingsTotal: cache.userRatingsTotal,
    });
  } catch (error) {
    console.error("[cron/refresh-google-reviews]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error al refrescar",
      },
      { status: 500 }
    );
  }
}
