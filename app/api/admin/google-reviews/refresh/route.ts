import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  getSiteSettings,
  SITE_SETTINGS_COLLECTION,
  SITE_SETTINGS_DOC,
} from "@/lib/site-settings/get-site-settings";
import { refreshGoogleReviews } from "@/lib/google/reviews";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let bodyPlaceId = "";
    try {
      const body = (await request.json()) as { placeId?: string };
      bodyPlaceId = typeof body.placeId === "string" ? body.placeId.trim() : "";
    } catch {
      // body vacío: se usa el guardado en settings
    }

    const settings = await getSiteSettings();
    const placeId = bodyPlaceId || settings.googleReviews?.placeId?.trim() || "";
    if (!placeId) {
      return NextResponse.json(
        {
          error:
            "Pegá el Place ID en Contenido web, guardá, y volvé a actualizar reseñas.",
        },
        { status: 400 }
      );
    }

    const cache = await refreshGoogleReviews(placeId);

    // Persiste el Place ID si vino del formulario y aún no estaba guardado.
    if (bodyPlaceId && bodyPlaceId !== settings.googleReviews?.placeId) {
      const db = getAdminFirestore();
      if (db) {
        await db
          .collection(SITE_SETTINGS_COLLECTION)
          .doc(SITE_SETTINGS_DOC)
          .set(
            {
              googleReviews: {
                ...(settings.googleReviews ?? {}),
                placeId: bodyPlaceId,
                enabled: settings.googleReviews?.enabled ?? true,
                title: settings.googleReviews?.title ?? "Reseñas",
              },
              updatedAt: new Date(),
            },
            { merge: true }
          );
      }
    }

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
