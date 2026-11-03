import { json } from "@/lib/http";
import { clearStaffSession } from "@/lib/auth/staff";

export async function POST() {
  await clearStaffSession();
  return json({ ok: true });
}
