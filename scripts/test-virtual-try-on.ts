/**
 * Smoke checks for virtual try-on eligibility + request validation helpers.
 * Run: npx tsx scripts/test-virtual-try-on.ts
 */
import assert from "node:assert/strict";
import { isVirtualTryOnEligible } from "../src/lib/virtual-try-on/eligibility";
import { VTO_EXCLUDED_CATEGORY_SLUGS } from "../src/lib/virtual-try-on/constants";
import { generateVirtualTryOnPrompt } from "../src/lib/virtual-try-on/prompts";

assert.equal(isVirtualTryOnEligible("set-saree"), false);
assert.equal(isVirtualTryOnEligible("kurtis-sets"), true);
assert.equal(isVirtualTryOnEligible("party-western"), true);
assert.equal(isVirtualTryOnEligible("co-ords"), true);
assert.equal(isVirtualTryOnEligible("gowns-anarkalis"), true);
assert.ok(VTO_EXCLUDED_CATEGORY_SLUGS.includes("set-saree"));

const prompt = generateVirtualTryOnPrompt({
  productName: "Kasavu Whisper Anarkali",
  productDescription: "Crimson anarkali with kasavu border",
  fabric: "Chanderi silk blend",
  category: "Gowns & Anarkalis",
});
assert.match(prompt, /Kasavu Whisper Anarkali/);
assert.match(prompt, /Photo 1/);
assert.match(prompt, /Photo 2/);
assert.match(prompt, /saree/);

console.log("test-virtual-try-on: ok");
