import type { CartItem } from "@/types";
import { formatCurrencyARS } from "@/lib/format";
import { formatDepartureLabel } from "@/features/excursions/lib/departures";
import {
  formatPassengersSummary,
  normalizeCartPassengers,
} from "@/features/excursions/lib/pricing";

/** Número de WhatsApp de la agencia (E.164 sin +). */
export const MERU_WHATSAPP_NUMBER = "5492901588864";

export type WhatsAppOrderLine = {
  title: string;
  quantity?: number;
  lineTotal?: number;
  departureDate?: string;
  departureTime?: string;
  stayFrom?: string;
  stayTo?: string;
  passengersSummary?: string;
  isPackage?: boolean;
};

export function whatsappHref(text: string) {
  return `https://wa.me/${MERU_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function formatStay(from?: string, to?: string) {
  if (!from || !to) return "";
  return `estadía ${from.split("-").reverse().join("/")} → ${to.split("-").reverse().join("/")}`;
}

function formatCartLine(item: CartItem): WhatsAppOrderLine {
  const isPackage = item.kind === "package";
  const passengers = item.passengers
    ? formatPassengersSummary(
        normalizeCartPassengers(item.passengers) ?? {
          adult: item.quantity,
          infant: 0,
          discounted: [],
        }
      )
    : "";

  return {
    title: item.title,
    quantity: item.quantity,
    lineTotal: item.lineTotal ?? item.price * item.quantity,
    departureDate: item.departureDate,
    departureTime: item.departureTime,
    stayFrom: item.stayFrom,
    stayTo: item.stayTo,
    passengersSummary: passengers,
    isPackage,
  };
}

function formatLineText(line: WhatsAppOrderLine) {
  const bits: string[] = [line.isPackage ? `Paquete: ${line.title}` : line.title];

  if (line.stayFrom && line.stayTo) {
    bits.push(formatStay(line.stayFrom, line.stayTo));
  } else if (line.departureDate && line.departureTime) {
    bits.push(
      formatDepartureLabel({
        date: line.departureDate,
        time: line.departureTime,
      })
    );
  }

  if (line.passengersSummary) {
    bits.push(line.passengersSummary);
  } else if (line.quantity) {
    bits.push(`${line.quantity} pasajero${line.quantity === 1 ? "" : "s"}`);
  }

  if (typeof line.lineTotal === "number") {
    bits.push(formatCurrencyARS(line.lineTotal));
  }

  return `• ${bits.join(" · ")}`;
}

export function buildCartWhatsAppMessage(input: {
  items: CartItem[];
  total: number;
  orderId?: string | null;
}) {
  const lines = input.items.map((item) => formatLineText(formatCartLine(item)));
  const orderLine = input.orderId
    ? `\nPedido: #${input.orderId.slice(0, 8).toUpperCase()}`
    : "";

  return [
    "Hola, quiero proceder al pago de mi reserva en Meru Viajes.",
    "",
    ...lines,
    "",
    `Total: ${formatCurrencyARS(input.total)}${orderLine}`,
  ].join("\n");
}

export function buildOrderWhatsAppMessage(input: {
  orderId: string;
  total: number;
  items: WhatsAppOrderLine[];
}) {
  const lines = input.items.map((item) => formatLineText(item));
  return [
    "Hola, quiero proceder al pago de mi reserva en Meru Viajes.",
    "",
    ...lines,
    "",
    `Total: ${formatCurrencyARS(input.total)}`,
    `Pedido: #${input.orderId.slice(0, 8).toUpperCase()}`,
  ].join("\n");
}

export function cartWhatsAppHref(input: {
  items: CartItem[];
  total: number;
  orderId?: string | null;
}) {
  return whatsappHref(buildCartWhatsAppMessage(input));
}

export function orderWhatsAppHref(input: {
  orderId: string;
  total: number;
  items: WhatsAppOrderLine[];
}) {
  return whatsappHref(buildOrderWhatsAppMessage(input));
}
