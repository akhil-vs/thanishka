import { getAdminFromSession, publicAdmin } from "@/lib/admin/auth";
import { error, json } from "@/lib/admin/http";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) return error("Unauthorized", 401);
  return json({ admin: publicAdmin(admin) });
}
