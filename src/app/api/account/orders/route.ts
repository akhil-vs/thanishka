import { json } from "@/lib/http";
import { requireCustomer } from "@/lib/auth/policy";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/checkout/orders";

export async function GET() {
  const { user, response } = await requireCustomer();
  if (response || !user) return response!;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return json({ orders: orders.map(serializeOrder) });
}
