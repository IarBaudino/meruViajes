import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUiPreview } from "@/lib/auth/admin-preview";

type AuthResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Protege rutas de subida admin.
 * - Sesión next-auth con role admin (Fase 4)
 * - Header x-admin-upload-key = ADMIN_UPLOAD_SECRET (dev / scripts)
 * - Vista previa local si todavía no hay Firebase
 */
export async function requireAdminApi(request: Request): Promise<AuthResult> {
  if (isAdminUiPreview()) {
    return { ok: true };
  }

  const uploadSecret = process.env.ADMIN_UPLOAD_SECRET;
  if (uploadSecret) {
    const key = request.headers.get("x-admin-upload-key");
    if (key && key === uploadSecret) {
      return { ok: true };
    }
  }

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = role === "admin" || (session as { isAdmin?: boolean } | null)?.isAdmin;

  if (session?.user && isAdmin) {
    return { ok: true };
  }

  return { ok: false, status: 401, error: "No autorizado. Se requiere rol admin." };
}
