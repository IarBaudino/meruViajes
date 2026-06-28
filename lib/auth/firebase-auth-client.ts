import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

const googleProvider = new GoogleAuthProvider();

function requireClientAuth() {
  const auth = getClientAuth();
  if (!auth) {
    throw new Error("Firebase no está configurado en el cliente");
  }
  return auth;
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

/** Redirect completo a Google (recomendado en producción; evita errores COOP del popup). */
export async function firebaseGoogleSignInRedirect(): Promise<void> {
  await signInWithRedirect(requireClientAuth(), googleProvider);
}

/** Llamar al volver de Google; devuelve null si no hay redirect pendiente. */
export async function firebaseGoogleRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(requireClientAuth());
}

export async function firebaseClientSignOut(): Promise<void> {
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
  };
  return messages[code] ?? "No se pudo completar la autenticación.";
}
