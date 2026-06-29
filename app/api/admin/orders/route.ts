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
    return {
      id: doc.id,
      userId: data.userId ?? "",
      total: data.total ?? 0,
      paymentStatus: data.paymentStatus ?? "pendiente",
      orderDate: orderDate instanceof Date ? orderDate.toISOString() : null,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : null,
    };
  });

  return NextResponse.json({ orders });
}
