import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ orders: [], bookings: [] });
  }

  const [ordersSnap, bookingsSnap] = await Promise.all([
    db
      .collection("orders")
      .where("userId", "==", session.user.id)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get()
      .catch(() => null),
    db
      .collection("bookings")
      .where("userId", "==", session.user.id)
      .orderBy("bookingDate", "desc")
      .limit(50)
      .get()
      .catch(() => null),
  ]);

  const orders =
    ordersSnap?.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        total: data.total ?? 0,
        paymentStatus: data.paymentStatus ?? "pendiente",
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
      };
    }) ?? [];

  const bookings =
    bookingsSnap?.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        serviceTitle: data.serviceTitle ?? "",
        bookingDate: data.bookingDate?.toDate?.()?.toISOString?.() ?? null,
        active: data.active !== false,
      };
    }) ?? [];

  return NextResponse.json({ orders, bookings });
}
