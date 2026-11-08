import { error, json } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getCustomerActor } from "@/lib/auth/policy";
import { serializeOrder } from "@/lib/checkout/orders";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return error("Order not found", 404);

  const customer = await getCustomerActor();
  // Guests can view by id (shared success link). Logged-in users may only
  // see their own orders when the order is linked to an account.
  if (order.userId && customer && order.userId !== customer.id) {
    return error("Forbidden", 403);
  }

  return json({ order: serializeOrder(order) });
}
