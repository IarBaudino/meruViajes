import { FieldValue, type DocumentData, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import { PACKAGES_COLLECTION } from "@/features/packages/lib/firestore-mapper";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { computeHoldExpiresAtDate } from "@/lib/checkout/hold-warning";
import type { DepartureSlot } from "@/types";

/** Calcula vencimiento del hold (máx. post-reserva y/o antes de la salida). */
export async function computeHoldExpiresAt(
  from: Date = new Date(),
  departureAt?: Date | null
): Promise<Date> {
  try {
    const settings = await getSiteSettings();
    return computeHoldExpiresAtDate(settings.booking, from, departureAt);
  } catch {
    const hours = Number(process.env.ORDER_HOLD_HOURS ?? "48");
    const safe = Number.isFinite(hours) && hours >= 24 ? Math.min(hours, 336) : 48;
    return new Date(from.getTime() + safe * 60 * 60 * 1000);
  }
}

export async function resolveOrderHoldHours(
  departureAt?: Date | null
): Promise<number> {
  const expires = await computeHoldExpiresAt(new Date(), departureAt);
  return Math.max(0, (expires.getTime() - Date.now()) / (1000 * 60 * 60));
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

  function addDelta(delta: StockDelta) {
    const key = delta.departureId
      ? `${delta.collection}:${delta.id}:dep:${delta.departureId}`
      : `${delta.collection}:${delta.id}`;
    const prev = map.get(key);
    map.set(key, {
      ...delta,
      quantity: (prev?.quantity ?? 0) + delta.quantity,
    });
  }

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
      addDelta({
        collection: "packages",
        id: packageId,
        quantity,
      });

      // Paquetes con armado manual no tocan cupos de excursiones.
      if (item.fulfillmentMode === "manual") continue;

      const included = item.includedDepartures;
      if (Array.isArray(included)) {
        for (const row of included) {
          if (!row || typeof row !== "object") continue;
          const r = row as Record<string, unknown>;
          const sid = typeof r.serviceId === "string" ? r.serviceId : "";
          const did = typeof r.departureId === "string" ? r.departureId : "";
          const qty = Math.max(0, Number(r.quantity) || quantity);
          if (!sid || !did) continue;
          addDelta({
            collection: "services",
            id: sid,
            quantity: qty,
            departureId: did,
          });
        }
      }
      continue;
    }

    if (serviceId) {
      addDelta({
        collection: "services",
        id: serviceId,
        quantity,
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

      // 1) Todas las lecturas primero (regla de transacciones Firestore).
      const stockReads: Array<{
        ref: DocumentReference;
        group: {
          collection: "services" | "packages";
          id: string;
          stockQty: number;
          departureQty: Map<string, number>;
        };
        snapData: DocumentData;
      }> = [];

      for (const group of byDoc.values()) {
        const collection =
          group.collection === "packages" ? PACKAGES_COLLECTION : "services";
        const ref = db.collection(collection).doc(group.id);
        const stockSnap = await tx.get(ref);
        if (!stockSnap.exists) continue;
        stockReads.push({ ref, group, snapData: stockSnap.data()! });
      }

      const bookingsSnap = await tx.get(
        db.collection("bookings").where("serviceOrderId", "==", orderId)
      );

      // 2) Escrituras
      for (const { ref, group, snapData } of stockReads) {
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
function parseFirestoreDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = Number((value as { seconds: unknown }).seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    const seconds = Number((value as { _seconds: unknown })._seconds);
    if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function releaseExpiredOrderHolds(db: Firestore): Promise<{
  checked: number;
  released: number;
  skipped: number;
  errors: string[];
  details: Array<{
    orderId: string;
    action: "released" | "already" | "skipped" | "error";
    holdExpiresAt: string | null;
    reason?: string;
  }>;
}> {
  const now = new Date();
  const snap = await db
    .collection("orders")
    .where("paymentStatus", "==", "pendiente")
    .limit(200)
    .get();

  let released = 0;
  let skipped = 0;
  const errors: string[] = [];
  const details: Array<{
    orderId: string;
    action: "released" | "already" | "skipped" | "error";
    holdExpiresAt: string | null;
    reason?: string;
  }> = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    let expiresAt = parseFirestoreDate(data.holdExpiresAt);

    // Órdenes viejas sin holdExpiresAt: usar createdAt + hold hours
    if (!expiresAt) {
      const createdAt = parseFirestoreDate(data.createdAt);
      if (createdAt) {
        expiresAt = await computeHoldExpiresAt(createdAt);
      }
    }

    const expiresIso = expiresAt ? expiresAt.toISOString() : null;

    if (!expiresAt) {
      skipped += 1;
      details.push({
        orderId: doc.id,
        action: "skipped",
        holdExpiresAt: null,
        reason: "sin holdExpiresAt ni createdAt",
      });
      continue;
    }

    if (expiresAt.getTime() > now.getTime()) {
      skipped += 1;
      details.push({
        orderId: doc.id,
        action: "skipped",
        holdExpiresAt: expiresIso,
        reason: "aún vigente",
      });
      continue;
    }

    const result = await cancelOrderAndReleaseStock(db, doc.id, "expired");
    if (result.ok) {
      if (!result.alreadyReleased) {
        released += 1;
        details.push({
          orderId: doc.id,
          action: "released",
          holdExpiresAt: expiresIso,
        });
        try {
          const { sendOrderCancelledEmail } = await import(
            "@/lib/checkout/send-checkout-emails"
          );
          await sendOrderCancelledEmail({
            orderId: doc.id,
            customerName: String(data.customerName ?? ""),
            customerEmail: String(data.customerEmail ?? ""),
            total: Number(data.total ?? 0),
            items: Array.isArray(data.items) ? data.items : [],
            reason: "expired",
          });
        } catch (err) {
          console.error("[release-expired] email", doc.id, err);
        }
      } else {
        details.push({
          orderId: doc.id,
          action: "already",
          holdExpiresAt: expiresIso,
        });
      }
    } else {
      errors.push(`${doc.id}: ${result.error}`);
      details.push({
        orderId: doc.id,
        action: "error",
        holdExpiresAt: expiresIso,
        reason: result.error,
      });
    }
  }

  return { checked: snap.docs.length, released, skipped, errors, details };
}
