import { NextResponse } from "next/server";
import { getMercadoPagoAccessToken, isMercadoPagoConfigured } from "@/lib/payments/methods";
import { markOrderPaid } from "@/lib/payments/mark-order-paid";

async function fetchPayment(paymentId: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getMercadoPagoAccessToken()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[mercadopago webhook] payment fetch", text);
    return null;
  }
  return (await res.json()) as {
    status?: string;
    external_reference?: string;
  };
}

export async function POST(request: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 503 });
  }

  const url = new URL(request.url);
  let paymentId =
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    "";
  const topic = url.searchParams.get("topic") || url.searchParams.get("type") || "";

  try {
    const raw = await request.text();
    if (raw) {
      const body = JSON.parse(raw) as {
        type?: string;
        action?: string;
        data?: { id?: string | number };
      };
      if (body.data?.id) paymentId = String(body.data.id);
      if (!topic && body.type) {
        /* type = payment */
      }
    }
  } catch {
    // query-only IPN
  }

  if (!paymentId || (topic && topic !== "payment" && topic !== "merchant_order")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (topic === "merchant_order") {
    return NextResponse.json({ ok: true });
  }

  const payment = await fetchPayment(paymentId);
  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  const orderId = payment.external_reference?.trim();
  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (payment.status === "approved") {
    const result = await markOrderPaid(orderId, "mercadopago");
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return POST(request);
}
