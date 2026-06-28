import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/auth/admin-emails";
import type { UserRole } from "@/types";

export interface SyncedUserProfile {
  name: string;
  email: string;
  role: UserRole;
}

export async function syncUserProfile(
  uid: string,
  email?: string | null,
  displayName?: string | null
): Promise<SyncedUserProfile> {
  const db = getAdminFirestore();
  const auth = getAdminAuth();
  if (!db || !auth) {
    throw new Error("Firebase Admin no configurado");
  }

  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const shouldBeAdmin = isAdminEmail(normalizedEmail);
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  const now = new Date();

  if (!snap.exists) {
    const role: UserRole = shouldBeAdmin ? "admin" : "customer";
    const profile: SyncedUserProfile = {
      name: displayName?.trim() || normalizedEmail.split("@")[0] || "Usuario",
      email: normalizedEmail,
      role,
    };

    await ref.set({
      uid,
      ...profile,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    if (shouldBeAdmin) {
      await auth.setCustomUserClaims(uid, { admin: true });
    }

    return profile;
  }

  const data = snap.data()!;
  let role = (data.role as UserRole | undefined) ?? "customer";

  if (shouldBeAdmin && role !== "admin") {
    role = "admin";
    await ref.set({ role: "admin", updatedAt: now }, { merge: true });
    await auth.setCustomUserClaims(uid, { admin: true });
  }

  return {
    name: (data.name as string) || displayName?.trim() || "Usuario",
    email: (data.email as string) || normalizedEmail,
    role,
  };
}
