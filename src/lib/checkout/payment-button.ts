/** Live Razorpay Payment Button. Public id, safe to ship in the client bundle. */
export const PRODUCTION_RAZORPAY_PAYMENT_BUTTON_ID = "pl_U4sV5NkiaOQDVD";

export const RAZORPAY_PAYMENT_BUTTON_SRC =
  "https://checkout.razorpay.com/v1/payment-button.js";

const BUTTON_ID = /^pl_[A-Za-z0-9]+$/;

/**
 * Production button unless NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID overrides it
 * with another Razorpay payment button id.
 */
export function razorpayPaymentButtonId() {
  const fromEnv = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID?.trim();
  if (fromEnv && BUTTON_ID.test(fromEnv)) return fromEnv;
  return PRODUCTION_RAZORPAY_PAYMENT_BUTTON_ID;
}
