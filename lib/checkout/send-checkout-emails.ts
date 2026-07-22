import { formatCurrencyARS } from "@/lib/format";
import { getResend, isResendConfigured, resendDefaults } from "@/lib/resend";
import {
  formatPassengersSummary,
  normalizeCartPassengers,
} from "@/features/excursions/lib/pricing";
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar";
  const logoUrl = `${appUrl.replace(/\/$/, "")}/logo.png`;
  const logoHtml = `<img src="${logoUrl}" alt="Meru Viajes y Turismo" width="120" style="display:block;margin:0 0 20px 0" />`;

  const itemsHtml = params.items
    .map((item) => {
      const normalized = normalizeCartPassengers(item.passengers);
      const summary = normalized ? formatPassengersSummary(normalized) : "";
      const passengers = summary
        ? `<br><small>${summary}</small>`
        : "";
      return `<li><strong>${item.serviceTitle}</strong> × ${item.quantity} — ${formatCurrencyARS(item.lineTotal)}${passengers}</li>`;
    })
    .join("");


  const orderRef = params.orderId.slice(0, 8).toUpperCase();

  await resend.emails.send({
    from: resendDefaults.from,
    to: params.customerEmail,
    subject: `Reserva recibida — Meru Viajes (#${orderRef})`,
    html: `
      ${logoHtml}
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
      ${logoHtml}
      <h2>Nueva reserva web</h2>
      <p><strong>Cliente:</strong> ${params.customerName} (${params.customerEmail})</p>
      <p><strong>Pedido:</strong> ${params.orderId}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${formatCurrencyARS(params.total)}</p>
    `,
  });
}

type CancelEmailParams = CheckoutEmailParams & {
  reason: "admin" | "expired";
};

export async function sendOrderCancelledEmail(params: CancelEmailParams): Promise<void> {
  if (!isResendConfigured()) return;

  const resend = getResend();
  if (!resend || !params.customerEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar";
  const logoUrl = `${appUrl.replace(/\/$/, "")}/logo.png`;
  const logoHtml = `<img src="${logoUrl}" alt="Meru Viajes y Turismo" width="120" style="display:block;margin:0 0 20px 0" />`;
  const orderRef = params.orderId.slice(0, 8).toUpperCase();

  const reasonText =
    params.reason === "expired"
      ? "el plazo para confirmar el pago venció y el cupo se liberó"
      : "la agencia canceló la reserva y liberó el cupo";

  const itemsHtml = params.items
    .map((item) => {
      const departure =
        item.departureDate && item.departureTime
          ? ` · ${item.departureDate} ${item.departureTime}`
          : "";
      return `<li><strong>${item.serviceTitle}</strong> × ${item.quantity}${departure}</li>`;
    })
    .join("");

  await resend.emails.send({
    from: resendDefaults.from,
    to: params.customerEmail,
    subject: `Reserva cancelada — Meru Viajes (#${orderRef})`,
    html: `
      ${logoHtml}
      <p>Hola ${params.customerName},</p>
      <p>Te avisamos que tu reserva <strong>#${orderRef}</strong> fue <strong>cancelada</strong>: ${reasonText}.</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${formatCurrencyARS(params.total)}</p>
      <p>Podés volver a reservar desde el sitio cuando quieras.</p>
      <p>Saludos,<br>Equipo Meru Viajes y Turismo<br>Ushuaia, Tierra del Fuego</p>
    `,
  });
}
