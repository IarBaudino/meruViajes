import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAdminAuth } from "@/lib/firebase/admin";
import { syncUserProfile } from "@/lib/auth/sync-user-profile";
import type { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        const idToken = credentials?.idToken;
        if (!idToken) return null;

        const auth = getAdminAuth();
        if (!auth) return null;

        try {
          const decoded = await auth.verifyIdToken(idToken);
          const profile = await syncUserProfile(
            decoded.uid,
            decoded.email,
            decoded.name ?? undefined
          );

          return {
            id: decoded.uid,
            email: profile.email || decoded.email,
            name: profile.name,
            role: profile.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.uid = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: UserRole }).role ?? "customer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? "customer";
      }
      return session;
    },
  },
};
