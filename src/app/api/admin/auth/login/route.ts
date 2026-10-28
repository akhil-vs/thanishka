import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import {
  createAdminSession,
  publicAdmin,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { error, fromZod, json } from "@/lib/admin/http";
import { loginSchema } from "@/lib/admin/validators";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const db = getDb();
    const admin = db
      .select()
      .from(admins)
      .where(eq(admins.email, body.email.toLowerCase()))
      .get();

    if (!admin || !verifyAdminPassword(admin, body.password)) {
      return error("Invalid email or password", 401);
    }

    await createAdminSession(admin);
    return json({ admin: publicAdmin(admin) });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to sign in", 500);
  }
}
