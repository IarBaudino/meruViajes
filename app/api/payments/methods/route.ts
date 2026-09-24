import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { isMercadoPagoConfigured } from "@/lib/payments/methods";

export async function GET() {
  const settings = await getSiteSettings();
  const payments = settings.payments ?? {
    bankName: "",
    accountHolder: "",
    cbu: "",
    alias: "",
    notes: "",
  };

  return NextResponse.json({
    mercadopago: isMercadoPagoConfigured(),
    transfer: {
      bankName: payments.bankName,
      accountHolder: payments.accountHolder,
      cbu: payments.cbu,
      alias: payments.alias,
      notes: payments.notes,
    },
  });
}
