import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import type { CheckoutItemInput } from "@/schemas/checkout";
import { CheckoutError } from "@/lib/checkout/errors";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { OrderItem, PaymentStatus } from "@/types";
import { PACKAGES_COLLECTION } from "@/features/packages/lib/firestore-mapper";

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
};

type StockUpdate = {
  ref: DocumentReference;
  nextStock: number;
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

  return db.runTransaction(async (tx) => {
    const orderItems: OrderLine[] = [];
    const bookingDrafts: BookingDraft[] = [];
    const stockUpdates: StockUpdate[] = [];

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

        const pkg = packageSnap.data()!;
        const title = String(pkg.title ?? "Paquete");
        const stock = Number(pkg.stock ?? 0);

        if (pkg.active !== true) {
          throw new CheckoutError(`"${title}" ya no está publicado.`, 400);
        }
        if (stock <= 0) {
          throw new CheckoutError(`"${title}" no tiene cupos disponibles.`, 409);
        }
        if (item.quantity > stock) {
          throw new CheckoutError(
            `Solo quedan ${stock} cupo${stock === 1 ? "" : "s"} para "${title}".`,
            409
          );
        }

        const unitPrice = Number(pkg.price ?? 0);
        if (unitPrice <= 0) {
          throw new CheckoutError(`"${title}" no tiene precio configurado.`, 400);
        }

        const serviceIds = Array.isArray(pkg.serviceIds)
          ? pkg.serviceIds.filter((id: unknown): id is string => typeof id === "string")
          : [];

        if (serviceIds.length === 0) {
          throw new CheckoutError(`"${title}" no tiene excursiones asociadas.`, 400);
        }

        const includedTitles: { id: string; title: string }[] = [];
        for (const serviceId of serviceIds) {
          const serviceSnap = await tx.get(db.collection("services").doc(serviceId));
          includedTitles.push({
            id: serviceId,
            title: serviceSnap.exists
              ? String(serviceSnap.data()?.title ?? "Excursión")
              : "Excursión",
          });
        }

        orderItems.push({
          serviceId: packageId,
          serviceTitle: title,
          slug: String(pkg.slug ?? ""),
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
          packageId,
          packageTitle: title,
        });

        for (const included of includedTitles) {
          bookingDrafts.push({
            serviceId: included.id,
            serviceTitle: `${title} → ${included.title}`,
            quantity: item.quantity,
            unitPrice: 0,
            lineTotal: 0,
            packageId,
          });
        }

        stockUpdates.push({ ref: packageRef, nextStock: stock - item.quantity });
        continue;
      }

      const serviceRef = db.collection("services").doc(item.serviceId);
      const serviceSnap = await tx.get(serviceRef);

      if (!serviceSnap.exists) {
        throw new CheckoutError("Una de las excursiones ya no está disponible.", 404);
      }

      const data = serviceSnap.data()!;
      const title = String(data.title ?? "Excursión");
      const stock = Number(data.stock ?? 0);

      if (data.active !== true) {
        throw new CheckoutError(`"${title}" ya no está publicada.`, 400);
      }
      if (stock <= 0) {
        throw new CheckoutError(`"${title}" no tiene cupos disponibles.`, 409);
      }
      if (item.quantity > stock) {
        throw new CheckoutError(
          `Solo quedan ${stock} cupo${stock === 1 ? "" : "s"} para "${title}".`,
          409
        );
      }

      const unitPrice = Number(data.price ?? 0);
      if (unitPrice <= 0) {
        throw new CheckoutError(`"${title}" no tiene precio configurado.`, 400);
      }

      orderItems.push({
        serviceId: item.serviceId,
        serviceTitle: title,
        slug: String(data.slug ?? ""),
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      });

      bookingDrafts.push({
        serviceId: item.serviceId,
        serviceTitle: title,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      });

      stockUpdates.push({ ref: serviceRef, nextStock: stock - item.quantity });
    }

    // 2) Escrituras
    for (const update of stockUpdates) {
      tx.update(update.ref, {
        stock: update.nextStock,
        updatedAt: FieldValue.serverTimestamp(),
      });
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
