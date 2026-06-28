const CALLBACK_KEY = "meru.auth.callbackUrl";

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
