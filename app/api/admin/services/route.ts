import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { serviceSchema } from "@/schemas/service";
import { serviceToFirestore } from "@/features/excursions/lib/firestore-mapper";
import { getAllServicesAdmin, SERVICES_COLLECTION } from "@/features/excursions/lib/get-services";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const services = await getAllServicesAdmin();
  return NextResponse.json({ services });
}

export async function POST(request: Request) {  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const existing = await db
    .collection(SERVICES_COLLECTION)
    .where("slug", "==", parsed.data.slug)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Ya existe una excursión con ese slug" }, { status: 409 });
  }

  const ref = await db.collection(SERVICES_COLLECTION).add({
    ...serviceToFirestore(parsed.data),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
