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
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId ?? null,
          status: OrderStatus.COD_CONFIRMED,
          paymentMethod: PaymentMethod.COD,
          customerName: input.customerName.trim(),
          customerEmail: input.customerEmail?.trim() || null,
          customerPhone: phone,
          shippingLine1: input.shippingLine1.trim(),
          shippingLine2: input.shippingLine2?.trim() || null,
          shippingCity: input.shippingCity.trim(),
          shippingState: input.shippingState.trim(),
          shippingPostalCode: input.shippingPostalCode.trim(),
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          shippingAmount: totals.shippingAmount,
          total: totals.total,
          couponCode: discount?.code ?? null,
          discountId: discount?.id ?? null,
          notes: input.notes?.trim() || null,
          paidAt: null,
          items: {
            create: lines.map((line) => ({
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

      if (discount) {
        await tx.discount.update({
          where: { id: discount.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    try {
      await reserveStockForOrder(order.id);
    } catch (err) {
      console.error(`[checkout] COD stock reserve failed for ${order.id}`, err);
    }

    return {
      mode: "cod" as const,
      order: serializeOrder(
        (await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: true },
        })) ?? order,
      ),
    };
  }

  // Prepaid / Razorpay path
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: input.userId ?? null,
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: PaymentMethod.RAZORPAY,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail?.trim() || null,
      customerPhone: phone,
      shippingLine1: input.shippingLine1.trim(),
      shippingLine2: input.shippingLine2?.trim() || null,
      shippingCity: input.shippingCity.trim(),
      shippingState: input.shippingState.trim(),
      shippingPostalCode: input.shippingPostalCode.trim(),
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      shippingAmount: totals.shippingAmount,
      total: totals.total,
      couponCode: discount?.code ?? null,
      discountId: discount?.id ?? null,
      notes: input.notes?.trim() || null,
      items: {
        create: lines.map((line) => ({
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

  if (razorpayCfg.mode === "dev") {
    return {
      mode: "dev" as const,
      order: serializeOrder(order),
      amountPaise: toPaise(order.total),
      currency: "INR",
      keyId: null as string | null,
      razorpayOrderId: null as string | null,
    };
  }

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
  };
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
    const paid = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        razorpayOrderId: opts.razorpayOrderId ?? order.razorpayOrderId,
        razorpayPaymentId: opts.razorpayPaymentId ?? null,
        razorpaySignature: opts.razorpaySignature ?? null,
      },
      include: { items: true },
    });

    if (order.discountId) {
      await tx.discount.update({
        where: { id: order.discountId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return paid;
  });

  try {
    await reserveStockForOrder(updated.id);
  } catch (err) {
    // Payment already succeeded — do not roll back PAID; ops can reconcile stock.
    console.error(`[checkout] stock reserve failed for ${updated.id}`, err);
  }
  return serializeOrder(
    (await prisma.order.findUnique({
      where: { id: updated.id },
      include: { items: true },
    })) ?? updated,
  );
}

export async function reserveStockForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
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
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { stockReserved: true },
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
