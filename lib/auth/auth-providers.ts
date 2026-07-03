export type AuthProviderId = "password" | "google.com" | string;

export function formatAuthProvider(providerId: AuthProviderId): string {
  if (providerId === "password") return "Email y contraseña";
  if (providerId === "google.com") return "Google";
  if (providerId === "phone") return "Teléfono";
  return providerId;
}

export function hasPasswordProvider(providerIds: string[]): boolean {
  return providerIds.includes("password");
}
