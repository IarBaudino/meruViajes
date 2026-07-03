import { formatCurrencyARS } from "@/lib/format";
import { getResend, isResendConfigured, resendDefaults } from "@/lib/resend";
import type { OrderItem } from "@/types";

type CheckoutEmailParams = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: OrderItem[];
};

export async function sendCheckoutEmails(params: CheckoutEmailParams): Promise<void> {
  if (!isResendConfigured()) return;

  const resend = getResend();
  if (!resend || !params.customerEmail) return;

  const itemsHtml = params.items
    .map(
      (item) =>
        `<li><strong>${item.serviceTitle}</strong> × ${item.quantity} — ${formatCurrencyARS(item.lineTotal)}</li>`
    )
    .join("");

  const orderRef = params.orderId.slice(0, 8).toUpperCase();

  await resend.emails.send({
    from: resendDefaults.from,
    to: params.customerEmail,
    subject: `Reserva recibida — Meru Viajes (#${orderRef})`,
    html: `
      <p>Hola ${params.customerName},</p>
      <p>Recibimos tu reserva. Te contactaremos para coordinar el pago y los detalles.</p>
      <p><strong>Nº de pedido:</strong> ${params.orderId}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${formatCurrencyARS(params.total)}</p>
      <p>Estado del pago: <strong>pendiente</strong></p>
      <p>Saludos,<br>Equipo Meru Viajes y Turismo<br>Ushuaia, Tierra del Fuego</p>
    `,
  });

  await resend.emails.send({
    from: resendDefaults.from,
    to: resendDefaults.to,
    subject: `[Meru] Nueva reserva de ${params.customerName}`,
    html: `
      <h2>Nueva reserva web</h2>
      <p><strong>Cliente:</strong> ${params.customerName} (${params.customerEmail})</p>
      <p><strong>Pedido:</strong> ${params.orderId}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${formatCurrencyARS(params.total)}</p>
    `,
  });
}
