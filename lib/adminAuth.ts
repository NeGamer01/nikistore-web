import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET belum diset di environment variables.");
  }
  return new TextEncoder().encode(secret);
}

function getPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD belum diset di environment variables.");
  }
  return password;
}

export async function createSession(): Promise<string> {
  const secret = getSecret();
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Date.now() + SESSION_DURATION)
    .sign(secret);
  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const secret = getSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token);
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function getSessionDuration() {
  return SESSION_DURATION;
}

export async function validatePassword(password: string): Promise<boolean> {
  const expected = getPassword();
  return password === expected;
}
