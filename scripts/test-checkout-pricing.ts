import assert from "node:assert/strict";
import {
  computeDiscountAmount,
  computeOrderTotals,
  computeShippingAmount,
  toPaise,
} from "../src/lib/checkout/pricing";

assert.equal(computeShippingAmount(500), 99);
assert.equal(computeShippingAmount(1999), 0);
assert.equal(computeShippingAmount(0), 0);

assert.equal(
  computeDiscountAmount(5000, { type: "percent", value: 10, minOrder: 0 }),
  500,
);
assert.equal(
  computeDiscountAmount(500, { type: "fixed", value: 200, minOrder: 0 }),
  200,
);
assert.equal(
  computeDiscountAmount(100, { type: "percent", value: 10, minOrder: 500 }),
  0,
);

const totals = computeOrderTotals({
  lines: [
    { unitPrice: 2999, quantity: 1 },
    { unitPrice: 500, quantity: 2 },
  ],
  discount: { type: "percent", value: 10, minOrder: 0 },
});
assert.equal(totals.subtotal, 3999);
assert.equal(totals.discountAmount, 400);
assert.equal(totals.shippingAmount, 0); // 3999-400 = 3599 >= 1999
assert.equal(totals.total, 3599);
assert.equal(toPaise(3599), 359900);

console.log("checkout pricing ok");
