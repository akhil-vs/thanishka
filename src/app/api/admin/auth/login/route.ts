import { Role } from "@prisma/client";
import { createAdminSession, publicAdmin, verifyAdminPassword } from "@/lib/admin/auth";
import { error, fromZod, json } from "@/lib/admin/http";
import { loginSchema } from "@/lib/admin/validators";
import { hasRole } from "@/lib/auth/users";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { roleAssignments: { include: { shop: true } } },
    });

    if (!user || !user.active || !verifyAdminPassword(user, body.password)) {
      return error("Invalid email or password", 401);
    }

    if (!hasRole(user, Role.ADMIN)) {
      return error("Admin access required", 403);
    }

    await createAdminSession(user);
    return json({ admin: publicAdmin(user) });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to sign in", 500);
  }
}
