import { fromZod, json, error } from "@/lib/http";
import { publicUser, requireAdmin, requireBackoffice } from "@/lib/auth/policy";
import { getAdminFromSession, publicAdmin } from "./auth";

export { json, error, fromZod, requireAdmin, requireBackoffice, publicUser, publicAdmin };

/** Prefer requireBackoffice for catalogue/stock APIs so shop staff can operate. */
export async function requireAdminLegacy() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return { admin: null as null, response: error("Unauthorized", 401) };
  }
  return { admin, response: null as null };
}
