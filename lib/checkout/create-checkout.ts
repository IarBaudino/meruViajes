import { FieldValue } from "firebase-admin/firestore";
import type { CheckoutItemInput } from "@/schemas/checkout";
import { CheckoutError } from "@/lib/checkout/errors";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { OrderItem } from "@/types";

export type CheckoutResult = {
  orderId: string;
  total: number;
  bookingIds: string[];
};

type ResolvedLine = {
  serviceId: string;
  quantity: number;
  title: string;
  slug: string;
  unitPrice: number;
  lineTotal: number;
};

function mergeItems(items: CheckoutItemInput[]): CheckoutItemInput[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.serviceId, (map.get(item.serviceId) ?? 0) + item.quantity);
  }
  return Array.from(map.entries()).map(([serviceId, quantity]) => ({
    serviceId,
    quantity,
  }));
}

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
  items: CheckoutItemInput[]
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

  const mergedItems = mergeItems(items);
  const customerDni = String(userData.dni).trim();
  const customerName = String(userData.name).trim();
  const customerEmail = String(userData.email ?? "").trim();
  const customerPhone = String(userData.phone).trim();

  return db.runTransaction(async (tx) => {
    const lines: ResolvedLine[] = [];

    for (const item of mergedItems) {
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

      lines.push({
        serviceId: item.serviceId,
        quantity: item.quantity,
        title,
        slug: String(data.slug ?? ""),
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      });

      tx.update(serviceRef, {
        stock: stock - item.quantity,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const orderRef = db.collection("orders").doc();
    const now = FieldValue.serverTimestamp();

    const orderItems: OrderItem[] = lines.map((line) => ({
      serviceId: line.serviceId,
      serviceTitle: line.title,
      slug: line.slug,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    }));

    tx.set(orderRef, {
      userId,
      orderDate: now,
      total,
      paymentStatus: "pendiente",
      paymentMethod: "coordinar",
      items: orderItems,
      customerName,
      customerEmail,
      customerDni,
      customerPhone,
      createdAt: now,
      updatedAt: now,
    });

    const bookingIds: string[] = [];

    for (const line of lines) {
      const bookingRef = db.collection("bookings").doc();
      bookingIds.push(bookingRef.id);

      tx.set(bookingRef, {
        userId,
        serviceId: line.serviceId,
        serviceTitle: line.title,
        serviceOrderId: orderRef.id,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
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
    };
  });
}
