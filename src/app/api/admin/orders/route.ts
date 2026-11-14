import { OrderStatus, PaymentMethod } from "@prisma/client";
import { requireBackoffice, json } from "@/lib/admin/http";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/checkout/orders";

export async function GET(request: Request) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const take = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") || 40)),
  );

  const where =
    status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? { status: status as OrderStatus }
      : {};

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take,
  });

  const counts = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  return json({
    orders: orders.map(serializeOrder),
    counts: Object.fromEntries(
      counts.map((c) => [c.status, c._count._all]),
    ) as Record<string, number>,
    paymentMethods: Object.values(PaymentMethod),
  });
}
