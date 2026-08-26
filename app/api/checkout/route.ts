import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkoutSchema } from "@/schemas/checkout";
import { normalizeBilling } from "@/schemas/billing";
import { createCheckout } from "@/lib/checkout/create-checkout";
import { CheckoutError } from "@/lib/checkout/errors";
import { sendCheckoutEmails } from "@/lib/checkout/send-checkout-emails";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const paymentMethod = parsed.data.paymentMethod ?? "coordinar";
    if (paymentMethod !== "coordinar") {
      return NextResponse.json(
        { error: "Por ahora coordinamos el pago por WhatsApp." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;
    const billing = normalizeBilling(parsed.data.billing);

    const result = await createCheckout({
      items: parsed.data.items,
      billing,
      paymentMethod,
      userId,
    });

    const db = getAdminFirestore();
    if (db) {
      const orderSnap = await db.collection("orders").doc(result.orderId).get();
      const orderData = orderSnap.data();
      if (orderData?.items) {
        await sendCheckoutEmails({
          orderId: result.orderId,
          customerName: billing.fullName,
          customerEmail: billing.email,
          total: result.total,
          items: orderData.items,
          billing,
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      total: result.total,
      bookingIds: result.bookingIds,
      paymentMethod,
      paymentStatus: result.paymentStatus,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "No se pudo confirmar la reserva. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
