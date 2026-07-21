import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";

const patchSchema = z.object({
  paymentStatus: z.enum(["pendiente", "pagado"]),
});

type RouteContext = { params: Promise<{ id: string }> };

function serializeTimestamp(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
  const bookingsSnap = await db
    .collection("bookings")
    .where("serviceOrderId", "==", id)
    .get()
    .catch(() => null);

  const bookings =
    bookingsSnap?.docs.map((doc) => {
      const b = doc.data();
      return {
        id: doc.id,
        serviceId: b.serviceId ?? "",
        serviceTitle: b.serviceTitle ?? "",
        quantity: b.quantity ?? 1,
        unitPrice: b.unitPrice ?? 0,
        lineTotal: b.lineTotal ?? 0,
        packageId: b.packageId ?? null,
        passengers: b.passengers ?? null,
        dni: b.DNI_Personal ?? "",
        active: b.active !== false,
        bookingDate: serializeTimestamp(b.bookingDate),
      };
    }) ?? [];

  return NextResponse.json({
    order: {
      id: snap.id,
      userId: data.userId ?? "",
      total: data.total ?? 0,
      paymentStatus: data.paymentStatus ?? "pendiente",
      paymentMethod: data.paymentMethod ?? "coordinar",
      paymentInformation: data.paymentInformation ?? null,
      customerName: data.customerName ?? "",
      customerEmail: data.customerEmail ?? "",
      customerDni: data.customerDni ?? "",
      customerPhone: data.customerPhone ?? "",
      items: Array.isArray(data.items) ? data.items : [],
      orderDate: serializeTimestamp(data.orderDate),
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: serializeTimestamp(data.updatedAt),
    },
    bookings,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado de pago inválido" }, { status: 400 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const ref = db.collection("orders").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  await ref.set(
    {
      paymentStatus: parsed.data.paymentStatus,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, paymentStatus: parsed.data.paymentStatus });
}
