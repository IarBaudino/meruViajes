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
    const departures: Array<{ title: string; date: string; time: string; label?: string }> = [];
    let hasManualPackage = false;
    for (const item of items) {
      const row = item as {
        serviceTitle?: string;
        packageTitle?: string;
        packageId?: string;
        fulfillmentMode?: string;
        stayFrom?: string;
        stayTo?: string;
        departureDate?: string;
        departureTime?: string;
        includedDepartures?: Array<{
          serviceTitle?: string;
          departureDate?: string;
          departureTime?: string;
        }>;
      };
      if (row.packageId || row.packageTitle || row.fulfillmentMode === "manual") {
        if (row.fulfillmentMode === "manual") hasManualPackage = true;
        if (row.stayFrom && row.stayTo) {
          const from = row.stayFrom.split("-").reverse().join("/");
          const to = row.stayTo.split("-").reverse().join("/");
          departures.push({
            title: String(row.packageTitle || row.serviceTitle || "Paquete"),
            date: row.stayFrom,
            time: "00:00",
            label: `Estadía ${from} → ${to}`,
          });
        }
        continue;
      }
      if (Array.isArray(row.includedDepartures) && row.includedDepartures.length > 0) {
        for (const leg of row.includedDepartures) {
          if (leg.departureDate && leg.departureTime) {
            departures.push({
              title: String(leg.serviceTitle ?? row.serviceTitle ?? "Ítem"),
              date: leg.departureDate,
              time: leg.departureTime,
            });
          }
        }
      } else if (row.departureDate && row.departureTime) {
        departures.push({
          title: String(row.serviceTitle ?? "Ítem"),
          date: row.departureDate,
          time: row.departureTime,
        });
      }
    }

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
      hasManualPackage,
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
