"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  firebaseGoogleRedirectResult,
  firebaseGoogleSignInRedirect,
  mapFirebaseAuthError,
} from "@/lib/auth/firebase-auth-client";
import { consumeAuthCallbackUrl, storeAuthCallbackUrl } from "@/lib/auth/auth-redirect-storage";
import { establishSession } from "@/lib/auth/session-client";

export function useGoogleRedirectAuth(defaultCallbackUrl: string) {
  const router = useRouter();
  const [resolvingRedirect, setResolvingRedirect] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolveRedirect() {
      try {
        const credential = await firebaseGoogleRedirectResult();
        if (cancelled || !credential) return;

        const callbackUrl = consumeAuthCallbackUrl(defaultCallbackUrl);
        const idToken = await credential.user.getIdToken();
        const session = await establishSession(idToken);

        if (!session.ok) {
          throw new Error(session.error ?? "Error de sesión");
        }

        router.replace(callbackUrl);
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          const code = (err as { code?: string }).code ?? "";
          setGoogleError(
            err instanceof Error && !code
              ? err.message
              : mapFirebaseAuthError(code)
          );
        }
      } finally {
        if (!cancelled) {
          setResolvingRedirect(false);
        }
      }
    }

    void resolveRedirect();
    return () => {
      cancelled = true;
    };
  }, [defaultCallbackUrl, router]);

  const startGoogleSignIn = useCallback(async () => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      storeAuthCallbackUrl(defaultCallbackUrl);
      await firebaseGoogleSignInRedirect();
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setGoogleError(mapFirebaseAuthError(code));
      setGoogleLoading(false);
    }
  }, [defaultCallbackUrl]);

  return {
    resolvingRedirect,
    googleLoading,
    googleError,
    setGoogleError,
    startGoogleSignIn,
  };
}
