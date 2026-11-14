import { FeedbackStatus, OrderStatus, type Feedback, type Order } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyOrderAccessToken } from "@/lib/checkout/access-token";
import type { ActorUser } from "@/lib/auth/types";
import type {
  FeedbackStatusValue,
  PublicTestimonial,
  SerializedFeedback,
} from "./types";

export class FeedbackError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type FeedbackWithOrder = Feedback & {
  order?: Pick<Order, "orderNumber"> | null;
};

export function serializeFeedback(row: FeedbackWithOrder): SerializedFeedback {
  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.order?.orderNumber ?? null,
    userId: row.userId,
    rating: row.rating,
    message: row.message,
    displayName: row.displayName,
    place: row.place,
    status: row.status as FeedbackStatusValue,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toPublicTestimonial(row: Feedback): PublicTestimonial {
  return {
    id: row.id,
    quote: row.message,
    name: row.displayName,
    place: row.place?.trim() || "Trivandrum",
    rating: row.rating,
  };
}

/** Delivered orders only; one feedback per order. */
export function isFeedbackEligible(status: OrderStatus | string) {
  return status === OrderStatus.DELIVERED || status === "DELIVERED";
}

export async function assertOrderFeedbackAccess(opts: {
  orderId: string;
  customer: ActorUser | null;
  accessToken?: string | null;
}) {
  const order = await prisma.order.findUnique({
    where: { id: opts.orderId },
    include: { feedback: true },
  });
  if (!order) throw new FeedbackError("Order not found", 404);

  let allowed = false;
  if (opts.customer && order.userId && order.userId === opts.customer.id) {
    allowed = true;
  } else if (verifyOrderAccessToken(order.id, opts.accessToken)) {
    allowed = true;
  }

  if (!allowed) {
    throw new FeedbackError(
      "Sign in or use your order link to leave feedback",
      401,
    );
  }

  return order;
}

export async function getFeedbackForOrder(opts: {
  orderId: string;
  customer: ActorUser | null;
  accessToken?: string | null;
}) {
  const order = await assertOrderFeedbackAccess(opts);
  const eligible = isFeedbackEligible(order.status);
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      shippingCity: order.shippingCity,
    },
    eligible,
    feedback: order.feedback ? serializeFeedback(order.feedback) : null,
  };
}

export async function submitFeedback(opts: {
  orderId: string;
  rating: number;
  message: string;
  displayName?: string;
  customer: ActorUser | null;
  accessToken?: string | null;
}) {
  const order = await assertOrderFeedbackAccess(opts);

  if (!isFeedbackEligible(order.status)) {
    throw new FeedbackError(
      "Feedback opens once your order is delivered",
      400,
    );
  }

  if (order.feedback) {
    throw new FeedbackError("Feedback already submitted for this order", 409);
  }

  const displayName =
    opts.displayName?.trim() ||
    opts.customer?.name?.trim() ||
    order.customerName.trim() ||
    "Guest";

  const created = await prisma.feedback.create({
    data: {
      orderId: order.id,
      userId: opts.customer?.id ?? order.userId ?? null,
      rating: opts.rating,
      message: opts.message.trim(),
      displayName,
      place: order.shippingCity.trim() || null,
      status: FeedbackStatus.NEW,
    },
    include: { order: { select: { orderNumber: true } } },
  });

  return serializeFeedback(created);
}

export async function listFeedbackForAdmin(opts?: {
  status?: FeedbackStatusValue | null;
  limit?: number;
}) {
  const take = Math.min(100, Math.max(1, opts?.limit ?? 40));
  const where =
    opts?.status &&
    Object.values(FeedbackStatus).includes(opts.status as FeedbackStatus)
      ? { status: opts.status as FeedbackStatus }
      : {};

  const [rows, counts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { order: { select: { orderNumber: true } } },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.feedback.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  return {
    feedback: rows.map(serializeFeedback),
    counts: Object.fromEntries(
      counts.map((c) => [c.status, c._count._all]),
    ) as Record<string, number>,
  };
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatusValue,
) {
  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) throw new FeedbackError("Feedback not found", 404);

  const updated = await prisma.feedback.update({
    where: { id },
    data: { status: status as FeedbackStatus },
    include: { order: { select: { orderNumber: true } } },
  });
  return serializeFeedback(updated);
}

export async function listPublishedTestimonials(limit = 12) {
  const rows = await prisma.feedback.findMany({
    where: { status: FeedbackStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
    take: Math.min(24, Math.max(1, limit)),
  });
  return rows.map(toPublicTestimonial);
}
