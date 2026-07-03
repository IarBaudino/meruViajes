import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkoutSchema } from "@/schemas/checkout";
import { createCheckout } from "@/lib/checkout/create-checkout";
import { CheckoutError } from "@/lib/checkout/errors";
import { sendCheckoutEmails } from "@/lib/checkout/send-checkout-emails";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Iniciá sesión para confirmar la reserva" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Carrito inválido" },
        { status: 400 }
      );
    }

    const result = await createCheckout(session.user.id, parsed.data.items);

    const db = getAdminFirestore();
    if (db) {
      const orderSnap = await db.collection("orders").doc(result.orderId).get();
      const orderData = orderSnap.data();
      if (orderData?.items) {
        await sendCheckoutEmails({
          orderId: result.orderId,
          customerName: String(orderData.customerName ?? session.user.name ?? ""),
          customerEmail: String(orderData.customerEmail ?? session.user.email ?? ""),
          total: result.total,
          items: orderData.items,
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      total: result.total,
      bookingIds: result.bookingIds,
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
