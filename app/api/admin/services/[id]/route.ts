import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { mapFirestoreService, serviceToFirestore } from "@/features/excursions/lib/firestore-mapper";
import { getServiceByIdAdmin, SERVICES_COLLECTION } from "@/features/excursions/lib/get-services";
import { serviceSchema } from "@/schemas/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const service = await getServiceByIdAdmin(id);
  if (!service) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json({ service });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
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

  const docRef = db.collection(SERVICES_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const slugConflict = await db
    .collection(SERVICES_COLLECTION)
    .where("slug", "==", parsed.data.slug)
    .get();

  const taken = slugConflict.docs.some((d) => d.id !== id);
  if (taken) {
    return NextResponse.json({ error: "Ya existe otra excursión con ese slug" }, { status: 409 });
  }

  await docRef.set(
    { ...serviceToFirestore(parsed.data), updatedAt: new Date() },
    { merge: true }
  );

  const updated = mapFirestoreService(id, (await docRef.get()).data()!);
  return NextResponse.json({ service: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const docRef = db.collection(SERVICES_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  await docRef.set({ active: false, updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ ok: true });
}
