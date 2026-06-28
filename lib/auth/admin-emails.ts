const DEFAULT_ADMIN_EMAIL = "evtmueru@gmail.com";

/** Emails con rol admin (env ADMIN_EMAILS separados por coma, o el default del proyecto). */
export function getAdminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (fromEnv?.length) return fromEnv;
  return [DEFAULT_ADMIN_EMAIL];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
