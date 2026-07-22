import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  getSiteSettings,
  SITE_SETTINGS_COLLECTION,
  SITE_SETTINGS_DOC,
} from "@/lib/site-settings/get-site-settings";
import {
  hoursBeforeDeparture,
  maxHoldHoursAfterBooking,
  resolveHoldWarningMessage,
} from "@/lib/checkout/hold-warning";

const patchSchema = z.object({
  orderHoldHours: z
    .number()
    .int("Usá horas enteras")
    .min(24, "Mínimo 24 horas (1 día)")
    .max(336, "Máximo 14 días (336 horas)"),
  hoursBeforeDeparture: z
    .number()
    .int()
    .min(1, "Mínimo 1 hora")
    .max(72, "Máximo 72 horas"),
  holdWarningMessage: z.string().max(600),
});

function serializeBooking(settings: Awaited<ReturnType<typeof getSiteSettings>>) {
  const booking = settings.booking;
  return {
    orderHoldHours: maxHoldHoursAfterBooking(booking),
    hoursBeforeDeparture: hoursBeforeDeparture(booking),
    holdWarningMessage: booking?.holdWarningMessage ?? "",
    warningPreview: resolveHoldWarningMessage(booking),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await getSiteSettings();
  return NextResponse.json(serializeBooking(settings));
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

  const booking = {
    orderHoldHours: parsed.data.orderHoldHours,
    hoursBeforeDeparture: parsed.data.hoursBeforeDeparture,
    holdWarningMessage: parsed.data.holdWarningMessage.trim(),
    shortHoldEnabled: false,
  };

  await db
    .collection(SITE_SETTINGS_COLLECTION)
    .doc(SITE_SETTINGS_DOC)
    .set({ booking, updatedAt: new Date() }, { merge: true });

  const settings = await getSiteSettings();
  return NextResponse.json({ ok: true, ...serializeBooking(settings) });
}
