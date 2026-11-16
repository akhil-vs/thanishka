import assert from "node:assert/strict";
import {
  assertProductPricing,
  productInputSchema,
  productPricingSchema,
} from "../src/lib/admin/validators";

assert.doesNotThrow(() => assertProductPricing(2999, null));
assert.doesNotThrow(() => assertProductPricing(2999, 3999));
assert.throws(
  () => assertProductPricing(2999, 2999),
  /higher than the selling price/,
);
assert.throws(
  () => assertProductPricing(2999, 1999),
  /higher than the selling price/,
);

const priced = productPricingSchema.parse({
  price: 3499,
  compareAt: 4199,
  onSale: true,
});
assert.equal(priced.price, 3499);
assert.equal(priced.compareAt, 4199);

assert.throws(() =>
  productPricingSchema.parse({
    price: 3499,
    compareAt: 3000,
  }),
);

const partial = productInputSchema.partial().parse({
  price: 4500,
  compareAt: null,
  onSale: false,
});
assert.equal(partial.price, 4500);
assert.equal(partial.compareAt, null);

console.log("product pricing assertions passed");
