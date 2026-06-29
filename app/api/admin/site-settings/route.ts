import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getSiteSettings, SITE_SETTINGS_COLLECTION, SITE_SETTINGS_DOC } from "@/lib/site-settings/get-site-settings";
import { siteSettingsSchema } from "@/schemas/site-settings";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const data = {
    ...parsed.data,
    hero: {
      ...parsed.data.hero,
      backgroundImages: parsed.data.hero.backgroundImages ?? [],
      backgroundImageUrl: null,
    },
    updatedAt: new Date(),
  };

  await db.collection(SITE_SETTINGS_COLLECTION).doc(SITE_SETTINGS_DOC).set(data, { merge: true });

  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
