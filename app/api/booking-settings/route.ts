import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import {
  hoursBeforeDeparture,
  maxHoldHoursAfterBooking,
  resolveHoldWarningMessage,
} from "@/lib/checkout/hold-warning";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({
    orderHoldHours: maxHoldHoursAfterBooking(settings.booking),
    hoursBeforeDeparture: hoursBeforeDeparture(settings.booking),
    warningMessage: resolveHoldWarningMessage(settings.booking),
  });
}
