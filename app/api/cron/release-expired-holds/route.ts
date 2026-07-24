import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { releaseExpiredOrderHolds } from "@/lib/checkout/release-order-stock";

/**
 * Libera cupos de reservas pendientes vencidas.
 * Vercel Cron: Authorization Bearer CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const result = await releaseExpiredOrderHolds(db);
  console.info("[cron/release-expired-holds]", {
    checked: result.checked,
    released: result.released,
    skipped: result.skipped,
    errors: result.errors,
  });
  return NextResponse.json({ ok: true, ...result });
}
