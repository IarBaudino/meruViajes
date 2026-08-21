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
        : item.fulfillmentMode === "manual" || item.packageId
          ? `<br><small>${item.quantity} pasajero${item.quantity === 1 ? "" : "s"}</small>`
          : "";
      const stay =
        item.stayFrom && item.stayTo
          ? `<br><small>Estadía: ${item.stayFrom} → ${item.stayTo}</small>`
          : "";
      const included =
        item.includedServices?.length
          ? `<br><small>Incluye: ${item.includedServices.map((s) => s.title).join(", ")}</small>`
          : "";
      const manual =
        item.fulfillmentMode === "manual"
          ? `<br><small><strong>Armado manual:</strong> itinerario + descuento de cupos a cargo de la agencia.</small>`
          : "";
      return `<li><strong>${item.serviceTitle}</strong> — ${formatCurrencyARS(item.lineTotal)}${passengers}${stay}${included}${manual}</li>`;
    })
    .join("");


  const orderRef = params.orderId.slice(0, 8).toUpperCase();
  const hasManualPackage = params.items.some((i) => i.fulfillmentMode === "manual");

  await resend.emails.send({
    from: resendDefaults.from,
    to: params.customerEmail,
    subject: `Reserva recibida — Meru Viajes (#${orderRef})`,
    html: `
      ${logoHtml}
      <p>Hola ${params.customerName},</p>
      <p>Recibimos tu reserva. El cupo quedó reservado con pago <strong>pendiente</strong>.</p>
      <p>Para abonar, escribinos por WhatsApp desde el carrito o respondé este mail. Cuando confirmemos el pago, te llega otro aviso y la reserva aparece en <strong>Mis reservas</strong>.</p>
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
    subject: `[Meru] Nueva reserva de ${params.customerName}${
      hasManualPackage ? " · PAQUETE MANUAL" : ""
    }`,
    html: `
      ${logoHtml}
      <h2>Nueva reserva web</h2>
      ${
        hasManualPackage
          ? `<p style="background:#fff7ed;border:1px solid #fdba74;padding:12px;border-radius:8px"><strong>Recordatorio:</strong> hay un paquete con armado manual. Armar itinerario, descontar cupos a mano y enviar detalle al cliente por privado.</p>`
          : ""
      }
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

function orderLogoHtml() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar";
  const logoUrl = `${appUrl.replace(/\/$/, "")}/logo.png`;
  return `<img src="${logoUrl}" alt="Meru Viajes y Turismo" width="120" style="display:block;margin:0 0 20px 0" />`;
}

function simpleItemsHtml(items: OrderItem[]) {
  return items
    .map((item) => {
      const departure =
        item.departureDate && item.departureTime
          ? ` · ${item.departureDate} ${item.departureTime}`
          : "";
      const stay =
        item.stayFrom && item.stayTo
          ? ` · Estadía: ${item.stayFrom} → ${item.stayTo}`
          : "";
      const pax =
        item.quantity > 0
          ? ` · ${item.quantity} pasajero${item.quantity === 1 ? "" : "s"}`
          : "";
      return `<li><strong>${item.serviceTitle}</strong>${pax}${departure}${stay}</li>`;
    })
    .join("");
}

/** Aviso al cliente (y copia a la agencia) cuando la reserva queda confirmada y abonada. */
export async function sendOrderPaidEmail(params: CheckoutEmailParams): Promise<void> {
  if (!isResendConfigured()) return;

  const resend = getResend();
  if (!resend || !params.customerEmail) return;

  const logoHtml = orderLogoHtml();
  const orderRef = params.orderId.slice(0, 8).toUpperCase();
  const itemsHtml = simpleItemsHtml(params.items);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar").replace(
    /\/$/,
    ""
  );

  await resend.emails.send({
    from: resendDefaults.from,
    to: params.customerEmail,
    subject: `Reserva confirmada y abonada — Meru Viajes (#${orderRef})`,
    html: `
      ${logoHtml}
      <p>Hola ${params.customerName},</p>
      <p>Tu reserva <strong>#${orderRef}</strong> ya está <strong>confirmada y abonada</strong>.</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total abonado:</strong> ${formatCurrencyARS(params.total)}</p>
      <p>Podés verla en <a href="${appUrl}/mi-cuenta/reservas">Mis reservas</a>.</p>
      <p>¡Gracias por elegirnos!<br>Equipo Meru Viajes y Turismo<br>Ushuaia, Tierra del Fuego</p>
    `,
  });

  await resend.emails.send({
    from: resendDefaults.from,
    to: resendDefaults.to,
    subject: `[Meru] Reserva pagada — ${params.customerName} (#${orderRef})`,
    html: `
      ${logoHtml}
      <h2>Reserva confirmada / pagada</h2>
      <p><strong>Cliente:</strong> ${params.customerName} (${params.customerEmail})</p>
      <p><strong>Pedido:</strong> ${params.orderId}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> ${formatCurrencyARS(params.total)}</p>
    `,
  });
}

export async function sendOrderCancelledEmail(params: CancelEmailParams): Promise<void> {
  if (!isResendConfigured()) return;

  const resend = getResend();
  if (!resend || !params.customerEmail) return;

  const logoHtml = orderLogoHtml();
  const orderRef = params.orderId.slice(0, 8).toUpperCase();

  const reasonText =
    params.reason === "expired"
      ? "el plazo para confirmar el pago venció y el cupo se liberó"
      : "la agencia canceló la reserva y liberó el cupo";

  const itemsHtml = simpleItemsHtml(params.items);

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
