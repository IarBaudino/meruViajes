"use client";

import { getSession, signIn, signOut } from "next-auth/react";
import { firebaseClientSignOut } from "@/lib/auth/firebase-auth-client";
import type { UserRole } from "@/types";

async function waitForSession(maxAttempts = 5): Promise<Awaited<ReturnType<typeof getSession>>> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSession();
    if (session?.user?.id) return session;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return null;
}

export async function establishSession(
  idToken: string
): Promise<{ ok: boolean; error?: string; role?: UserRole; email?: string | null }> {
  const result = await signIn("credentials", {
    idToken,
    redirect: false,
  });

  if (result?.error) {
    return { ok: false, error: "No se pudo iniciar la sesión en el servidor." };
  }

  const session = await waitForSession();

  if (!session?.user?.id) {
    return {
      ok: false,
      error:
        "La sesión no se guardó. Verificá NEXTAUTH_URL y NEXTAUTH_SECRET en Vercel (deben coincidir con tu dominio).",
    };
  }

  return {
    ok: true,
    role: session.user.role,
    email: session.user.email,
  };
}

export async function endSession(callbackUrl = "/"): Promise<void> {
  await firebaseClientSignOut();
  await signOut({ callbackUrl });
}
