import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: Promise<{ id: string }> };

function normalizePaymentStatus(value: unknown): string {
  const raw = String(value ?? "pendiente").trim().toLowerCase();
  if (raw === "pagado" || raw === "cancelado" || raw === "pendiente") return raw;
  return "pendiente";
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const snap = await db.collection("orders").doc(id).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const data = snap.data()!;
  if (String(data.userId ?? "") !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(
    {
      order: {
        id: snap.id,
        total: data.total ?? 0,
        paymentStatus: normalizePaymentStatus(data.paymentStatus),
        paymentMethod: data.paymentMethod ?? "coordinar",
        items: Array.isArray(data.items) ? data.items : [],
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
        holdExpiresAt: data.holdExpiresAt?.toDate?.()?.toISOString?.() ?? null,
        cancelReason: data.cancelReason ?? null,
        cancelledAt: data.cancelledAt?.toDate?.()?.toISOString?.() ?? null,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
