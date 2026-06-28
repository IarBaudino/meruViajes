import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { inquirySchema } from "@/schemas/inquiry";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getResend, isResendConfigured, resendDefaults } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, message } = parsed.data;

    if (isFirebaseAdminConfigured()) {
      const db = getAdminFirestore();
      if (db) {
        await db.collection("inquiries").add({
          name,
          email,
          message,
          status: "nuevo",
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    if (isResendConfigured()) {
      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: resendDefaults.from,
          to: resendDefaults.to,
          replyTo: email,
          subject: `[Meru Turismo] Nueva consulta de ${name}`,
          html: `
            <h2>Nueva consulta desde el sitio web</h2>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
          `,
        });

        await resend.emails.send({
          from: resendDefaults.from,
          to: email,
          subject: "Recibimos tu consulta — Meru Viajes y Turismo",
          html: `
            <p>Hola ${name},</p>
            <p>Gracias por contactarnos. Recibimos tu consulta y te responderemos a la brevedad.</p>
            <p>Saludos,<br>Equipo Meru Viajes y Turismo<br>Ushuaia, Tierra del Fuego</p>
          `,
        });
      }
    }

    if (!isFirebaseAdminConfigured() && !isResendConfigured()) {
      console.warn(
        "[inquiries] Firebase Admin y Resend no configurados. Consulta:",
        parsed.data
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[inquiries]", error);
    return NextResponse.json(
      { error: "No se pudo procesar la consulta. Intentá nuevamente." },
      { status: 500 }
    );
  }
}
