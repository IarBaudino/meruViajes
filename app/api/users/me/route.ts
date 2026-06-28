import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { profileSchema } from "@/schemas/user";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const doc = await db.collection("users").doc(session.user.id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const data = doc.data()!;
  return NextResponse.json({
    uid: session.user.id,
    name: data.name ?? "",
    email: data.email ?? session.user.email ?? "",
    dni: data.dni ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    role: data.role ?? session.user.role ?? "customer",
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse({
    ...body,
    email: session.user.email,
  });

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

  const { name, dni, phone, address } = parsed.data;

  await db
    .collection("users")
    .doc(session.user.id)
    .set(
      {
        name,
        dni: dni ?? "",
        phone: phone ?? "",
        address: address ?? "",
        updatedAt: new Date(),
      },
      { merge: true }
    );

  return NextResponse.json({ ok: true });
}
