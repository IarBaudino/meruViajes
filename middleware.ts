import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSessionCookieName } from "@/lib/auth/session-cookie";

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const isSecure = request.nextUrl.protocol === "https:";

  const token = secret
    ? await getToken({
        req: request,
        secret,
        secureCookie: isSecure,
        cookieName: getSessionCookieName(isSecure),
      })
    : null;

  const { pathname } = request.nextUrl;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && token.role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "admin");
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mi-cuenta/:path*", "/admin/:path*"],
};
