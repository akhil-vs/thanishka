import { json } from "@/lib/http";
import { clearCustomerSession } from "@/lib/auth/customer";

export async function POST() {
  await clearCustomerSession();
  return json({ ok: true });
}
