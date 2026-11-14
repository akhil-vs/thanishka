import {
  OrderStatus,
  PaymentMethod,
  type Order,
  type OrderItem,
  type PrismaClient,
} from "@prisma/client";

/** Asia/Kolkata has no DST; fixed UTC+05:30. */
export const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.COD_CONFIRMED,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export const OPEN_FULFILMENT: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.COD_CONFIRMED,
  OrderStatus.PACKED,
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type AnalyticsRange = {
  from: Date;
  to: Date;
  fromKey: string;
  toKey: string;
};

export type AnalyticsSummary = {
  gmv: number;
  orders: number;
  aov: number;
  discountTotal: number;
  cancelledOrFailed: number;
  createdTotal: number;
  failRate: number;
  openFulfilment: number;
};

export type AnalyticsDelta = {
  gmv: number | null;
  orders: number | null;
  aov: number | null;
  discountTotal: number | null;
  failRate: number | null;
};

export type AnalyticsSeriesPoint = {
  date: string;
  gmv: number;
  orders: number;
};

export type PaymentMixRow = {
  method: PaymentMethod;
  orders: number;
  gmv: number;
};

export type StatusCountRow = {
  status: OrderStatus;
  count: number;
};

export type TopProductRow = {
  productId: string;
  name: string;
  slug: string;
  units: number;
  gmv: number;
  share: number;
};

export type TopCityRow = {
  city: string;
  state: string;
  orders: number;
  gmv: number;
};

export type CouponRow = {
  code: string;
  orders: number;
  gmv: number;
  discountTotal: number;
  aov: number;
};

export type AnalyticsPeriod = {
  range: { from: string; to: string; timezone: "Asia/Kolkata" };
  summary: AnalyticsSummary;
  series: AnalyticsSeriesPoint[];
  paymentMix: PaymentMixRow[];
  statusCounts: StatusCountRow[];
  topProducts: TopProductRow[];
  topCities: TopCityRow[];
  coupons: CouponRow[];
  feedback: { count: number; avgRating: number | null };
  newsletter: { signups: number; whatsappOptIns: number };
};

export type AnalyticsPayload = {
  timezone: "Asia/Kolkata";
  period: AnalyticsPeriod;
  previous: AnalyticsPeriod | null;
  delta: AnalyticsDelta | null;
  generatedAt: string;
};

type OrderForAnalytics = Pick<
  Order,
  | "id"
  | "status"
  | "paymentMethod"
  | "total"
  | "discountAmount"
  | "couponCode"
  | "shippingCity"
  | "shippingState"
  | "paidAt"
  | "createdAt"
  | "userId"
  | "customerPhone"
  | "customerEmail"
