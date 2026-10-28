import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminFromSession, publicAdmin } from "./auth";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function fromZod(err: ZodError) {
  return error(err.issues.map((i) => i.message).join("; ") || "Invalid input");
}

export async function requireAdmin() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return { admin: null as null, response: error("Unauthorized", 401) };
  }
  return { admin, response: null as null };
}

export { publicAdmin };
