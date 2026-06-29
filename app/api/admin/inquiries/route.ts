import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const snapshot = await db.collection("inquiries").orderBy("createdAt", "desc").limit(100).get();

  const inquiries = snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() ?? data.createdAt;
    return {
      id: doc.id,
      name: data.name ?? "",
      email: data.email ?? "",
      message: data.message ?? "",
      status: data.status ?? "nuevo",
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : null,
    };
  });

  return NextResponse.json({ inquiries });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id, status } = await request.json();
  if (!id || !["nuevo", "respondido"].includes(status)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  await db.collection("inquiries").doc(id).set({ status, updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ ok: true });
}
