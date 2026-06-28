import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

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

export async function firebaseGoogleSignIn(): Promise<UserCredential> {
  return signInWithPopup(requireClientAuth(), new GoogleAuthProvider());
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
