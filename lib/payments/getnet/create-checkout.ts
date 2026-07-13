import { getGetnetConfig, isGetnetConfigured } from "@/lib/payments/getnet/config";

type CreateGetnetInput = {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
};

type CreateGetnetResult = {
  checkoutUrl: string;
  providerOrderId: string;
};

/**
 * Crea una intención de pago Getnet (Web Checkout).
 * Requiere credenciales en env. Cuando falten, el checkout no ofrece Getnet.
 *
 * Nota: el endpoint exacto puede variar según el producto Getnet Argentina
 * contratado (SEP / Web Checkout). Ajustar paths cuando el cliente entregue docs.
 */
export async function createGetnetCheckout(
  input: CreateGetnetInput
): Promise<CreateGetnetResult> {
  if (!isGetnetConfigured()) {
    throw new Error("Getnet no configurado");
  }

  const config = getGetnetConfig();
  const amountCents = Math.round(input.amount * 100);

  const tokenRes = await fetch(`${config.baseUrl}/authentication/oauth2/access-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "oob",
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("[getnet] token error", text);
    throw new Error("No se pudo autenticar con Getnet");
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Getnet no devolvió access_token");
  }

  const orderRes = await fetch(`${config.baseUrl}/api/v2/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${tokenJson.access_token}`,
      seller_id: config.sellerId,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          currency: "032",
          reference: input.orderId,
          customer: {
            name: input.customerName,
            email: input.customerEmail,
          },
          items: [
            {
              id: 1,
              name: `Reserva Meru ${input.orderId}`,
              quantity: 1,
              unitPrice: {
                currency: "032",
                amount: amountCents,
              },
            },
          ],
        },
      },
    }),
  });

  if (!orderRes.ok) {
    const text = await orderRes.text();
    console.error("[getnet] order error", text);
    throw new Error("No se pudo crear el pago en Getnet");
  }

  const orderJson = (await orderRes.json()) as {
    data?: {
      id?: string;
      links?: { checkout?: string };
    };
  };

  const checkoutUrl = orderJson.data?.links?.checkout;
  const providerOrderId = orderJson.data?.id;

  if (!checkoutUrl || !providerOrderId) {
    console.error("[getnet] unexpected response", orderJson);
    throw new Error("Getnet no devolvió URL de checkout");
  }

  return { checkoutUrl, providerOrderId };
}
