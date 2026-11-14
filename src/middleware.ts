import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { requireAuthSecret } from "@/lib/auth/secrets";

const ADMIN_COOKIE = "thanishka_admin_session";
const STAFF_COOKIE = "thanishka_staff_session";

function secretFor(kind: "admin" | "staff") {
  if (kind === "admin") {
    return new TextEncoder().encode(
      requireAuthSecret(process.env.ADMIN_JWT_SECRET, "ADMIN_JWT_SECRET"),
    );
  }
  return new TextEncoder().encode(
    requireAuthSecret(
      process.env.STAFF_JWT_SECRET ?? process.env.ADMIN_JWT_SECRET,
      "STAFF_JWT_SECRET",
    ),
  );
}

async function hasValidToken(
  request: NextRequest,
  cookie: string,
  audience: "admin" | "staff",
) {
  const token = request.cookies.get(cookie)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secretFor(audience), { audience });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname === "/studio/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const ok = await hasValidToken(request, ADMIN_COOKIE, "admin");
    if (!ok) {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete(ADMIN_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/studio")) {
    const ok = await hasValidToken(request, STAFF_COOKIE, "staff");
    if (!ok) {
      const res = NextResponse.redirect(new URL("/studio/login", request.url));
      res.cookies.delete(STAFF_COOKIE);
      return res;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/studio", "/studio/:path*"],
};
