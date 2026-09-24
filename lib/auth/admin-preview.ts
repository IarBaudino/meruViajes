import type { UserRole } from "@/types";

function hasFirebaseAdminEnv(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

/** En `next dev`, si todavía no hay Firebase, se puede recorrer el UI de /admin. */
export function isAdminUiPreview(): boolean {
  return process.env.NODE_ENV === "development" && !hasFirebaseAdminEnv();
}

export const PREVIEW_ADMIN_USER = {
  id: "preview-admin",
  email: "Vista previa (sin Firebase)",
  name: "Vista previa",
  role: "admin" as UserRole,
};
