import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { packageSchema } from "@/schemas/package";
import {
  packageToFirestore,
  PACKAGES_COLLECTION,
} from "@/features/packages/lib/firestore-mapper";
import { getAllPackagesAdmin } from "@/features/packages/lib/get-packages";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const packages = await getAllPackagesAdmin();
  return NextResponse.json({ packages });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = packageSchema.safeParse(body);
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
    .collection(PACKAGES_COLLECTION)
    .where("slug", "==", parsed.data.slug)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Ya existe un paquete con ese slug" }, { status: 409 });
  }

  const ref = await db.collection(PACKAGES_COLLECTION).add({
    ...packageToFirestore({
      ...parsed.data,
      category: parsed.data.category || undefined,
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