> & {
  items: Pick<
    OrderItem,
    "productId" | "productName" | "productSlug" | "quantity" | "lineTotal" | "size"
  >[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatIstDateKey(d: Date): string {
  const shifted = new Date(d.getTime() + IST_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

/** Midnight IST for the calendar day of `d` (as Instant). */
export function startOfIstDay(d: Date): Date {
  const key = formatIstDateKey(d);
  return parseIstDateKey(key);
}

/** Parse YYYY-MM-DD as the start of that calendar day in Asia/Kolkata. */
export function parseIstDateKey(key: string): Date {
  if (!DATE_RE.test(key)) {
    throw new Error(`Invalid date key: ${key}`);
  }
  const [y, m, day] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day) - IST_OFFSET_MS);
}

export function addIstDays(key: string, days: number): string {
  const start = parseIstDateKey(key);
  return formatIstDateKey(new Date(start.getTime() + days * 24 * 60 * 60 * 1000));
}

export function attributionAt(order: {
  paidAt: Date | null;
  createdAt: Date;
}): Date {
  return order.paidAt ?? order.createdAt;
}

export function isRevenueStatus(status: OrderStatus): boolean {
  return REVENUE_STATUSES.includes(status);
}

export function resolveAnalyticsRange(opts: {
  from?: string | null;
  to?: string | null;
  now?: Date;
}): AnalyticsRange {
  const now = opts.now ?? new Date();
  const todayKey = formatIstDateKey(now);
  const toKey = opts.to && DATE_RE.test(opts.to) ? opts.to : todayKey;
  const defaultFrom = addIstDays(toKey, -6);
  const fromKey =
    opts.from && DATE_RE.test(opts.from) ? opts.from : defaultFrom;

  if (fromKey > toKey) {
    throw new Error("`from` must be on or before `to`");
  }

  // Inclusive to-day → exclusive end instant
  const from = parseIstDateKey(fromKey);
  const to = parseIstDateKey(addIstDays(toKey, 1));

  const maxDays = 366;
  const daySpan =
    (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (daySpan > maxDays) {
    throw new Error(`Range cannot exceed ${maxDays} days`);
  }

  return { from, to, fromKey, toKey };
}

export function previousEqualRange(range: AnalyticsRange): AnalyticsRange {
  const dayCount =
    (parseIstDateKey(addIstDays(range.toKey, 1)).getTime() -
      parseIstDateKey(range.fromKey).getTime()) /
    (24 * 60 * 60 * 1000);
  const prevToKey = addIstDays(range.fromKey, -1);
  const prevFromKey = addIstDays(prevToKey, -(dayCount - 1));
  return {
    fromKey: prevFromKey,
    toKey: prevToKey,
    from: parseIstDateKey(prevFromKey),
    to: parseIstDateKey(addIstDays(prevToKey, 1)),
  };
}

function emptySeries(fromKey: string, toKey: string): AnalyticsSeriesPoint[] {
  const points: AnalyticsSeriesPoint[] = [];
  let key = fromKey;
  while (key <= toKey) {
    points.push({ date: key, gmv: 0, orders: 0 });
    key = addIstDays(key, 1);
  }
  return points;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildPeriod(
  range: AnalyticsRange,
  orders: OrderForAnalytics[],
  extras: {
    openFulfilment: number;
    feedbackCount: number;
    feedbackAvg: number | null;
    newsletterSignups: number;
    newsletterWhatsapp: number;
  },
): AnalyticsPeriod {
  const createdInRange = orders.filter(
    (o) => o.createdAt >= range.from && o.createdAt < range.to,
  );
  const revenue = orders.filter((o) => {
    if (!isRevenueStatus(o.status)) return false;
    const at = attributionAt(o);
    return at >= range.from && at < range.to;
  });

  const gmv = revenue.reduce((sum, o) => sum + o.total, 0);
  const orderCount = revenue.length;
  const discountTotal = revenue.reduce((sum, o) => sum + o.discountAmount, 0);
  const cancelledOrFailed = createdInRange.filter(
    (o) =>
      o.status === OrderStatus.CANCELLED ||
      o.status === OrderStatus.PAYMENT_FAILED,
  ).length;
  const createdTotal = createdInRange.length;
  const failRate =
    createdTotal > 0
      ? Math.round((cancelledOrFailed / createdTotal) * 1000) / 10
      : 0;

  const seriesMap = new Map(
    emptySeries(range.fromKey, range.toKey).map((p) => [p.date, p]),
  );
  for (const o of revenue) {
    const key = formatIstDateKey(attributionAt(o));
    const point = seriesMap.get(key);
    if (!point) continue;
    point.gmv += o.total;
    point.orders += 1;
  }

  const paymentAcc = new Map<PaymentMethod, { orders: number; gmv: number }>();
  for (const method of Object.values(PaymentMethod)) {
    paymentAcc.set(method, { orders: 0, gmv: 0 });
  }
  for (const o of revenue) {
    const row = paymentAcc.get(o.paymentMethod)!;
    row.orders += 1;
    row.gmv += o.total;
  }

  const statusAcc = new Map<OrderStatus, number>();
  for (const status of Object.values(OrderStatus)) {
    statusAcc.set(status, 0);
  }
  for (const o of createdInRange) {
    statusAcc.set(o.status, (statusAcc.get(o.status) ?? 0) + 1);
  }

  const productAcc = new Map<
    string,
    { productId: string; name: string; slug: string; units: number; gmv: number }
  >();
  for (const o of revenue) {
    for (const item of o.items) {
      const cur = productAcc.get(item.productId) ?? {
        productId: item.productId,
        name: item.productName,
        slug: item.productSlug,
        units: 0,
        gmv: 0,
      };
      cur.units += item.quantity;
      cur.gmv += item.lineTotal;
      productAcc.set(item.productId, cur);
    }
  }
  const topProducts = [...productAcc.values()]
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 10)
    .map((p) => ({
      ...p,
      share: gmv > 0 ? Math.round((p.gmv / gmv) * 1000) / 10 : 0,
    }));

  const cityAcc = new Map<
    string,
    { city: string; state: string; orders: number; gmv: number }
  >();
  for (const o of revenue) {
    const city = o.shippingCity.trim() || "Unknown";
    const state = o.shippingState.trim() || "";
    const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
    const cur = cityAcc.get(key) ?? { city, state, orders: 0, gmv: 0 };
    cur.orders += 1;
    cur.gmv += o.total;
    cityAcc.set(key, cur);
  }
  const topCities = [...cityAcc.values()]
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 10);

  const couponAcc = new Map<
    string,
    { code: string; orders: number; gmv: number; discountTotal: number }
  >();
  for (const o of revenue) {
    const code = o.couponCode?.trim();
    if (!code) continue;
    const cur = couponAcc.get(code) ?? {
      code,
      orders: 0,
      gmv: 0,
      discountTotal: 0,
    };
    cur.orders += 1;
    cur.gmv += o.total;
    cur.discountTotal += o.discountAmount;
    couponAcc.set(code, cur);
  }
  const coupons = [...couponAcc.values()]
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 10)
    .map((c) => ({
      ...c,
      aov: c.orders > 0 ? Math.round(c.gmv / c.orders) : 0,
    }));

  return {
    range: {
      from: range.fromKey,
      to: range.toKey,
      timezone: "Asia/Kolkata",
    },
    summary: {
      gmv,
      orders: orderCount,
      aov: orderCount > 0 ? Math.round(gmv / orderCount) : 0,
      discountTotal,
      cancelledOrFailed,
      createdTotal,
      failRate,
      openFulfilment: extras.openFulfilment,
    },
    series: [...seriesMap.values()],
    paymentMix: [...paymentAcc.entries()].map(([method, row]) => ({
      method,
      ...row,
    })),
    statusCounts: [...statusAcc.entries()].map(([status, count]) => ({
      status,
      count,
    })),
    topProducts,
    topCities,
    coupons,
    feedback: {
      count: extras.feedbackCount,
      avgRating: extras.feedbackAvg,
    },
    newsletter: {
      signups: extras.newsletterSignups,
      whatsappOptIns: extras.newsletterWhatsapp,
    },
  };
}

function buildDelta(
  current: AnalyticsSummary,
  previous: AnalyticsSummary,
): AnalyticsDelta {
  return {
    gmv: pctDelta(current.gmv, previous.gmv),
    orders: pctDelta(current.orders, previous.orders),
    aov: pctDelta(current.aov, previous.aov),
    discountTotal: pctDelta(current.discountTotal, previous.discountTotal),
    failRate:
      previous.failRate === 0 && current.failRate === 0
        ? 0
        : Math.round((current.failRate - previous.failRate) * 10) / 10,
  };
}

export async function getAnalyticsPayload(
  prisma: PrismaClient,
  opts: { from?: string | null; to?: string | null; compare?: boolean },
): Promise<AnalyticsPayload> {
  const range = resolveAnalyticsRange({ from: opts.from, to: opts.to });
  const prevRange = opts.compare ? previousEqualRange(range) : null;
  const fetchFrom = prevRange ? prevRange.from : range.from;
  const fetchTo = range.to;

  const [
    orders,
    openFulfilment,
    feedbackRows,
    newsletterRows,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { createdAt: { gte: fetchFrom, lt: fetchTo } },
          { paidAt: { gte: fetchFrom, lt: fetchTo } },
        ],
      },
      select: {
        id: true,
        status: true,
        paymentMethod: true,
        total: true,
        discountAmount: true,
        couponCode: true,
        shippingCity: true,
        shippingState: true,
        paidAt: true,
        createdAt: true,
        userId: true,
        customerPhone: true,
        customerEmail: true,
        items: {
          select: {
            productId: true,
            productName: true,
            productSlug: true,
            quantity: true,
            lineTotal: true,
            size: true,
          },
        },
      },
    }),
    prisma.order.count({ where: { status: { in: OPEN_FULFILMENT } } }),
    prisma.feedback.findMany({
      where: {
        createdAt: {
          gte: fetchFrom,
          lt: fetchTo,
        },
      },
      select: { rating: true, createdAt: true },
    }),
    prisma.newsletterSubscriber.findMany({
      where: {
        createdAt: {
          gte: fetchFrom,
          lt: fetchTo,
        },
      },
      select: { whatsappOptIn: true, createdAt: true },
    }),
  ]);

  function extrasFor(r: AnalyticsRange) {
    const feedback = feedbackRows.filter(
      (f) => f.createdAt >= r.from && f.createdAt < r.to,
    );
    const newsletter = newsletterRows.filter(
      (n) => n.createdAt >= r.from && n.createdAt < r.to,
    );
    const avg =
      feedback.length > 0
        ? Math.round(
            (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 10,
          ) / 10
        : null;
    return {
      openFulfilment,
      feedbackCount: feedback.length,
      feedbackAvg: avg,
      newsletterSignups: newsletter.length,
      newsletterWhatsapp: newsletter.filter((n) => n.whatsappOptIn).length,
    };
  }

  const period = buildPeriod(range, orders, extrasFor(range));
  const previous = prevRange
    ? buildPeriod(prevRange, orders, extrasFor(prevRange))
    : null;

  return {
    timezone: "Asia/Kolkata",
    period,
    previous,
    delta: previous ? buildDelta(period.summary, previous.summary) : null,
    generatedAt: new Date().toISOString(),
  };
}
