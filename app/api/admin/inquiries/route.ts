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

  const { searchParams } = new URL(request.url);
  const archivedParam = searchParams.get("archived") ?? "0";

  const snapshot = await db.collection("inquiries").orderBy("createdAt", "desc").limit(200).get();

  const all = snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate?.() ?? data.createdAt;
    return {
      id: doc.id,
      name: data.name ?? "",
      email: data.email ?? "",
      message: data.message ?? "",
      relatedKind: data.relatedKind ?? null,
      relatedSlug: data.relatedSlug ?? null,
      relatedTitle: data.relatedTitle ?? null,
      status: data.status ?? "nuevo",
      archived: data.archived === true,
      createdAt: createdAt instanceof Date ? createdAt.toISOString() : null,
    };
  });

  const activeCount = all.filter((i) => !i.archived).length;
  const archivedCount = all.filter((i) => i.archived).length;

  let inquiries = all;
  if (archivedParam === "1") {
    inquiries = all.filter((i) => i.archived);
  } else if (archivedParam !== "all") {
    inquiries = all.filter((i) => !i.archived);
  }

  return NextResponse.json({
    inquiries,
    meta: { activeCount, archivedCount, fetched: all.length },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const { id } = body as { id?: string; status?: string; archived?: boolean };

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const hasStatus = body.status !== undefined;
  const hasArchived = typeof body.archived === "boolean";

  if (!hasStatus && !hasArchived) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (hasStatus && !["nuevo", "respondido"].includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const ref = db.collection("inquiries").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
  }

  const current = snap.data()!;
  const nextStatus = hasStatus ? body.status : (current.status ?? "nuevo");
  const nextArchived = hasArchived ? body.archived : current.archived === true;

  if (nextArchived === true && nextStatus !== "respondido") {
    return NextResponse.json(
      { error: "Solo se pueden archivar consultas respondidas." },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (hasStatus) patch.status = body.status;
  if (hasArchived) {
    patch.archived = body.archived;
    if (body.archived) patch.archivedAt = new Date();
  }

  await ref.set(patch, { merge: true });
  return NextResponse.json({ ok: true, status: nextStatus, archived: nextArchived });
}
