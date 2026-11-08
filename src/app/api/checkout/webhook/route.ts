import { error, json } from "@/lib/http";
import { prisma } from "@/lib/db";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { markOrderPaid } from "@/lib/checkout/orders";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

/**
 * Razorpay webhook — configure URL as /api/checkout/webhook
 * and enable payment.captured (and optionally order.paid).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return error("Invalid webhook signature", 401);
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return error("Invalid JSON body", 400);
  }

  const event = payload.event;
  if (event !== "payment.captured" && event !== "order.paid") {
    return json({ received: true, ignored: event ?? null });
  }

  const payment = payload.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  const razorpayPaymentId = payment?.id;

  if (!razorpayOrderId || !razorpayPaymentId) {
    return json({ received: true, skipped: "missing ids" });
  }

  const order = await prisma.order.findFirst({
    where: {
      razorpayOrderId,
      paymentMethod: PaymentMethod.RAZORPAY,
    },
    include: { items: true },
  });

  if (!order) {
    return json({ received: true, skipped: "order not found" });
  }

  if (order.status === OrderStatus.PAID) {
    return json({ received: true, alreadyPaid: true });
  }

  await markOrderPaid({
    orderId: order.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: signature,
  });

  return json({ received: true, orderId: order.id });
}
