import { NextResponse } from "next/server";
import { getActiveServices } from "@/features/excursions/lib/get-services";

export const revalidate = 60;

export async function GET() {
  try {
    const services = await getActiveServices();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("[api/services]", error);
    return NextResponse.json({ error: "Error al listar excursiones" }, { status: 500 });
  }
}
