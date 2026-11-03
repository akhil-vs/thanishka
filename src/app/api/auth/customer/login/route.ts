import { Role } from "@prisma/client";
import { error, fromZod, json } from "@/lib/http";
import { createCustomerSession } from "@/lib/auth/customer";
import { verifyPassword } from "@/lib/auth/passwords";
import { hasRole, publicUser } from "@/lib/auth/users";
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
    if (!hasRole(user, Role.CUSTOMER)) {
      return error("Customer access required", 403);
    }

    await createCustomerSession(user);
    return json({ user: publicUser(user) });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to sign in", 500);
  }
}
