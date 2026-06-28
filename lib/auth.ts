import type { NextAuthOptions } from "next-auth";

/**
 * NextAuth configuration — Phase 4 will wire Firebase Auth credentials provider.
 */
export const authOptions: NextAuthOptions = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
