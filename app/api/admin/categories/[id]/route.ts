import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { serviceCategorySchema } from "@/schemas/service-category";
import {
  categoryToFirestore,
  mapFirestoreCategory,
  SERVICE_CATEGORIES_COLLECTION,
} from "@/features/categories/lib/firestore-mapper";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await request.json();
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const docRef = db.collection(SERVICE_CATEGORIES_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  if (typeof body.visible === "boolean" && Object.keys(body).length === 1) {
    await docRef.set({ visible: body.visible, updatedAt: new Date() }, { merge: true });
    const updated = mapFirestoreCategory(id, (await docRef.get()).data()!);
    return NextResponse.json({ category: updated });
  }

  const parsed = serviceCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const slugConflict = await db
    .collection(SERVICE_CATEGORIES_COLLECTION)
    .where("slug", "==", parsed.data.slug)
    .get();
  if (slugConflict.docs.some((d) => d.id !== id)) {
    return NextResponse.json({ error: "Ya existe otra categoría con ese slug" }, { status: 409 });
  }

  await docRef.set(
    { ...categoryToFirestore(parsed.data), updatedAt: new Date() },
    { merge: true }
  );

  const updated = mapFirestoreCategory(id, (await docRef.get()).data()!);
  return NextResponse.json({ category: updated });
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

  const docRef = db.collection(SERVICE_CATEGORIES_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  await docRef.delete();
  return NextResponse.json({ ok: true });
}
