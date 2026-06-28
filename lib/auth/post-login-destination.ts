import type { UserRole } from "@/types";

const DEFAULT_CALLBACK = "/mi-cuenta/perfil";

/** Tras login: admins van al panel salvo que pidieron otra URL explícita. */
export function resolvePostLoginDestination(
  callbackUrl: string,
  role?: UserRole | null
): string {
  const target = callbackUrl || DEFAULT_CALLBACK;

  if (target !== DEFAULT_CALLBACK) {
    return target;
  }

  return role === "admin" ? "/admin" : DEFAULT_CALLBACK;
}
