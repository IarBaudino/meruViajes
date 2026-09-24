import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  brand,
  brandEmailSignatureHtml,
  brandLogoHtml,
} from "@/config/brand";
import { inquirySchema } from "@/schemas/inquiry";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getResend, isResendConfigured, resendDefaults } from "@/lib/resend";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function relatedLabel(kind?: string) {
  if (kind === "package") return "Paquete";
  if (kind === "excursion") return "Excursión";
  if (kind === "groupTrip") return "Viaje grupal";
  return "Producto";
}

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

    const { name, email, message, relatedKind, relatedSlug, relatedTitle } = parsed.data;
    const title = relatedTitle?.trim() || "";
    const slug = relatedSlug?.trim() || "";
    const kind = relatedKind;
    const hasRelated = Boolean(title || slug);

    if (isFirebaseAdminConfigured()) {
      const db = getAdminFirestore();
      if (db) {
        await db.collection("inquiries").add({
          name,
          email,
          message,
          ...(kind ? { relatedKind: kind } : {}),
          ...(slug ? { relatedSlug: slug } : {}),
          ...(title ? { relatedTitle: title } : {}),
          status: "nuevo",
          archived: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    if (isResendConfigured()) {
      const resend = getResend();
      if (resend) {
        const logoHtml = brandLogoHtml();
        const relatedHtml = hasRelated
          ? `<p><strong>${relatedLabel(kind)}:</strong> ${escapeHtml(title || slug)}${
              slug ? ` <span style="color:#666">(${escapeHtml(slug)})</span>` : ""
            }</p>`
          : "";
        const subjectSuffix = title ? ` — ${title}` : "";

        await resend.emails.send({
          from: resendDefaults.from,
          to: resendDefaults.to,
          replyTo: email,
          subject: `[${brand.shortName}] Nueva consulta de ${name}${subjectSuffix}`,
          html: `
            ${logoHtml}
            <h2>Nueva consulta desde el sitio web</h2>
            ${relatedHtml}
            <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
          `,
        });

        await resend.emails.send({
          from: resendDefaults.from,
          to: email,
          subject: `Recibimos tu consulta — ${brand.agencyName}`,
          html: `
            ${logoHtml}
            <p>Hola ${escapeHtml(name)},</p>
            <p>Gracias por contactarnos. Recibimos tu consulta${
              title ? ` sobre <strong>${escapeHtml(title)}</strong>` : ""
            } y te responderemos a la brevedad.</p>
            <p>Saludos,<br>${brandEmailSignatureHtml()}</p>
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
