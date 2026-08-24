import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import type { CheckoutItemInput } from "@/schemas/checkout";
import { CheckoutError } from "@/lib/checkout/errors";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { DepartureSlot, OrderItem, PaymentStatus, CatalogSeason } from "@/types";
import { resolveServiceForSeason } from "@/lib/seasons";
import { PACKAGES_COLLECTION, mapFirestorePackage } from "@/features/packages/lib/firestore-mapper";
import { getEffectivePackagePrice } from "@/features/packages/lib/pricing";
import { mapFirestoreService } from "@/features/excursions/lib/firestore-mapper";
import {
  computePassengersLineTotalFromService,
  getEffectiveAdultPrice,
  normalizeCartPassengers,
  totalPassengers,
  type CartPassengers,
} from "@/features/excursions/lib/pricing";
import {
  parseDepartureDateTime,
  serviceUsesDepartures,
  slotRemaining,
} from "@/features/excursions/lib/departures";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { computeHoldExpiresAtDate } from "@/lib/checkout/hold-warning";

export type CheckoutResult = {
  orderId: string;
  total: number;
  bookingIds: string[];
  paymentMethod: "coordinar" | "getnet";
  paymentStatus: PaymentStatus;
};

type PaymentMethod = "coordinar" | "getnet";

type OrderLine = OrderItem;
type BookingDraft = {
  serviceId: string;
  serviceTitle: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  packageId?: string;
  passengers?: CartPassengers;
  departureId?: string;
  departureDate?: string;
  departureTime?: string;
};

type StockUpdate =
  | { kind: "stock"; ref: DocumentReference; nextStock: number }
  | {
      kind: "departures";
      ref: DocumentReference;
      departures: DepartureSlot[];
      catalogSeason?: CatalogSeason;
    };

function requireProfileFields(profile: {
  name?: string;
  dni?: string;
  phone?: string;
}): void {
  if (!profile.name?.trim()) {
    throw new CheckoutError("Completá tu nombre en Mi perfil antes de reservar.", 400);
  }
  if (!profile.dni?.trim() || profile.dni.trim().length < 6) {
    throw new CheckoutError("Completá tu DNI o pasaporte en Mi perfil antes de reservar.", 400);
  }
  if (!profile.phone?.trim() || profile.phone.trim().length < 6) {
    throw new CheckoutError("Completá tu teléfono en Mi perfil antes de reservar.", 400);
  }
}

