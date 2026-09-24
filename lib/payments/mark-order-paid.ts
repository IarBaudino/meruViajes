import { getAdminFirestore } from "@/lib/firebase/admin";
import { generateServiceOrderNumber } from "@/lib/checkout/service-order";
import { sendOrderPaidEmail } from "@/lib/checkout/send-checkout-emails";

export async function markOrderPaid(orderId: string, paidVia: string) {
  const db = getAdminFirestore();
  if (!db) return { ok: false as const, error: "Servidor no configurado" };

  const orderRef = db.collection("orders").doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) return { ok: false as const, error: "Orden no encontrada" };

  const data = snap.data()!;
  if (data.paymentStatus === "pagado") {
    return { ok: true as const, alreadyPaid: true };
  }

  const serviceOrderNumber =
    String(data.serviceOrderNumber ?? "").trim() || generateServiceOrderNumber(orderId);
  const paidAt = new Date();

  await orderRef.set(
    {
      paymentStatus: "pagado",
      paidAt,
      paidVia,
      paymentMethod: paidVia,
      serviceOrderNumber,
      serviceOrderGeneratedAt: paidAt,
      updatedAt: paidAt,
    },
    { merge: true }
  );

  try {
    await sendOrderPaidEmail({
      orderId,
      customerName: String(data.customerName ?? ""),
      customerEmail: String(data.customerEmail ?? ""),
      total: Number(data.total ?? 0),
      items: Array.isArray(data.items) ? data.items : [],
      billing: data.billing ?? null,
      serviceOrderNumber,
    });
  } catch (err) {
    console.error("[markOrderPaid] email", err);
  }

  return { ok: true as const, alreadyPaid: false };
}
