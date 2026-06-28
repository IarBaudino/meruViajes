/** Nombre de cookie de sesión next-auth (debe coincidir entre middleware y cliente). */
export function getSessionCookieName(isSecure: boolean): string {
  return isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

export function isSecureAuthEnvironment(protocol?: string): boolean {
  if (protocol) return protocol === "https:";
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
}