export async function createCheckout(
  userId: string,
  items: CheckoutItemInput[],
  paymentMethod: PaymentMethod = "coordinar"
): Promise<CheckoutResult> {
  const db = getAdminFirestore();
  if (!db) {
    throw new CheckoutError("Servidor no configurado", 503);
  }

  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    throw new CheckoutError("Perfil de usuario no encontrado", 404);
  }

  const userData = userSnap.data()!;
  requireProfileFields({
    name: userData.name,
    dni: userData.dni,
    phone: userData.phone,
  });

  const customerDni = String(userData.dni).trim();
  const customerName = String(userData.name).trim();
  const customerEmail = String(userData.email ?? "").trim();
  const customerPhone = String(userData.phone).trim();
  const paymentStatus: PaymentStatus = "pendiente";

  let earliestDeparture: Date | null = null;
  for (const item of items) {
    const candidates: Array<{ date: string; time: string }> = [];
    if ((item.kind ?? "service") === "package" && item.stayFrom) {
      candidates.push({ date: item.stayFrom, time: "09:00" });
    } else if (item.departureDate && item.departureTime) {
      candidates.push({ date: item.departureDate, time: item.departureTime });
    }
    for (const slot of candidates) {
      const dt = parseDepartureDateTime(slot);
      if (dt && (!earliestDeparture || dt < earliestDeparture)) {
        earliestDeparture = dt;
      }
    }
  }
  const bookingSettings = (await getSiteSettings()).booking;
  const holdExpiresAt = computeHoldExpiresAtDate(
    bookingSettings,
    new Date(),
    earliestDeparture
  );
  if (earliestDeparture && holdExpiresAt.getTime() <= Date.now()) {
    throw new CheckoutError(
      "Esa salida está demasiado cerca: ya no se puede reservar sin pago a tiempo. Elegí otra fecha u hora.",
      400
    );
  }

  return db.runTransaction(async (tx) => {
    const orderItems: OrderLine[] = [];
    const bookingDrafts: BookingDraft[] = [];
    const stockUpdates: StockUpdate[] = [];
    /** Acumula cambios de turnos por serviceId + temporada dentro de la misma tx. */
    const pendingDepartures = new Map<string, { departures: DepartureSlot[]; catalogSeason?: CatalogSeason }>();

    // 1) Todas las lecturas primero (regla de transacciones Firestore).
    for (const item of items) {
      const kind = item.kind ?? "service";

      if (kind === "package") {
        const packageId = item.packageId ?? item.serviceId;
        const packageRef = db.collection(PACKAGES_COLLECTION).doc(packageId);
        const packageSnap = await tx.get(packageRef);

        if (!packageSnap.exists) {
          throw new CheckoutError("Uno de los paquetes ya no está disponible.", 404);
        }

        const pkg = mapFirestorePackage(packageId, packageSnap.data()!);
        const title = pkg.title || "Paquete";
        const stock = pkg.stock;

        if (!pkg.active) {
          throw new CheckoutError(`"${title}" ya no está publicado.`, 400);
        }
        if (!item.stayFrom || !item.stayTo) {
          throw new CheckoutError(
            `Indicá el rango de fechas para el paquete "${title}".`,
            400
          );
        }
        if (item.stayTo < item.stayFrom) {
          throw new CheckoutError(
            `El rango de fechas del paquete "${title}" no es válido.`,
            400
          );
        }

        const serviceIds = pkg.serviceIds;

        if (serviceIds.length === 0) {
          throw new CheckoutError(`"${title}" no tiene excursiones asociadas.`, 400);
        }

        const includedServices: Array<{
          serviceId: string;
          title: string;
          slug?: string;
          description?: string;
        }> = [];

        for (const serviceId of serviceIds) {
          const serviceRef = db.collection("services").doc(serviceId);
          const serviceSnap = await tx.get(serviceRef);
          if (!serviceSnap.exists) {
            throw new CheckoutError(
              `Una excursión del paquete "${title}" ya no está disponible.`,
              404
            );
          }
          const service = mapFirestoreService(serviceId, serviceSnap.data()!);
          includedServices.push({
            serviceId,
            title: service.title,
            slug: service.slug,
            description: service.description?.slice(0, 400) || undefined,
          });
        }

        if (stock > 0 && item.quantity > stock) {
          throw new CheckoutError(
            `Solo quedan ${stock} cupo${stock === 1 ? "" : "s"} para "${title}".`,
            409
          );
        }

        const unitPrice = getEffectivePackagePrice(pkg);
        if (unitPrice <= 0) {
          throw new CheckoutError(`"${title}" no tiene precio configurado.`, 400);
        }

        // No se tocan turnos/cupos de excursiones: el admin arma el itinerario a mano.
        orderItems.push({
          serviceId: packageId,
          serviceTitle: title,
          slug: pkg.slug,
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
          packageId,
          packageTitle: title,
          stayFrom: item.stayFrom,
          stayTo: item.stayTo,
          includedServices,
          fulfillmentMode: "manual",
        });

        bookingDrafts.push({
          serviceId: packageId,
          serviceTitle: title,
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
          packageId,
          departureDate: item.stayFrom,
          departureTime: "00:00",
        });

        if (stock > 0) {
          stockUpdates.push({
            kind: "stock",
            ref: packageRef,
            nextStock: stock - item.quantity,
          });
        }
        continue;
      }

      const serviceRef = db.collection("services").doc(item.serviceId);
      const serviceSnap = await tx.get(serviceRef);

      if (!serviceSnap.exists) {
        throw new CheckoutError("Una de las excursiones ya no está disponible.", 404);
      }

      const data = serviceSnap.data()!;
      const service = mapFirestoreService(item.serviceId, data);
      const catalogSeason = item.catalogSeason;
      const resolved = catalogSeason
        ? resolveServiceForSeason(service, catalogSeason)
        : service;
      const title = resolved.title || String(data.title ?? "Excursión");
      const usesDepartures = serviceUsesDepartures(resolved.departures);

      if (data.active !== true) {
        throw new CheckoutError(`"${title}" ya no está publicada.`, 400);
      }

      if (catalogSeason && !service.seasonalVariants?.[catalogSeason]?.enabled) {
        throw new CheckoutError(`"${title}" no está disponible en esa temporada.`, 400);
      }

      if (!item.passengers) {
        throw new CheckoutError(`Indicá pasajeros para "${title}".`, 400);
      }

      const passengers = normalizeCartPassengers(item.passengers);
      if (!passengers) {
        throw new CheckoutError(`Indicá pasajeros para "${title}".`, 400);
      }

      const seats = totalPassengers(passengers);
      if (seats < 1) {
        throw new CheckoutError(`Seleccioná al menos un pasajero para "${title}".`, 400);
      }

      if (!usesDepartures) {
        throw new CheckoutError(
          `"${title}" no tiene salidas cargadas. No se puede reservar sin fecha y hora.`,
          409
        );
      }

      if (!item.departureId) {
        throw new CheckoutError(`Elegí fecha y hora para "${title}".`, 400);
      }

      const pendingKey = `${item.serviceId}:${catalogSeason ?? "default"}`;
      const pending = pendingDepartures.get(pendingKey);
      const working =
        pending?.departures ??
        (resolved.departures ?? []).map((d) => ({ ...d }));
      const idx = working.findIndex((d) => d.id === item.departureId);
      if (idx < 0) {
        throw new CheckoutError(`El turno elegido para "${title}" ya no existe.`, 404);
      }

      const slot = working[idx];
      if (slot.active === false) {
        throw new CheckoutError(`El turno de "${title}" no está disponible.`, 400);
      }
      const remaining = slotRemaining(slot);
      if (remaining < 1 || seats > remaining) {
        throw new CheckoutError(
          `No contamos con esa cantidad de lugares para esa fecha y hora en "${title}". Probá con otra salida o menos pasajeros.`,
          409
        );
      }

      const slotAt = parseDepartureDateTime(slot);
      if (!slotAt || slotAt.getTime() <= Date.now()) {
        throw new CheckoutError(`El turno de "${title}" ya pasó o no es válido.`, 400);
      }
      if (
        computeHoldExpiresAtDate(bookingSettings, new Date(), slotAt).getTime() <= Date.now()
      ) {
        throw new CheckoutError(
          `El turno de "${title}" está demasiado cerca de la salida para reservarlo ahora.`,
          400
        );
      }

      working[idx] = {
        ...slot,
        booked: Number(slot.booked || 0) + seats,
      };
      pendingDepartures.set(pendingKey, { departures: working, catalogSeason });

      const departureId = slot.id;
      const departureDate = slot.date;
      const departureTime = slot.time;

      const unitPrice = getEffectiveAdultPrice(resolved);
      if (unitPrice <= 0) {
        throw new CheckoutError(`"${title}" no tiene precio configurado.`, 400);
      }

      const lineTotal = computePassengersLineTotalFromService(resolved, passengers);

      orderItems.push({
        serviceId: item.serviceId,
        serviceTitle: title,
        slug: String(data.slug ?? ""),
        quantity: seats,
        unitPrice,
        lineTotal,
        passengers,
        departureId,
        departureDate,
        departureTime,
        catalogSeason,
      });

      bookingDrafts.push({
        serviceId: item.serviceId,
        serviceTitle: title,
        quantity: seats,
        unitPrice,
        lineTotal,
        passengers,
        departureId,
        departureDate,
        departureTime,
      });
    }

    for (const [pendingKey, pending] of pendingDepartures) {
      const serviceId = pendingKey.split(":")[0];
      if (!serviceId) continue;
      stockUpdates.push({
        kind: "departures",
        ref: db.collection("services").doc(serviceId),
        departures: pending.departures,
        catalogSeason: pending.catalogSeason,
      });
    }

    // 2) Escrituras
    for (const update of stockUpdates) {
      if (update.kind === "stock") {
        tx.update(update.ref, {
          stock: update.nextStock,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        const patch: Record<string, unknown> = {
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (update.catalogSeason) {
          patch[`seasonalVariants.${update.catalogSeason}.departures`] = update.departures;
        } else {
          patch.departures = update.departures;
        }
        tx.update(update.ref, patch);
      }
    }

    const total = orderItems.reduce((sum, line) => sum + line.lineTotal, 0);
    const orderRef = db.collection("orders").doc();
    const now = FieldValue.serverTimestamp();

    tx.set(orderRef, {
      userId,
      orderDate: now,
      total,
      paymentStatus,
      paymentMethod,
      items: orderItems,
      customerName,
      customerEmail,
      customerDni,
      customerPhone,
      holdExpiresAt,
      stockReleased: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    const bookingIds: string[] = [];

    for (const draft of bookingDrafts) {
      const bookingRef = db.collection("bookings").doc();
      bookingIds.push(bookingRef.id);

      tx.set(bookingRef, {
        userId,
        serviceId: draft.serviceId,
        serviceTitle: draft.serviceTitle,
        serviceOrderId: orderRef.id,
        quantity: draft.quantity,
        unitPrice: draft.unitPrice,
        lineTotal: draft.lineTotal,
        packageId: draft.packageId ?? null,
        passengers: draft.passengers ?? null,
        departureId: draft.departureId ?? null,
        departureDate: draft.departureDate ?? null,
        departureTime: draft.departureTime ?? null,
        DNI_Personal: customerDni,
        bookingDate: now,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      orderId: orderRef.id,
      total,
      bookingIds,
      paymentMethod,
      paymentStatus,
    };
  });
}
