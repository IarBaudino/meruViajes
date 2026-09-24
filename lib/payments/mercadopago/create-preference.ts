import { brand, getAppUrl } from "@/config/brand";
import { getMercadoPagoAccessToken, isMercadoPagoConfigured } from "@/lib/payments/methods";

type CreatePreferenceInput = {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  title?: string;
};

type CreatePreferenceResult = {
  checkoutUrl: string;
  preferenceId: string;
};

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<CreatePreferenceResult> {
  if (!isMercadoPagoConfigured()) {
    throw new Error("Mercado Pago no configurado");
  }

  const appUrl = getAppUrl();
  const successUrl = `${appUrl}/checkout/exito?orderId=${encodeURIComponent(input.orderId)}`;
  const pendingUrl = successUrl;
  const failureUrl = `${appUrl}/carrito`;

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title || `Reserva ${brand.shortName}`,
          quantity: 1,
          unit_price: Math.round(input.amount),
          currency_id: "ARS",
        },
      ],
      payer: {
        name: input.customerName,
        email: input.customerEmail,
      },
      external_reference: input.orderId,
      metadata: { orderId: input.orderId },
      notification_url: `${appUrl}/api/payments/mercadopago/webhook`,
      back_urls: {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl,
      },
      auto_return: "approved",
      statement_descriptor: brand.shortName.slice(0, 22),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[mercadopago] preference error", text);
    throw new Error("No se pudo crear el pago en Mercado Pago");
  }

  const json = (await res.json()) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  const checkoutUrl = json.init_point || json.sandbox_init_point;
  if (!checkoutUrl || !json.id) {
    console.error("[mercadopago] unexpected response", json);
    throw new Error("Mercado Pago no devolvió URL de pago");
  }

  return { checkoutUrl, preferenceId: json.id };
}
