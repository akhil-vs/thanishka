import assert from "node:assert/strict";
import { feedbackSubmitSchema } from "../src/lib/feedback/validators";
import { isFeedbackEligible } from "../src/lib/feedback/feedback";

assert.equal(isFeedbackEligible("DELIVERED"), true);
assert.equal(isFeedbackEligible("SHIPPED"), false);
assert.equal(isFeedbackEligible("PAID"), false);

const ok = feedbackSubmitSchema.parse({
  orderId: "ord_1",
  rating: 5,
  message: "Soft linen, exact colour as photos — loved the fit.",
  displayName: "Meera",
});
assert.equal(ok.rating, 5);

assert.throws(() =>
  feedbackSubmitSchema.parse({
    orderId: "ord_1",
    rating: 6,
    message: "Too short",
  }),
);

assert.throws(() =>
  feedbackSubmitSchema.parse({
    orderId: "ord_1",
    rating: 4,
    message: "short",
  }),
);

console.log("feedback validators ok");
