export type CheckoutPaymentMethod = "transfer" | "mercadopago";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export function getMercadoPagoAccessToken() {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? "";
}

export function paymentMethodLabel(method?: string | null) {
  if (method === "mercadopago") return "Mercado Pago";
  if (method === "transfer" || method === "coordinar") return "Transferencia";
  if (method === "getnet") return "Getnet";
  return method?.trim() || "—";
}
