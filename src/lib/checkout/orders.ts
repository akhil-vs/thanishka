import {
  OrderStatus,
  PaymentMethod,
  type Discount,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { asSizeMap, asStringArray } from "@/lib/admin/types";
import { applyStockChange, type SizeKey } from "@/lib/admin/stock";
import { normalizePhone } from "@/lib/auth/phone";
import { revalidateCatalog } from "@/lib/catalog-revalidate";
import {
  computeOrderTotals,
  type PricedLine,
  toPaise,
} from "@/lib/checkout/pricing";
import { createOrderAccessToken } from "@/lib/checkout/access-token";
import type { SerializedOrder } from "@/lib/checkout/types";
import { getRazorpayClient, getRazorpayConfig } from "@/lib/razorpay";

export class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type CartInputItem = {
  productId: string;
  size: SizeKey;
  quantity: number;
};

type Tx = Prisma.TransactionClient;

async function incrementDiscountUse(tx: Tx, discountId: string) {
  const rows = await tx.$executeRaw`
    UPDATE discounts
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = ${discountId}
      AND (max_uses IS NULL OR used_count < max_uses)
  `;
  if (Number(rows) === 0) {
    throw new CheckoutError("This coupon has reached its usage limit");
  }
}

async function decrementDiscountUse(tx: Tx, discountId: string) {
  await tx.$executeRaw`
    UPDATE discounts
    SET used_count = GREATEST(0, used_count - 1), updated_at = NOW()
    WHERE id = ${discountId}
  `;
}

export async function resolveDiscount(code: string | null | undefined) {
  if (!code?.trim()) return null;
  const discount = await prisma.discount.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!discount || !discount.active) {
    throw new CheckoutError("Invalid or inactive coupon code");
  }
  const now = new Date();
  if (discount.startsAt && discount.startsAt > now) {
    throw new CheckoutError("This coupon is not active yet");
  }
  if (discount.endsAt && discount.endsAt < now) {
    throw new CheckoutError("This coupon has expired");
  }
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    throw new CheckoutError("This coupon has reached its usage limit");
  }
  return discount;
}

export async function priceCartItems(
  items: CartInputItem[],
): Promise<PricedLine[]> {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: PricedLine[] = [];
  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      throw new CheckoutError(`Product unavailable: ${item.productId}`);
    }
    const sizes = asSizeMap(product.sizes);
    const available = sizes[item.size] ?? 0;
    if (available < item.quantity) {
      throw new CheckoutError(
        `Insufficient stock for ${product.name} (size ${item.size})`,
      );
    }
    const images = asStringArray(product.images);
    lines.push({
      productId: product.id,
      size: item.size,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
      productName: product.name,
      productSlug: product.slug,
      productImage: images[0] ?? null,
    });
  }
  return lines;
}

function nextOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TH-${stamp}${rand}`;
}

export async function quoteCheckout(opts: {
  items: CartInputItem[];
  couponCode?: string | null;
}) {
  const lines = await priceCartItems(opts.items);
  let discount: Discount | null = null;
  let couponError: string | null = null;
  if (opts.couponCode?.trim()) {
    try {
      discount = await resolveDiscount(opts.couponCode);
    } catch (err) {
      couponError =
        err instanceof CheckoutError ? err.message : "Invalid coupon";
    }
  }
  const totals = computeOrderTotals({ lines, discount });
  return {
    lines,
    discount,
    couponError,
    ...totals,
  };
}

export type CreateCheckoutInput = {
  items: CartInputItem[];
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  couponCode?: string | null;
  paymentMethod: "razorpay" | "cod";
  notes?: string | null;
  userId?: string | null;
};

async function createOrderRecord(
  tx: Tx,
  input: CreateCheckoutInput,
  opts: {
    orderNumber: string;
    phone: string;
    lines: PricedLine[];
    discount: Discount | null;
    totals: ReturnType<typeof computeOrderTotals>;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
  },
) {
  return tx.order.create({
    data: {
      orderNumber: opts.orderNumber,
      userId: input.userId ?? null,
      status: opts.status,
      paymentMethod: opts.paymentMethod,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim() || null,
      customerPhone: opts.phone,
      shippingLine1: input.shippingLine1.trim(),
      shippingLine2: input.shippingLine2?.trim() || null,
      shippingCity: input.shippingCity.trim(),
      shippingState: input.shippingState.trim(),
      shippingPostalCode: input.shippingPostalCode.trim(),
      subtotal: opts.totals.subtotal,
      discountAmount: opts.totals.discountAmount,
      shippingAmount: opts.totals.shippingAmount,
      total: opts.totals.total,
      couponCode: opts.discount?.code ?? null,
      discountId: opts.discount?.id ?? null,
      notes: input.notes?.trim() || null,
      paidAt: null,
      items: {
        create: opts.lines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          productSlug: line.productSlug,
          productImage: line.productImage,
          size: line.size,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
      },
    },
    include: { items: true },
  });
}

export async function createCheckoutOrder(input: CreateCheckoutInput) {
  const phone = normalizePhone(input.customerPhone);
  if (!phone) {
    throw new CheckoutError("Enter a valid Indian mobile number");
  }

  const lines = await priceCartItems(input.items);
  const discount = await resolveDiscount(input.couponCode);
  if (discount && lines.reduce((s, l) => s + l.lineTotal, 0) < discount.minOrder) {
    throw new CheckoutError(
      `Coupon requires a minimum order of ₹${discount.minOrder}`,
    );
  }
  const totals = computeOrderTotals({ lines, discount });

  if (totals.total <= 0 && input.paymentMethod === "razorpay") {
    throw new CheckoutError("Order total must be greater than zero");
  }

  const orderNumber = nextOrderNumber();
  const razorpayCfg = getRazorpayConfig();

  if (input.paymentMethod === "cod") {
    const order = await prisma.$transaction(async (tx) => {
      const created = await createOrderRecord(tx, input, {
        orderNumber,
        phone,
        lines,
        discount,
        totals,
        status: OrderStatus.COD_CONFIRMED,
        paymentMethod: PaymentMethod.COD,
      });

      if (discount) {
        await incrementDiscountUse(tx, discount.id);
      }

      await reserveStockForOrder(created.id, tx);

      return created;
    });

    return {
      mode: "cod" as const,
      order: serializeOrder(order),
      accessToken: createOrderAccessToken(order.id),
    };
  }

  // Prepaid / Razorpay — hold stock + coupon at create so inventory/limits cannot oversell.
  const order = await prisma.$transaction(async (tx) => {
    const created = await createOrderRecord(tx, input, {
      orderNumber,
      phone,
      lines,
      discount,
      totals,
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: PaymentMethod.RAZORPAY,
    });
    if (discount) {
      await incrementDiscountUse(tx, discount.id);
    }
    await reserveStockForOrder(created.id, tx);
    return created;
  });

  if (razorpayCfg.mode === "dev") {
    return {
      mode: "dev" as const,
      order: serializeOrder(order),
      amountPaise: toPaise(order.total),
      currency: "INR",
      keyId: null as string | null,
      razorpayOrderId: null as string | null,
      accessToken: createOrderAccessToken(order.id),
    };
  }

  try {
    const rzp = getRazorpayClient();
    const rzOrder = await rzp.orders.create({
      amount: toPaise(order.total),
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: String(rzOrder.id) },
      include: { items: true },
    });

    return {
      mode: "razorpay" as const,
      order: serializeOrder(updated),
      amountPaise: toPaise(updated.total),
      currency: "INR",
      keyId: razorpayCfg.keyId,
      razorpayOrderId: String(rzOrder.id),
      accessToken: createOrderAccessToken(updated.id),
    };
  } catch (err) {
    // Release hold if Razorpay order creation fails after stock reservation.
    try {
      await cancelPendingOrder(order.id, "Razorpay order create failed");
    } catch (releaseErr) {
      console.error(
        `[checkout] failed to cancel after Razorpay error for ${order.id}`,
        releaseErr,
      );
    }
    console.error("[checkout] Razorpay order create failed", err);
    throw new CheckoutError("Unable to start payment. Please try again.", 502);
  }
}

export async function markOrderPaid(opts: {
  orderId: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
}) {
  const order = await prisma.order.findUnique({
    where: { id: opts.orderId },
    include: { items: true },
  });
  if (!order) throw new CheckoutError("Order not found", 404);

  if (
    order.status === OrderStatus.PAID ||
    order.status === OrderStatus.COD_CONFIRMED
  ) {
    return serializeOrder(order);
  }

  if (order.paymentMethod !== PaymentMethod.RAZORPAY) {
    throw new CheckoutError("Order is not a Razorpay payment");
  }

  if (order.status !== OrderStatus.PENDING_PAYMENT) {
    throw new CheckoutError(`Order cannot be paid (status: ${order.status})`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Conditional update — only one of verify/webhook wins the transition.
    const flipped = await tx.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING_PAYMENT,
      },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        razorpayOrderId: opts.razorpayOrderId ?? order.razorpayOrderId,
        razorpayPaymentId: opts.razorpayPaymentId ?? null,
        razorpaySignature: opts.razorpaySignature ?? null,
      },
    });

    if (flipped.count === 0) {
      const current = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });
      if (current?.status === OrderStatus.PAID) return current;
      throw new CheckoutError(
        `Order cannot be paid (status: ${current?.status ?? "unknown"})`,
      );
    }

    // Coupon was consumed at create; stock should already be held.
    const paid = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    if (!paid.stockReserved) {
      await reserveStockForOrder(paid.id, tx);
    }
    return paid;
  });

  return serializeOrder(updated);
}

export async function reserveStockForOrder(orderId: string, tx?: Tx) {
  const run = async (client: Tx) => {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.stockReserved) return;

    for (const item of order.items) {
      await applyStockChange({
        productId: item.productId,
        size: item.size as SizeKey,
        mode: "adjust",
        delta: -item.quantity,
        note: `Order ${order.orderNumber}`,
        source: "checkout",
        userId: order.userId,
        tx: client,
      });
    }

    await client.order.update({
      where: { id: orderId },
      data: { stockReserved: true },
    });
  };

  if (tx) return run(tx);
  return prisma.$transaction((client) => run(client));
}

export async function releaseStockForOrder(orderId: string, tx?: Tx) {
  const run = async (client: Tx) => {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || !order.stockReserved) return;

    for (const item of order.items) {
      await applyStockChange({
        productId: item.productId,
        size: item.size as SizeKey,
        mode: "adjust",
        delta: item.quantity,
        note: `Release ${order.orderNumber}`,
        source: "checkout_release",
        userId: order.userId,
        tx: client,
      });
    }

    await client.order.update({
      where: { id: orderId },
      data: { stockReserved: false },
    });
  };

  if (tx) return run(tx);
  return prisma.$transaction((client) => run(client));
}

/** Cancel a pending prepaid order and release any held stock. */
export async function cancelPendingOrder(orderId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new CheckoutError("Order not found", 404);

    if (order.status === OrderStatus.CANCELLED) {
      return serializeOrder(order);
    }

    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.status !== OrderStatus.PAYMENT_FAILED
    ) {
      throw new CheckoutError(
        `Only unpaid orders can be cancelled this way (status: ${order.status})`,
      );
    }

    await releaseStockForOrder(order.id, tx);
    if (order.discountId) {
      await decrementDiscountUse(tx, order.discountId);
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        notes: note
          ? [order.notes, note].filter(Boolean).join(" · ")
          : order.notes,
      },
      include: { items: true },
    });

    return serializeOrder(updated);
  });
}

export async function updateOrderFulfillmentStatus(opts: {
  orderId: string;
  status: OrderStatus;
}) {
  const allowed: OrderStatus[] = [
    OrderStatus.PACKED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ];
  if (!allowed.includes(opts.status)) {
    throw new CheckoutError("Unsupported status transition");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: opts.orderId },
      include: { items: true },
    });
    if (!order) throw new CheckoutError("Order not found", 404);

    if (opts.status === OrderStatus.CANCELLED) {
      if (
        order.status === OrderStatus.SHIPPED ||
        order.status === OrderStatus.DELIVERED
      ) {
        throw new CheckoutError("Cannot cancel a shipped or delivered order");
      }
      if (
        order.status === OrderStatus.PENDING_PAYMENT ||
        order.status === OrderStatus.PAYMENT_FAILED ||
        order.status === OrderStatus.PAID ||
        order.status === OrderStatus.COD_CONFIRMED ||
        order.status === OrderStatus.PACKED
      ) {
        await releaseStockForOrder(order.id, tx);
        // Prepaid coupons are consumed at create; release on unpaid cancel only.
        if (
          order.discountId &&
          (order.status === OrderStatus.PENDING_PAYMENT ||
            order.status === OrderStatus.PAYMENT_FAILED)
        ) {
          await decrementDiscountUse(tx, order.discountId);
        }
      }
    } else {
      const payableOk =
        order.status === OrderStatus.PAID ||
        order.status === OrderStatus.COD_CONFIRMED ||
        order.status === OrderStatus.PACKED ||
        order.status === OrderStatus.SHIPPED;
      if (!payableOk) {
        throw new CheckoutError(
          `Cannot move ${order.status} order to ${opts.status}`,
        );
      }
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: opts.status },
      include: { items: true },
    });
    return serializeOrder(updated);
  });
  revalidateCatalog();
}

export function serializeOrder(
  order: Prisma.OrderGetPayload<{ include: { items: true } }>,
): SerializedOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shipping: {
      line1: order.shippingLine1,
      line2: order.shippingLine2,
      city: order.shippingCity,
      state: order.shippingState,
      postalCode: order.shippingPostalCode,
    },
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    total: order.total,
    couponCode: order.couponCode,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    stockReserved: order.stockReserved,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      slug: item.productSlug,
      image: item.productImage,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  };
}

export type { SerializedOrder };
