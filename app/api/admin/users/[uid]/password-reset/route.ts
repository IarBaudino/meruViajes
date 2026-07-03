import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getResend, isResendConfigured, resendDefaults } from "@/lib/resend";

type RouteContext = { params: Promise<{ uid: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { uid } = await context.params;
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  try {
    const user = await adminAuth.getUser(uid);
    if (!user.email) {
      return NextResponse.json({ error: "El usuario no tiene correo" }, { status: 400 });
    }

    const resetLink = await adminAuth.generatePasswordResetLink(user.email);

    if (isResendConfigured()) {
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: resendDefaults.from,
          to: user.email,
          subject: "Restablecer contraseña — Meru Viajes",
          html: `
            <p>Hola,</p>
            <p>Un administrador solicitó restablecer tu contraseña de Meru Viajes.</p>
            <p><a href="${resetLink}">Hacé clic aquí para elegir una nueva contraseña</a></p>
            <p>Si no pediste esto, ignorá este correo.</p>
          `,
        });
        return NextResponse.json({ ok: true, emailed: true });
      }
    }

    return NextResponse.json({
      ok: true,
      emailed: false,
      resetLink,
      message: "Copiá el enlace y enviáselo al usuario (expira en poco tiempo).",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar el enlace";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
