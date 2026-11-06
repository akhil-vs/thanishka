import { error, fromZod, json } from "@/lib/http";
import {
  CheckoutError,
  markOrderPaid,
} from "@/lib/checkout/orders";
import { verifyPaymentSchema } from "@/lib/checkout/validators";
import {
  getRazorpayConfig,
  isRazorpayDevMode,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { prisma } from "@/lib/db";
import { OrderStatus, PaymentMethod } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = verifyPaymentSchema.parse(await request.json());
    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      include: { items: true },
    });

    if (!order) return error("Order not found", 404);
    if (order.paymentMethod !== PaymentMethod.RAZORPAY) {
      return error("Order is not awaiting Razorpay payment");
    }

    if (order.status === OrderStatus.PAID) {
      const { serializeOrder } = await import("@/lib/checkout/orders");
      return json({ order: serializeOrder(order), alreadyPaid: true });
    }

    if (body.devComplete) {
      if (!isRazorpayDevMode()) {
        return error("Dev checkout is disabled", 403);
      }
      const paid = await markOrderPaid({
        orderId: order.id,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: `dev_pay_${order.id}`,
        razorpaySignature: "dev",
      });
      return json({ order: paid, mode: "dev" });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return error("Missing Razorpay payment fields");
    }

    if (
      order.razorpayOrderId &&
      order.razorpayOrderId !== razorpayOrderId
    ) {
      return error("Razorpay order mismatch", 400);
    }

    getRazorpayConfig(); // ensures keys exist in production
    const ok = verifyRazorpayPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!ok) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAYMENT_FAILED },
      });
      return error("Payment signature verification failed", 400);
    }

    const paid = await markOrderPaid({
      orderId: order.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return json({ order: paid, mode: "razorpay" });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    if (err instanceof CheckoutError) {
      return error(err.message, err.status);
    }
    console.error("[checkout/verify]", err);
    return error("Unable to verify payment", 500);
  }
}
