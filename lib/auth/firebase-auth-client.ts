import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
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

/** Popup de Google — funciona en /login y /registro (sin headers COOP). */
export async function firebaseGoogleSignInPopup(): Promise<UserCredential> {
  return signInWithPopup(requireClientAuth(), googleProvider);
}

export async function firebaseClientSignOut(): Promise<void> {
  const auth = getClientAuth();
  if (auth) {
    await firebaseSignOut(auth);
  }
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(requireClientAuth(), email);
}

/** Cambiar contraseña si la cuenta ya tiene email/contraseña. */
export async function firebaseChangePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const auth = requireClientAuth();
  const credential = await signInWithEmailAndPassword(auth, email, currentPassword);
  await updatePassword(credential.user, newPassword);
}

/** Vincular email/contraseña a una cuenta (ej. entró solo con Google). */
export async function firebaseLinkEmailPassword(
  email: string,
  newPassword: string
): Promise<void> {
  const auth = requireClientAuth();
  let user = auth.currentUser;

  if (!user) {
    const googleCredential = await signInWithPopup(auth, googleProvider);
    user = googleCredential.user;
  }

  if (!user.email) {
    throw new Error("La cuenta no tiene correo asociado.");
  }

  const emailCredential = EmailAuthProvider.credential(email, newPassword);
  await linkWithCredential(user, emailCredential);
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
    "auth/popup-blocked": "El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.",
    "auth/cancelled-popup-request": "Esperá a que termine el intento anterior.",
    "auth/too-many-requests": "Demasiados intentos. Probá más tarde.",
    "auth/requires-recent-login": "Por seguridad, volvé a iniciar sesión e intentá de nuevo.",
    "auth/provider-already-linked": "Esta cuenta ya tiene contraseña. Usá 'Cambiar contraseña'.",
    "auth/credential-already-in-use": "Ese correo ya está en uso con otra cuenta.",
    "auth/unauthorized-domain":
      "Este dominio no está autorizado en Firebase. Agregá meru-viajes.vercel.app en Authentication → Settings → Authorized domains.",
  };
  return messages[code] ?? "No se pudo completar la autenticación.";
}
