import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { authOptions } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UserOrderDto = {
  id: string;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  items: unknown[];
  createdAt: string | null;
  holdExpiresAt: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
};

function normalizePaymentStatus(value: unknown): string {
  const raw = String(value ?? "pendiente").trim().toLowerCase();
  if (raw === "pagado" || raw === "cancelado" || raw === "pendiente") return raw;
  return "pendiente";
}

function serializeOrders(docs: QueryDocumentSnapshot[]): UserOrderDto[] {
  return docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      total: data.total ?? 0,
      paymentStatus: normalizePaymentStatus(data.paymentStatus),
      paymentMethod: data.paymentMethod ?? "coordinar",
      items: Array.isArray(data.items) ? data.items : [],
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
      holdExpiresAt: data.holdExpiresAt?.toDate?.()?.toISOString?.() ?? null,
      cancelReason: data.cancelReason ?? null,
      cancelledAt: data.cancelledAt?.toDate?.()?.toISOString?.() ?? null,
    };
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ orders: [], bookings: [] });
  }

  const userId = session.user.id;
  const ordersRef = db.collection("orders").where("userId", "==", userId);

  let orderDocs: QueryDocumentSnapshot[] = [];
  try {
    const snap = await ordersRef.orderBy("createdAt", "desc").limit(50).get();
    orderDocs = snap.docs;
  } catch (err) {
    console.error("[users/me/orders] indexed query failed, falling back", err);
    try {
      const fallback = await ordersRef.limit(50).get();
      orderDocs = [...fallback.docs].sort((a, b) => {
        const aMs = a.data().createdAt?.toDate?.()?.getTime?.() ?? 0;
        const bMs = b.data().createdAt?.toDate?.()?.getTime?.() ?? 0;
        return bMs - aMs;
      });
    } catch (fallbackErr) {
      console.error("[users/me/orders] fallback query failed", fallbackErr);
      orderDocs = [];
    }
  }

  let bookingDocs: QueryDocumentSnapshot[] = [];
  try {
    const snap = await db
      .collection("bookings")
      .where("userId", "==", userId)
      .orderBy("bookingDate", "desc")
      .limit(50)
      .get();
    bookingDocs = snap.docs;
  } catch {
    try {
      const fallback = await db
        .collection("bookings")
        .where("userId", "==", userId)
        .limit(50)
        .get();
      bookingDocs = [...fallback.docs].sort((a, b) => {
        const aMs = a.data().bookingDate?.toDate?.()?.getTime?.() ?? 0;
        const bMs = b.data().bookingDate?.toDate?.()?.getTime?.() ?? 0;
        return bMs - aMs;
      });
    } catch {
      bookingDocs = [];
    }
  }

  const orders = serializeOrders(orderDocs);

  const paymentByOrderId = new Map(
    orders.map((o) => [o.id, o.paymentStatus as string])
  );

  const bookings = bookingDocs.map((doc) => {
    const data = doc.data();
    const orderId =
      typeof data.serviceOrderId === "string" ? data.serviceOrderId : "";
    return {
      id: doc.id,
      serviceTitle: data.serviceTitle ?? "",
      bookingDate: data.bookingDate?.toDate?.()?.toISOString?.() ?? null,
      quantity: data.quantity ?? 1,
      lineTotal: typeof data.lineTotal === "number" ? data.lineTotal : undefined,
      active: data.active !== false,
      orderId,
      paymentStatus: paymentByOrderId.get(orderId) ?? "pendiente",
      passengers: data.passengers ?? null,
    };
  });

  return NextResponse.json(
    { orders, bookings },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
