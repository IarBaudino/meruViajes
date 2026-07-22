import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  getSiteSettings,
  SITE_SETTINGS_COLLECTION,
  SITE_SETTINGS_DOC,
} from "@/lib/site-settings/get-site-settings";

const patchSchema = z.object({
  orderHoldHours: z
    .number()
    .int("Usá horas enteras")
    .min(24, "Mínimo 24 horas (1 día)")
    .max(336, "Máximo 14 días (336 horas)"),
});

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({
    orderHoldHours: settings.booking?.orderHoldHours ?? 48,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
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

  await db
    .collection(SITE_SETTINGS_COLLECTION)
    .doc(SITE_SETTINGS_DOC)
    .set(
      {
        booking: { orderHoldHours: parsed.data.orderHoldHours },
        updatedAt: new Date(),
      },
      { merge: true }
    );

  return NextResponse.json({ ok: true, orderHoldHours: parsed.data.orderHoldHours });
}
