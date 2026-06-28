"use client";

import { signIn, signOut } from "next-auth/react";
import { firebaseClientSignOut } from "@/lib/auth/firebase-auth-client";

export async function establishSession(idToken: string): Promise<{ ok: boolean; error?: string }> {
  const result = await signIn("credentials", {
    idToken,
    redirect: false,
  });

  if (result?.error) {
    return { ok: false, error: "No se pudo iniciar la sesión en el servidor." };
  }

  return { ok: true };
}

export async function endSession(callbackUrl = "/"): Promise<void> {
  await firebaseClientSignOut();
  await signOut({ callbackUrl });
}
