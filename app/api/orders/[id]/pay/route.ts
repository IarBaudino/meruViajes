import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { createGetnetCheckout } from "@/lib/payments/getnet/create-checkout";
import { isGetnetConfigured } from "@/lib/payments/getnet/config";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Iniciá sesión para pagar" }, { status: 401 });
  }

  if (!isGetnetConfigured()) {
    return NextResponse.json(
      {
        error:
          "Getnet todavía no está configurado. Coordiná el pago con la agencia o contactanos.",
      },
      { status: 503 }
    );
  }

  const { id: orderId } = await params;
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const orderRef = db.collection("orders").doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const data = snap.data()!;
  if (data.userId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const paymentStatus = String(data.paymentStatus ?? "pendiente");
  if (paymentStatus === "pagado") {
    return NextResponse.json({ error: "Este pedido ya está pago." }, { status: 400 });
  }
  if (paymentStatus === "cancelado") {
    return NextResponse.json({ error: "Este pedido fue cancelado." }, { status: 400 });
  }

  const total = Number(data.total ?? 0);
  if (!(total > 0)) {
    return NextResponse.json({ error: "El total del pedido no es válido." }, { status: 400 });
  }

  try {
    const getnet = await createGetnetCheckout({
      orderId,
      amount: total,
      customerEmail: String(data.customerEmail ?? session.user.email ?? ""),
      customerName: String(data.customerName ?? session.user.name ?? ""),
    });

    await orderRef.set(
      {
        paymentMethod: "getnet",
        paymentInformation: getnet.providerOrderId,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      checkoutUrl: getnet.checkoutUrl,
      orderId,
    });
  } catch (error) {
    console.error("[orders/pay]", error);
    return NextResponse.json(
      { error: "No se pudo iniciar el pago. Intentá de nuevo." },
      { status: 502 }
    );
  }
}
