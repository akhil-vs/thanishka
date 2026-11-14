import { OrderStatus } from "@prisma/client";
import { asSizeMap } from "@/lib/admin/types";
import { requireBackoffice, json } from "@/lib/admin/http";
import { totalUnits } from "@/lib/admin/stock";
import { prisma } from "@/lib/db";

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.COD_CONFIRMED,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const OPEN_FULFILMENT: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.COD_CONFIRMED,
  OrderStatus.PACKED,
];

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET() {
  const { response } = await requireBackoffice();
  if (response) return response;

  const todayStart = startOfUtcDay();
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const [
    allProducts,
    discountCount,
    offerCount,
    heroCount,
    recentMovements,
    revenueOrders,
    openOrders,
    pendingPayment,
    recentOrders,
  ] = await Promise.all([
    prisma.product.findMany(),
    prisma.discount.count({ where: { active: true } }),
    prisma.offer.count({ where: { active: true } }),
    prisma.heroSlide.count({ where: { active: true } }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.order.findMany({
      where: {
        status: { in: REVENUE_STATUSES },
        createdAt: { gte: weekStart },
      },
      select: { total: true, createdAt: true, status: true },
    }),
    prisma.order.count({ where: { status: { in: OPEN_FULFILMENT } } }),
    prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED],
        },
        stockReserved: true,
      },
    }),
    prisma.order.findMany({
      where: { status: { in: OPEN_FULFILMENT } },
      orderBy: { createdAt: "asc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        customerName: true,
        createdAt: true,
      },
    }),
  ]);

  const activeProducts = allProducts.filter((p) => p.active);
  const withTotals = activeProducts.map((p) => ({
    ...p,
    sizes: asSizeMap(p.sizes),
    total: totalUnits(asSizeMap(p.sizes)),
  }));
  const lowStock = withTotals.filter((p) => p.total <= 5);
  const outOfStock = withTotals.filter((p) => p.total === 0);

  const revenueToday = revenueOrders
    .filter((o) => o.createdAt >= todayStart)
    .reduce((sum, o) => sum + o.total, 0);
  const revenue7d = revenueOrders.reduce((sum, o) => sum + o.total, 0);
  const ordersToday = revenueOrders.filter(
    (o) => o.createdAt >= todayStart,
  ).length;
  const orders7d = revenueOrders.length;
  const aov7d = orders7d > 0 ? Math.round(revenue7d / orders7d) : 0;

  return json({
    stats: {
      products: allProducts.length,
      activeProducts: activeProducts.length,
      totalUnits: withTotals.reduce((sum, p) => sum + p.total, 0),
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      discounts: discountCount,
      offers: offerCount,
      heroSlides: heroCount,
      revenueToday,
      revenue7d,
      ordersToday,
      orders7d,
      aov7d,
      openFulfilment: openOrders,
      pendingPaymentHolds: pendingPayment,
    },
    lowStock: lowStock.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      total: p.total,
      sizes: p.sizes,
    })),
    openOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      customerName: o.customerName,
      createdAt: o.createdAt.toISOString(),
    })),
    recentMovements,
    generatedAt: new Date().toISOString(),
  });
}
