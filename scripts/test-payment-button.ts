import assert from "node:assert/strict";
import {
  PRODUCTION_RAZORPAY_PAYMENT_BUTTON_ID,
  RAZORPAY_PAYMENT_BUTTON_SRC,
  razorpayPaymentButtonId,
} from "../src/lib/checkout/payment-button";

const previous = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID;

try {
  assert.equal(
    RAZORPAY_PAYMENT_BUTTON_SRC,
    "https://checkout.razorpay.com/v1/payment-button.js",
  );
  assert.equal(
    PRODUCTION_RAZORPAY_PAYMENT_BUTTON_ID,
    "pl_U4sV5NkiaOQDVD",
  );

  delete process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID;
  assert.equal(razorpayPaymentButtonId(), "pl_U4sV5NkiaOQDVD");

  process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID = "pl_Override123";
  assert.equal(razorpayPaymentButtonId(), "pl_Override123");

  process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID = "not-a-button";
  assert.equal(razorpayPaymentButtonId(), "pl_U4sV5NkiaOQDVD");
} finally {
  if (previous === undefined) {
    delete process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID;
  } else {
    process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_BUTTON_ID = previous;
  }
}

console.log("payment button ok");
