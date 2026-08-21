import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { cancelOrderAndReleaseStock } from "@/lib/checkout/release-order-stock";

const patchSchema = z
  .object({
    paymentStatus: z.enum(["pendiente", "pagado", "cancelado"]).optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => data.paymentStatus !== undefined || data.archived !== undefined, {
    message: "Nada para actualizar",
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
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number((value as { seconds: unknown }).seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000).toISOString();
  }
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
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
      archived: data.archived === true,
      holdExpiresAt: serializeTimestamp(data.holdExpiresAt),
      stockReleased: data.stockReleased === true,
      cancelReason: data.cancelReason ?? null,
      cancelledAt: serializeTimestamp(data.cancelledAt),
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
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
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

  const current = String(snap.data()?.paymentStatus ?? "pendiente");

  if (parsed.data.archived !== undefined) {
    if (parsed.data.archived && current === "pendiente") {
      return NextResponse.json(
        {
          error:
            "No se puede archivar una orden pendiente. Primero marcá pagado o cancelá y liberá cupos.",
        },
        { status: 400 }
      );
    }
    await ref.set(
      {
        archived: parsed.data.archived,
        archivedAt: parsed.data.archived ? new Date() : null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    if (parsed.data.paymentStatus === undefined) {
      return NextResponse.json(
        { ok: true, archived: parsed.data.archived },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  if (parsed.data.paymentStatus === "cancelado") {
    const beforeData = snap.data();
    const result = await cancelOrderAndReleaseStock(db, id, "admin");
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (!result.alreadyReleased && beforeData) {
      try {
        const { sendOrderCancelledEmail } = await import(
          "@/lib/checkout/send-checkout-emails"
        );
        await sendOrderCancelledEmail({
          orderId: id,
          customerName: String(beforeData.customerName ?? ""),
          customerEmail: String(beforeData.customerEmail ?? ""),
          total: Number(beforeData.total ?? 0),
          items: Array.isArray(beforeData.items) ? beforeData.items : [],
          reason: "admin",
        });
      } catch (err) {
        console.error("[admin/orders] cancel email", err);
      }
    }
    return NextResponse.json({
      ok: true,
      paymentStatus: "cancelado",
      stockReleased: true,
      alreadyReleased: result.alreadyReleased,
    });
  }

  if (parsed.data.paymentStatus) {
    if (current === "cancelado") {
      return NextResponse.json(
        { error: "La orden está cancelada; no se puede marcar como pagada." },
        { status: 400 }
      );
    }

    const nextStatus = parsed.data.paymentStatus;
    const markingPaid = nextStatus === "pagado" && current !== "pagado";
    const beforeData = snap.data()!;

    await ref.set(
      {
        paymentStatus: nextStatus,
        updatedAt: new Date(),
        ...(markingPaid
          ? {
              paidAt: new Date(),
              paidVia: "manual",
            }
          : {}),
      },
      { merge: true }
    );

    if (markingPaid) {
      try {
        const { sendOrderPaidEmail } = await import("@/lib/checkout/send-checkout-emails");
        await sendOrderPaidEmail({
          orderId: id,
          customerName: String(beforeData.customerName ?? ""),
          customerEmail: String(beforeData.customerEmail ?? ""),
          total: Number(beforeData.total ?? 0),
          items: Array.isArray(beforeData.items) ? beforeData.items : [],
        });
      } catch (err) {
        console.error("[admin/orders] paid email", err);
      }
    }

    return NextResponse.json(
      { ok: true, paymentStatus: nextStatus },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
