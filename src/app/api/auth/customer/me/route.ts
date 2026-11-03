import { error, json } from "@/lib/http";
import { getCustomerActor, publicUser } from "@/lib/auth/policy";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCustomerActor();
  if (!user) return error("Unauthorized", 401);

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return json({
    user: publicUser(user),
    addresses,
  });
}
