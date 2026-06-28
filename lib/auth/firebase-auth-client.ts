import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import {
  clearGoogleRedirectPending,
  isGoogleRedirectPending,
  markGoogleRedirectPending,
} from "@/lib/auth/auth-redirect-storage";

const googleProvider = new GoogleAuthProvider();

let redirectResultPromise: Promise<UserCredential | null> | null = null;

function requireClientAuth() {
  const auth = getClientAuth();
  if (!auth) {
    throw new Error("Firebase no está configurado en el cliente");
  }
  return auth;
}

function credentialFromUser(user: User): UserCredential {
  return {
    user,
    providerId: "google.com",
    operationType: "signIn",
  };
}

export async function firebaseEmailSignIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(requireClientAuth(), email, password);
}

export async function firebaseEmailRegister(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(requireClientAuth(), email, password);
}

/** Redirect completo a Google (recomendado en producción). */
export async function firebaseGoogleSignInRedirect(): Promise<void> {
  markGoogleRedirectPending();
  await signInWithRedirect(requireClientAuth(), googleProvider);
}

/**
 * Una sola lectura del redirect de Google por carga de página.
 * Espera authStateReady y usa currentUser como fallback.
 */
export async function firebaseGoogleRedirectResultOnce(): Promise<UserCredential | null> {
  if (typeof window === "undefined") return null;

  if (!redirectResultPromise) {
    redirectResultPromise = resolveGoogleRedirectResult();
  }

  return redirectResultPromise;
}

async function resolveGoogleRedirectResult(): Promise<UserCredential | null> {
  const auth = requireClientAuth();
  const pending = isGoogleRedirectPending();

  await auth.authStateReady();

  const result = await getRedirectResult(auth);
  if (result) {
    clearGoogleRedirectPending();
    return result;
  }

  if (auth.currentUser && pending) {
    clearGoogleRedirectPending();
    return credentialFromUser(auth.currentUser);
  }

  if (pending) {
    clearGoogleRedirectPending();
  }

  return null;
}

export async function firebaseClientSignOut(): Promise<void> {
  redirectResultPromise = null;
  clearGoogleRedirectPending();
  const auth = getClientAuth();
  if (auth) {
    await firebaseSignOut(auth);
  }
}

export function mapFirebaseAuthError(code: string): string {
  const messages: Record<string, string> = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/user-disabled": "Esta cuenta está deshabilitada.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/popup-closed-by-user": "Se cerró la ventana de Google.",
    "auth/too-many-requests": "Demasiados intentos. Probá más tarde.",
    "auth/unauthorized-domain":
      "Este dominio no está autorizado en Firebase. Agregá meru-viajes.vercel.app en Authentication → Settings → Authorized domains.",
  };
  return messages[code] ?? "No se pudo completar la autenticación.";
}

export function getGoogleRedirectFailureMessage(): string {
  return (
    "No se pudo completar el ingreso con Google. Verificá en Firebase Console que " +
    "meru-viajes.vercel.app esté en Authentication → Settings → Authorized domains."
  );
}
