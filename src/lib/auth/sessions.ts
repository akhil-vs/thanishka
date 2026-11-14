import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { requireAuthSecret } from "./secrets";
import type { AuthAudience, SessionClaims } from "./types";

export const ADMIN_COOKIE = "thanishka_admin_session";
export const STAFF_COOKIE = "thanishka_staff_session";
export const CUSTOMER_COOKIE = "thanishka_customer_session";

const COOKIE_BY_AUDIENCE: Record<AuthAudience, string> = {
  admin: ADMIN_COOKIE,
  staff: STAFF_COOKIE,
  customer: CUSTOMER_COOKIE,
};

const TTL_BY_AUDIENCE: Record<AuthAudience, string> = {
  admin: "12h",
  staff: "12h",
  customer: "30d",
};

const MAX_AGE_BY_AUDIENCE: Record<AuthAudience, number> = {
  admin: 60 * 60 * 12,
  staff: 60 * 60 * 12,
  customer: 60 * 60 * 24 * 30,
};

function secretFor(audience: AuthAudience) {
  const map: Record<AuthAudience, { value: string | undefined; name: string }> =
    {
      admin: {
        value: process.env.ADMIN_JWT_SECRET,
        name: "ADMIN_JWT_SECRET",
      },
      staff: {
        value: process.env.STAFF_JWT_SECRET ?? process.env.ADMIN_JWT_SECRET,
        name: "STAFF_JWT_SECRET",
      },
      customer: {
        value:
          process.env.CUSTOMER_JWT_SECRET ??
          process.env.STAFF_JWT_SECRET ??
          process.env.ADMIN_JWT_SECRET,
        name: "CUSTOMER_JWT_SECRET",
      },
    };
  const entry = map[audience];
  return new TextEncoder().encode(
    requireAuthSecret(entry.value, entry.name),
  );
}

export async function createSession(claims: SessionClaims) {
  const token = await new SignJWT({
    email: claims.email ?? null,
    phone: claims.phone ?? null,
    name: claims.name,
    roles: claims.roles,
    shopId: claims.shopId ?? null,
    aud: claims.aud,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setIssuedAt()
    .setExpirationTime(TTL_BY_AUDIENCE[claims.aud])
    .sign(secretFor(claims.aud));

  const jar = await cookies();
  jar.set(COOKIE_BY_AUDIENCE[claims.aud], token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_BY_AUDIENCE[claims.aud],
  });
}

export async function clearSession(audience: AuthAudience) {
  const jar = await cookies();
  jar.delete(COOKIE_BY_AUDIENCE[audience]);
}

export async function readSession(
  audience: AuthAudience,
): Promise<SessionClaims | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_BY_AUDIENCE[audience])?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretFor(audience), {
      audience,
    });
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) return null;
    const roles = Array.isArray(payload.roles)
      ? (payload.roles.filter((r): r is Role => typeof r === "string") as Role[])
      : [];
    return {
      sub,
      email: typeof payload.email === "string" ? payload.email : null,
      phone: typeof payload.phone === "string" ? payload.phone : null,
      name: typeof payload.name === "string" ? payload.name : "",
      roles,
      shopId: typeof payload.shopId === "string" ? payload.shopId : null,
      aud: audience,
    };
  } catch {
    return null;
  }
}

export function cookieNameFor(audience: AuthAudience) {
  return COOKIE_BY_AUDIENCE[audience];
}

export function middlewareSecret(audience: AuthAudience) {
  return secretFor(audience);
}
