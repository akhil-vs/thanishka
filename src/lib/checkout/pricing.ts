import type { Discount } from "@prisma/client";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "./constants";

export type PricedLine = {
  productId: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
};

export function computeDiscountAmount(
  subtotal: number,
  discount: Pick<Discount, "type" | "value" | "minOrder"> | null,
): number {
  if (!discount || subtotal < discount.minOrder) return 0;
  if (discount.type === "percent") {
    return Math.min(subtotal, Math.round((subtotal * discount.value) / 100));
  }
  if (discount.type === "fixed") {
    return Math.min(subtotal, Math.round(discount.value));
  }
  return 0;
}

export function computeShippingAmount(merchandiseAfterDiscount: number): number {
  if (merchandiseAfterDiscount <= 0) return 0;
  if (merchandiseAfterDiscount >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEE;
}

export function computeOrderTotals(opts: {
  lines: Array<{ unitPrice: number; quantity: number }>;
  discount: Pick<Discount, "type" | "value" | "minOrder"> | null;
}) {
  const subtotal = opts.lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const discountAmount = computeDiscountAmount(subtotal, opts.discount);
  const shippingAmount = computeShippingAmount(subtotal - discountAmount);
  const total = Math.max(0, subtotal - discountAmount + shippingAmount);
  return { subtotal, discountAmount, shippingAmount, total };
}

/** Razorpay expects amount in the smallest currency unit (paise for INR). */
export function toPaise(rupees: number) {
  return Math.round(rupees * 100);
}
