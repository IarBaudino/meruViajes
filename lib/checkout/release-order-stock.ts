import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { PACKAGES_COLLECTION } from "@/features/packages/lib/firestore-mapper";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { resolveActiveHoldHours } from "@/lib/checkout/hold-warning";
import type { DepartureSlot } from "@/types";

/** Horas de hold vigentes (plazo normal, corto forzado, o corto por cercanía a la salida). */
export async function resolveOrderHoldHours(
  departureAt?: Date | null
): Promise<number> {
  try {
    const settings = await getSiteSettings();
    return resolveActiveHoldHours(settings.booking, departureAt);
  } catch {
    // fallback abajo
  }

  const fromEnv = Number(process.env.ORDER_HOLD_HOURS ?? "48");
  if (Number.isFinite(fromEnv) && fromEnv >= 24) {
    return Math.min(Math.floor(fromEnv), 336);
  }
  return 48;
}

export async function computeHoldExpiresAt(
  from: Date = new Date(),
  departureAt?: Date | null
): Promise<Date> {
  const hours = await resolveOrderHoldHours(departureAt);
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

type StockDelta = {
  collection: "services" | "packages";
  id: string;
  quantity: number;
  departureId?: string;
};

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
    const departureId =
      typeof item.departureId === "string" && item.departureId.trim()
        ? item.departureId.trim()
        : undefined;

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
      const key = departureId
        ? `services:${serviceId}:dep:${departureId}`
        : `services:${serviceId}`;
      const prev = map.get(key);
      map.set(key, {
        collection: "services",
        id: serviceId,
        quantity: (prev?.quantity ?? 0) + quantity,
        departureId,
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

      // Agrupar por documento para no pisar actualizaciones de varios turnos.
      const byDoc = new Map<
        string,
        { collection: "services" | "packages"; id: string; stockQty: number; departureQty: Map<string, number> }
      >();

      for (const delta of deltas) {
        const key = `${delta.collection}:${delta.id}`;
        const prev = byDoc.get(key) ?? {
          collection: delta.collection,
          id: delta.id,
          stockQty: 0,
          departureQty: new Map<string, number>(),
        };
        if (delta.departureId) {
          prev.departureQty.set(
            delta.departureId,
            (prev.departureQty.get(delta.departureId) ?? 0) + delta.quantity
          );
        } else {
          prev.stockQty += delta.quantity;
        }
        byDoc.set(key, prev);
      }

      for (const group of byDoc.values()) {
        const collection =
          group.collection === "packages" ? PACKAGES_COLLECTION : "services";
        const ref = db.collection(collection).doc(group.id);
        const stockSnap = await tx.get(ref);
        if (!stockSnap.exists) continue;
        const snapData = stockSnap.data()!;

        const patch: Record<string, unknown> = {
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (group.departureQty.size > 0) {
          const departures = Array.isArray(snapData.departures)
            ? (snapData.departures as DepartureSlot[]).map((d) => ({ ...d }))
            : [];
          for (const [departureId, qty] of group.departureQty) {
            const idx = departures.findIndex((d) => d.id === departureId);
            if (idx >= 0) {
              departures[idx] = {
                ...departures[idx],
                booked: Math.max(0, Number(departures[idx].booked || 0) - qty),
              };
            }
          }
          patch.departures = departures;
        }

        if (group.stockQty > 0) {
          patch.stock = Number(snapData.stock ?? 0) + group.stockQty;
        }

        tx.update(ref, patch);
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
