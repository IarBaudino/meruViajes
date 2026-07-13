import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { refreshGoogleReviews } from "@/lib/google/reviews";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await getSiteSettings();
    const placeId = settings.googleReviews?.placeId?.trim();
    if (!placeId) {
      return NextResponse.json(
        { error: "Configurá el Place ID en Contenido web primero." },
        { status: 400 }
      );
    }

    const cache = await refreshGoogleReviews(placeId);
    return NextResponse.json({ ok: true, cache });
  } catch (error) {
    console.error("[google-reviews refresh]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron actualizar las reseñas",
      },
      { status: 500 }
    );
  }
}
