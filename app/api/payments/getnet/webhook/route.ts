import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getGetnetConfig } from "@/lib/payments/getnet/config";
import { sendCheckoutEmails } from "@/lib/checkout/send-checkout-emails";

/**
 * Webhook Getnet — marca la orden como pagada.
 * Validación de firma: ajustar según el doc oficial del cliente.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  let body: Record<string, unknown>;

  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const config = getGetnetConfig();
  const headerSecret = request.headers.get("x-getnet-secret") ?? "";
  if (config.webhookSecret && headerSecret !== config.webhookSecret) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const reference =
    (typeof body.reference === "string" && body.reference) ||
    (typeof body.orderId === "string" && body.orderId) ||
    (typeof (body.data as { attributes?: { reference?: string } } | undefined)?.attributes
      ?.reference === "string"
      ? (body.data as { attributes: { reference: string } }).attributes.reference
      : null);

  const statusRaw =
    (typeof body.status === "string" && body.status) ||
    (typeof (body.data as { attributes?: { status?: string } } | undefined)?.attributes
      ?.status === "string"
      ? (body.data as { attributes: { status: string } }).attributes.status
      : "");

  const paid =
    statusRaw.toLowerCase() === "paid" ||
    statusRaw.toLowerCase() === "approved" ||
    statusRaw.toLowerCase() === "aprobado";

  if (!reference) {
    return NextResponse.json({ error: "Sin reference/orderId" }, { status: 400 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const orderRef = db.collection("orders").doc(reference);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (paid) {
    const data = orderSnap.data()!;
    if (data.paymentStatus !== "pagado") {
      await orderRef.set(
        {
          paymentStatus: "pagado",
          updatedAt: new Date(),
        },
        { merge: true }
      );

      try {
        await sendCheckoutEmails({
          orderId: reference,
          customerName: String(data.customerName ?? ""),
          customerEmail: String(data.customerEmail ?? ""),
          total: Number(data.total ?? 0),
          items: data.items ?? [],
        });
      } catch (err) {
        console.error("[getnet webhook] email", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
