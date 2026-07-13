import { NextResponse } from "next/server";
import { isGetnetConfigured } from "@/lib/payments/getnet/config";

export async function GET() {
  return NextResponse.json({ configured: isGetnetConfigured() });
}
