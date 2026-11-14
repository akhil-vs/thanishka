import { error, json } from "@/lib/http";
import { prisma } from "@/lib/db";
import { getCustomerActor } from "@/lib/auth/policy";
import { serializeOrder } from "@/lib/checkout/orders";
import { verifyOrderAccessToken } from "@/lib/checkout/access-token";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return error("Order not found", 404);

  const customer = await getCustomerActor();
  const url = new URL(request.url);
  const token =
    url.searchParams.get("t") ||
    url.searchParams.get("token") ||
    request.headers.get("x-order-access-token");

  if (order.userId) {
    if (customer && order.userId === customer.id) {
      return json({ order: serializeOrder(order) });
    }
    if (customer && order.userId !== customer.id) {
      return error("Forbidden", 403);
    }
    // Guest with valid access token may still open a linked order confirmation link.
    if (verifyOrderAccessToken(order.id, token)) {
      return json({ order: serializeOrder(order) });
    }
    return error("Sign in or use your order link to view this order", 401);
  }

  // Guest order — require access token (returned at checkout create).
  if (!verifyOrderAccessToken(order.id, token)) {
    return error("Invalid or missing order access token", 401);
  }

  return json({ order: serializeOrder(order) });
}
