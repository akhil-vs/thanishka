import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import {
  requireBackoffice,
  json,
  error,
  fromZod,
} from "@/lib/admin/http";
import { prisma } from "@/lib/db";
import {
  CheckoutError,
  serializeOrder,
  updateOrderFulfillmentStatus,
} from "@/lib/checkout/orders";

const patchSchema = z.object({
  status: z.enum([
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return error("Order not found", 404);
  return json({ order: serializeOrder(order) });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireBackoffice();
  if (response) return response;

  try {
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());
    const order = await updateOrderFulfillmentStatus({
      orderId: id,
      status: body.status as OrderStatus,
    });
    return json({ order });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    if (err instanceof CheckoutError) {
      return error(err.message, err.status);
    }
    console.error("[admin/orders/:id]", err);
    return error("Unable to update order", 500);
  }
}
