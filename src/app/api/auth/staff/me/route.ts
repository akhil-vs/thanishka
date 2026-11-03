import { error, json } from "@/lib/http";
import { getStaffActor, publicUser } from "@/lib/auth/policy";

export async function GET() {
  const user = await getStaffActor();
  if (!user) return error("Unauthorized", 401);
  return json({ user: publicUser(user) });
}
