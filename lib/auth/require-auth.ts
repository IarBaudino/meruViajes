import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { UserRole } from "@/types";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth(redirectTo = "/login") {
  const user = await getSessionUser();
  if (!user?.id) {
    redirect(redirectTo);
  }
  return user;
}

export async function requireAdmin(redirectTo = "/login?error=admin") {
  const user = await requireAuth(redirectTo);
  if (user.role !== "admin") {
    redirect(redirectTo);
  }
  return user;
}

export function isAdminRole(role?: UserRole | null): boolean {
  return role === "admin";
}
