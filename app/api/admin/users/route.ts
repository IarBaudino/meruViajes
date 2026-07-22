import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { formatAuthProvider, hasPasswordProvider } from "@/lib/auth/auth-providers";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

function toIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

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

      let authProviders: string[] = [];
      let emailVerified = false;
      let authDisabled = false;
      let lastSignInAt: string | null = null;
      let authCreatedAt: string | null = null;
      let authExists = false;

      try {
        const authUser = await adminAuth.getUser(doc.id);
        authExists = true;
        authProviders = authUser.providerData.map((p) => p.providerId);
        emailVerified = Boolean(authUser.emailVerified);
        authDisabled = Boolean(authUser.disabled);
        lastSignInAt = authUser.metadata.lastSignInTime
          ? new Date(authUser.metadata.lastSignInTime).toISOString()
          : null;
        authCreatedAt = authUser.metadata.creationTime
          ? new Date(authUser.metadata.creationTime).toISOString()
          : null;
      } catch {
        authProviders = [];
      }

      return {
        uid: doc.id,
        name: typeof data.name === "string" ? data.name : "",
        email: typeof data.email === "string" ? data.email : "",
        role: typeof data.role === "string" ? data.role : "customer",
        dni: typeof data.dni === "string" ? data.dni : "",
        phone: typeof data.phone === "string" ? data.phone : "",
        address: typeof data.address === "string" ? data.address : "",
        image: typeof data.image === "string" ? data.image : "",
        active: data.active !== false,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        authExists,
        authProviders,
        authProviderLabels: authProviders.map(formatAuthProvider),
        hasPasswordLogin: hasPasswordProvider(authProviders),
        emailVerified,
        authDisabled,
        lastSignInAt,
        authCreatedAt,
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
