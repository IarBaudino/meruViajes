import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { serviceCategorySchema } from "@/schemas/service-category";
import {
  categoryToFirestore,
  SERVICE_CATEGORIES_COLLECTION,
} from "@/features/categories/lib/firestore-mapper";
import { getAllCategoriesAdmin } from "@/features/categories/lib/get-categories";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const categories = await getAllCategoriesAdmin();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = serviceCategorySchema.safeParse(body);
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
    .collection(SERVICE_CATEGORIES_COLLECTION)
    .where("slug", "==", parsed.data.slug)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Ya existe una categoría con ese slug" }, { status: 409 });
  }

  const ref = await db.collection(SERVICE_CATEGORIES_COLLECTION).add({
    ...categoryToFirestore(parsed.data),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
