import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { releaseExpiredOrderHolds } from "@/lib/checkout/release-order-stock";

export const dynamic = "force-dynamic";

/**
 * Liberación manual de cupos vencidos (mismo proceso que el cron).
 */
export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const result = await releaseExpiredOrderHolds(db);
  return NextResponse.json(
    { ok: true, ...result },
    { headers: { "Cache-Control": "no-store" } }
  );
}
