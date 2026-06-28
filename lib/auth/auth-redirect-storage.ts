const CALLBACK_KEY = "meru.auth.callbackUrl";
export const GOOGLE_REDIRECT_PENDING_KEY = "meru.auth.googlePending";

export function storeAuthCallbackUrl(url: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CALLBACK_KEY, url);
}

export function consumeAuthCallbackUrl(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const stored = sessionStorage.getItem(CALLBACK_KEY);
  sessionStorage.removeItem(CALLBACK_KEY);
  return stored || fallback;
}

export function markGoogleRedirectPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "1");
}

export function clearGoogleRedirectPending(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
}

export function isGoogleRedirectPending(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === "1";
}

export function hasFirebaseAuthParamsInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  return (
    search.includes("apiKey=") ||
    search.includes("authType=") ||
    hash.includes("apiKey=") ||
    hash.includes("authType=")
  );
}
