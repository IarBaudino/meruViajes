import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { PACKAGES_COLLECTION } from "@/features/packages/lib/firestore-mapper";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";

function clampHoldHours(raw: number): number {
  if (!Number.isFinite(raw) || raw < 24) return 48;
  return Math.min(Math.floor(raw), 24 * 14);
}

/** Horas de hold: admin (Contenido web) → env ORDER_HOLD_HOURS → 48. */
export async function resolveOrderHoldHours(): Promise<number> {
  try {
    const settings = await getSiteSettings();
    const fromAdmin = settings.booking?.orderHoldHours;
    if (typeof fromAdmin === "number" && fromAdmin >= 1) {
      return clampHoldHours(fromAdmin);
    }
  } catch {
    // fallback abajo
  }

  const fromEnv = Number(process.env.ORDER_HOLD_HOURS ?? "48");
  return clampHoldHours(fromEnv);
}

export async function computeHoldExpiresAt(from: Date = new Date()): Promise<Date> {
  const hours = await resolveOrderHoldHours();
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

type StockDelta = { collection: "services" | "packages"; id: string; quantity: number };

function stockDeltasFromOrderItems(items: unknown): StockDelta[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, StockDelta>();

  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const quantity = Math.max(0, Number(item.quantity) || 0);
    if (quantity < 1) continue;

    const packageId =
      typeof item.packageId === "string" && item.packageId.trim()
        ? item.packageId.trim()
        : null;
    const serviceId =
      typeof item.serviceId === "string" && item.serviceId.trim()
        ? item.serviceId.trim()
        : null;

    if (packageId) {
      const key = `packages:${packageId}`;
      const prev = map.get(key);
      map.set(key, {
        collection: "packages",
        id: packageId,
        quantity: (prev?.quantity ?? 0) + quantity,
      });
      continue;
    }

    if (serviceId) {
      const key = `services:${serviceId}`;
      const prev = map.get(key);
      map.set(key, {
        collection: "services",
        id: serviceId,
        quantity: (prev?.quantity ?? 0) + quantity,
      });
    }
  }

  return Array.from(map.values());
}

export type ReleaseOrderResult =
  | { ok: true; alreadyReleased: boolean }
  | { ok: false; error: string; status: number };

/**
 * Cancela una orden pendiente y devuelve los cupos.
 * Idempotente: si ya estaba cancelada con stock liberado, no vuelve a sumar.
 */
export async function cancelOrderAndReleaseStock(
  db: Firestore,
  orderId: string,
  reason: "admin" | "expired" = "admin"
): Promise<ReleaseOrderResult> {
  const orderRef = db.collection("orders").doc(orderId);

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) {
        return { ok: false as const, error: "Orden no encontrada", status: 404 };
      }

      const data = snap.data()!;
      const paymentStatus = String(data.paymentStatus ?? "pendiente");

      if (paymentStatus === "pagado") {
        return {
          ok: false as const,
          error: "La orden ya está pagada; no se pueden liberar los cupos.",
          status: 400,
        };
      }

      if (paymentStatus === "cancelado" && data.stockReleased === true) {
        return { ok: true as const, alreadyReleased: true };
      }

      const deltas = stockDeltasFromOrderItems(data.items);

      for (const delta of deltas) {
        const collection =
          delta.collection === "packages" ? PACKAGES_COLLECTION : "services";
        const ref = db.collection(collection).doc(delta.id);
        const stockSnap = await tx.get(ref);
        if (!stockSnap.exists) continue;
        const current = Number(stockSnap.data()?.stock ?? 0);
        tx.update(ref, {
          stock: current + delta.quantity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const bookingsSnap = await tx.get(
        db.collection("bookings").where("serviceOrderId", "==", orderId)
      );
      for (const bookingDoc of bookingsSnap.docs) {
        tx.update(bookingDoc.ref, {
          active: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      tx.set(
        orderRef,
        {
          paymentStatus: "cancelado",
          stockReleased: true,
          cancelledAt: FieldValue.serverTimestamp(),
          cancelReason: reason,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { ok: true as const, alreadyReleased: false };
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo cancelar la orden";
    return { ok: false, error: message, status: 500 };
  }
}

/**
 * Cancela órdenes pendientes cuyo holdExpiresAt ya pasó.
 */
export async function releaseExpiredOrderHolds(db: Firestore): Promise<{
  checked: number;
  released: number;
  errors: string[];
}> {
  const now = new Date();
  const snap = await db
    .collection("orders")
    .where("paymentStatus", "==", "pendiente")
    .limit(100)
    .get();

  let released = 0;
  const errors: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const expiresRaw = data.holdExpiresAt;
    let expiresAt: Date | null = null;
    if (
      expiresRaw &&
      typeof expiresRaw === "object" &&
      "toDate" in expiresRaw &&
      typeof (expiresRaw as { toDate: () => Date }).toDate === "function"
    ) {
      expiresAt = (expiresRaw as { toDate: () => Date }).toDate();
    } else if (expiresRaw instanceof Date) {
      expiresAt = expiresRaw;
    } else if (typeof expiresRaw === "string") {
      const parsed = new Date(expiresRaw);
      if (!Number.isNaN(parsed.getTime())) expiresAt = parsed;
    }

    // Órdenes viejas sin holdExpiresAt: usar createdAt + hold hours
    if (!expiresAt) {
      const created = data.createdAt;
      let createdAt: Date | null = null;
      if (
        created &&
        typeof created === "object" &&
        "toDate" in created &&
        typeof (created as { toDate: () => Date }).toDate === "function"
      ) {
        createdAt = (created as { toDate: () => Date }).toDate();
      }
      if (createdAt) {
        expiresAt = await computeHoldExpiresAt(createdAt);
      }
    }

    if (!expiresAt || expiresAt > now) continue;

    const result = await cancelOrderAndReleaseStock(db, doc.id, "expired");
    if (result.ok) {
      if (!result.alreadyReleased) released += 1;
    } else {
      errors.push(`${doc.id}: ${result.error}`);
    }
  }

  return { checked: snap.docs.length, released, errors };
}
