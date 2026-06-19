import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth-session";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD || "tussi123";
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "tussi-secret-key-123456";

    if (password !== adminPassword) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = await createSessionToken(secret);

    const response = NextResponse.json({ success: true });
    
    // Set HTTP-only, secure, SameSite cookie
    response.cookies.set("nexus_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
