import crypto from "node:crypto";
import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

export type RazorpayMode = "live" | "dev";

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";
  const forceDev = process.env.RAZORPAY_DEV_MODE === "true";
  const hasKeys = Boolean(keyId && keySecret);
  const isProd = process.env.NODE_ENV === "production";
  const allowTestKeys = process.env.ALLOW_RAZORPAY_TEST_KEYS === "true";

  if (forceDev && isProd) {
    throw new Error(
      "RAZORPAY_DEV_MODE is not allowed in production — unset it and use live keys",
    );
  }

  let mode: RazorpayMode = "live";
  if (forceDev) {
    mode = "dev";
  } else if (!hasKeys) {
    if (isProd) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in production",
      );
    }
    mode = "dev";
  }

  if (mode === "live" && isProd) {
    if (keyId.startsWith("rzp_test_") && !allowTestKeys) {
      throw new Error(
        "Live Razorpay keys (rzp_live_*) are required in production. Set ALLOW_RAZORPAY_TEST_KEYS=true only for staging.",
      );
    }
    if (!webhookSecret) {
      throw new Error(
        "RAZORPAY_WEBHOOK_SECRET is required in production for payment.captured recovery",
      );
    }
  }

  return { keyId, keySecret, webhookSecret, mode, hasKeys };
}

export function getRazorpayClient() {
  const { keyId, keySecret, mode } = getRazorpayConfig();
  if (mode !== "live") {
    throw new Error("Razorpay client unavailable in dev mode");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function verifyRazorpayPaymentSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { keySecret } = getRazorpayConfig();
  if (!keySecret) return false;
  return validatePaymentVerification(
    { order_id: opts.orderId, payment_id: opts.paymentId },
    opts.signature,
    keySecret,
  );
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
) {
  const { webhookSecret } = getRazorpayConfig();
  if (!webhookSecret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

export function isRazorpayDevMode() {
  return getRazorpayConfig().mode === "dev";
}
