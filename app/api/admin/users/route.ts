import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { formatAuthProvider, hasPasswordProvider } from "@/lib/auth/auth-providers";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminFirestore();
  const adminAuth = getAdminAuth();
  if (!db || !adminAuth) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const snapshot = await db.collection("users").limit(200).get();

  const users = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() ?? data.createdAt;

      let authProviders: string[] = [];
      try {
        const authUser = await adminAuth.getUser(doc.id);
        authProviders = authUser.providerData.map((p) => p.providerId);
      } catch {
        authProviders = [];
      }

      return {
        uid: doc.id,
        name: data.name ?? "",
        email: data.email ?? "",
        role: data.role ?? "customer",
        active: data.active !== false,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : null,
        authProviders,
        authProviderLabels: authProviders.map(formatAuthProvider),
        hasPasswordLogin: hasPasswordProvider(authProviders),
      };
    })
  );

  users.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return NextResponse.json({ users });
}
