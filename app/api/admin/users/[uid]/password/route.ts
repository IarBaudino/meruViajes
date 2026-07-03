import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminAuth } from "@/lib/firebase/admin";

const bodySchema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type RouteContext = { params: Promise<{ uid: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { uid } = await context.params;
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Contraseña inválida" },
      { status: 400 }
    );
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  try {
    await adminAuth.updateUser(uid, { password: parsed.data.password });
    return NextResponse.json({
      ok: true,
      message:
        "Contraseña asignada. Compartila de forma segura con el usuario; no se puede recuperar después.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo asignar la contraseña";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
