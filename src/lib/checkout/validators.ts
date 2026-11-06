import { z } from "zod";

const sizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  size: sizeSchema,
  quantity: z.number().int().min(1).max(20),
});

export const createCheckoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(40),
  customerName: z.string().min(2).max(80),
  customerEmail: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email().optional(),
  ),
  customerPhone: z.string().min(8).max(20),
  shippingLine1: z.string().min(3).max(120),
  shippingLine2: z.string().max(120).optional().nullable(),
  shippingCity: z.string().min(2).max(80),
  shippingState: z.string().min(2).max(80).default("Kerala"),
  shippingPostalCode: z.string().min(4).max(12),
  couponCode: z.string().max(40).optional().nullable(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  notes: z.string().max(400).optional().nullable(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1).optional(),
  razorpayPaymentId: z.string().min(1).optional(),
  razorpaySignature: z.string().min(1).optional(),
  /** Dev-only simulated payment when Razorpay keys are not configured. */
  devComplete: z.boolean().optional(),
});

export const quoteCheckoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1).max(40),
  couponCode: z.string().max(40).optional().nullable(),
});
