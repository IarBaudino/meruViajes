"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  firebaseGoogleRedirectResultOnce,
  firebaseGoogleSignInRedirect,
  getGoogleRedirectFailureMessage,
  mapFirebaseAuthError,
} from "@/lib/auth/firebase-auth-client";
import {
  consumeAuthCallbackUrl,
  hasFirebaseAuthParamsInUrl,
  isGoogleRedirectPending,
  storeAuthCallbackUrl,
} from "@/lib/auth/auth-redirect-storage";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-destination";
import { establishSession } from "@/lib/auth/session-client";
import { navigateAfterLogin } from "@/lib/auth/navigate-after-login";

type AuthGoogleContextValue = {
  resolvingRedirect: boolean;
  googleLoading: boolean;
  googleError: string;
  startGoogleSignIn: (callbackUrl: string) => Promise<void>;
  clearGoogleError: () => void;
};

const AuthGoogleContext = createContext<AuthGoogleContextValue | null>(null);

export function AuthGoogleProvider({ children }: { children: ReactNode }) {
  const [resolvingRedirect, setResolvingRedirect] = useState(
    () => isGoogleRedirectPending() || hasFirebaseAuthParamsInUrl()
  );
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolveRedirect() {
      const shouldResolve =
        isGoogleRedirectPending() || hasFirebaseAuthParamsInUrl();

      if (!shouldResolve) {
        setResolvingRedirect(false);
        return;
      }

      try {
        const credential = await firebaseGoogleRedirectResultOnce();
        if (cancelled) return;

        if (!credential) {
          setGoogleError(getGoogleRedirectFailureMessage());
          return;
        }

        const callbackUrl = consumeAuthCallbackUrl("/mi-cuenta/perfil");
        const idToken = await credential.user.getIdToken();
        const session = await establishSession(idToken);

        if (!session.ok) {
          throw new Error(session.error ?? "Error de sesión");
        }

        const destination = resolvePostLoginDestination(callbackUrl, session.role);
        navigateAfterLogin(destination);
      } catch (err) {
        if (!cancelled) {
          const code = (err as { code?: string }).code ?? "";
          setGoogleError(
            err instanceof Error && !code ? err.message : mapFirebaseAuthError(code)
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
  }, []);

  const startGoogleSignIn = useCallback(async (callbackUrl: string) => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      storeAuthCallbackUrl(callbackUrl);
      await firebaseGoogleSignInRedirect();
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setGoogleError(mapFirebaseAuthError(code));
      setGoogleLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      resolvingRedirect,
      googleLoading,
      googleError,
      startGoogleSignIn,
      clearGoogleError: () => setGoogleError(""),
    }),
    [googleError, googleLoading, resolvingRedirect, startGoogleSignIn]
  );

  if (resolvingRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-meru-sand px-4">
        <p className="text-meru-muted">Completando ingreso con Google…</p>
      </div>
    );
  }

  return <AuthGoogleContext.Provider value={value}>{children}</AuthGoogleContext.Provider>;
}

export function useAuthGoogle() {
  const ctx = useContext(AuthGoogleContext);
  if (!ctx) {
    throw new Error("useAuthGoogle debe usarse dentro de AuthGoogleProvider");
  }
  return ctx;
}
