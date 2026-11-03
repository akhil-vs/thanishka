import { Role } from "@prisma/client";
import { error, fromZod, json } from "@/lib/http";
import { verifyPassword } from "@/lib/auth/passwords";
import { createStaffSession } from "@/lib/auth/staff";
import { hasAnyRole, publicUser } from "@/lib/auth/users";
import { emailLoginSchema } from "@/lib/auth/validators";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = emailLoginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { roleAssignments: { include: { shop: true } } },
    });

    if (!user || !user.active || !verifyPassword(user.passwordHash, body.password)) {
      return error("Invalid email or password", 401);
    }

    if (!hasAnyRole(user, [Role.SHOP_OWNER, Role.SHOP_STAFF])) {
      return error("Shop access required", 403);
    }

    await createStaffSession(user);
    return json({ user: publicUser(user) });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to sign in", 500);
  }
}
