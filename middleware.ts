import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth-session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("nexus_session")?.value;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "tussi-secret-key-123456";

  const isAuth = await verifySessionToken(token, secret);

  // If trying to access dashboard but not authenticated, redirect to /login
  if (pathname.startsWith("/dashboard") && !isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If already authenticated and trying to visit /login, redirect to /dashboard
  if (pathname.startsWith("/login") && isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
