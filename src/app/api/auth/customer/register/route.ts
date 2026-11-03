import { error, fromZod, json } from "@/lib/http";
import { createCustomerSession } from "@/lib/auth/customer";
import { hashPassword } from "@/lib/auth/passwords";
import { normalizePhone } from "@/lib/auth/phone";
import { ensureCustomerUser, publicUser } from "@/lib/auth/users";
import { customerRegisterSchema } from "@/lib/auth/validators";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = customerRegisterSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return error("An account with this email already exists", 409);
    }

    const phone = body.phone ? normalizePhone(body.phone) : null;
    if (body.phone && !phone) {
      return error("Enter a valid mobile number", 400);
    }

    const user = await ensureCustomerUser({
      email,
      phone,
      name: body.name,
      passwordHash: hashPassword(body.password),
    });

    // If ensure attached to an existing phone user without this email, set email.
    if (!user.email) {
      await prisma.user.update({ where: { id: user.id }, data: { email } });
    }

    const refreshed = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { roleAssignments: { include: { shop: true } } },
    });

    await createCustomerSession(refreshed);
    return json({ user: publicUser(refreshed) });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to register", 500);
  }
}
