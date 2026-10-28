import { compareSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { admins, type Admin } from "@/db/schema";

export const ADMIN_COOKIE = "thanishka_admin_session";

function secretKey() {
  const secret =
    process.env.ADMIN_JWT_SECRET ?? "thanishka-dev-admin-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(admin: Admin) {
  const token = await new SignJWT({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function getAdminFromSession(): Promise<Admin | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = typeof payload.sub === "string" ? payload.sub : null;
    if (!id) return null;

    const db = getDb();
    const admin = db.select().from(admins).where(eq(admins.id, id)).get();
    return admin ?? null;
  } catch {
    return null;
  }
}

export function verifyAdminPassword(admin: Admin, password: string) {
  return compareSync(password, admin.passwordHash);
}

export function publicAdmin(admin: Admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
  };
}
