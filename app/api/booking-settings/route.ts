import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  resolveActiveHoldHours,
  resolveHoldWarningMessage,
} from "@/lib/checkout/hold-warning";

/** Datos públicos de plazo/advertencia para el carrito. */
export async function GET() {
  const settings = await getSiteSettings();
  const activeHoldHours = resolveActiveHoldHours(settings.booking);
  return NextResponse.json({
    activeHoldHours,
    shortHoldEnabled: Boolean(settings.booking?.shortHoldEnabled),
    warningMessage: resolveHoldWarningMessage(settings.booking, activeHoldHours),
  });
}
