import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const snapshot = await db.collection("orders").orderBy("createdAt", "desc").limit(100).get();

  const orders = snapshot.docs.map((doc) => {
    const data = doc.data();
    const orderDate = data.orderDate?.toDate?.() ?? data.orderDate;
    const createdAt = data.createdAt?.toDate?.() ?? data.createdAt;
    const items = Array.isArray(data.items) ? data.items : [];
    const departures = items
      .filter(
        (item: { departureDate?: unknown; departureTime?: unknown }) =>
          typeof item.departureDate === "string" &&
          typeof item.departureTime === "string" &&
          item.departureDate &&
          item.departureTime
      )
      .map(
        (item: {
          serviceTitle?: string;
          departureDate: string;
          departureTime: string;
        }) => ({
          title: String(item.serviceTitle ?? "Ítem"),
          date: item.departureDate,
          time: item.departureTime,
        })
      );

    return {
      id: doc.id,
      userId: data.userId ?? "",
      total: data.total ?? 0,
      paymentStatus: data.paymentStatus ?? "pendiente",
      paymentMethod: data.paymentMethod ?? "coordinar",
      customerName: data.customerName ?? "",
      customerEmail: data.customerEmail ?? "",
      customerPhone: data.customerPhone ?? "",
      itemCount: items.length,
      departures,
      holdExpiresAt:
        data.holdExpiresAt?.toDate?.() instanceof Date
          ? data.holdExpiresAt.toDate().toISOString()
          : null,
      orderDate: orderDate instanceof Date ? orderDate.toISOString() : null,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : null,
    };
  });

  return NextResponse.json({ orders });
}
