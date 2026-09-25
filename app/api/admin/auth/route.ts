import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSession,
  getSessionCookieName,
  getSessionDuration,
  isAdminAuthenticated,
  validatePassword
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const action = String(body?.action || "login");

  if (action === "logout") {
    const cookieStore = await cookies();
    cookieStore.delete(getSessionCookieName());
    return NextResponse.json({ ok: true });
  }

  if (action === "check") {
    const ok = await isAdminAuthenticated();
    return NextResponse.json({ authenticated: ok });
  }

  const password = String(body?.password || "");
  if (!password) {
    return NextResponse.json({ message: "Password wajib diisi." }, { status: 400 });
  }

  try {
    const valid = await validatePassword(password);
    if (!valid) {
      return NextResponse.json({ message: "Password salah." }, { status: 401 });
    }

    const token = await createSession();
    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.floor(getSessionDuration() / 1000),
      path: "/"
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login gagal.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
