import crypto from "node:crypto";

function accessSecret() {
  const secret =
    process.env.ORDER_ACCESS_SECRET?.trim() ||
    process.env.CUSTOMER_JWT_SECRET?.trim() ||
    process.env.ADMIN_JWT_SECRET?.trim() ||
    "";
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ORDER_ACCESS_SECRET or CUSTOMER_JWT_SECRET is required in production",
      );
    }
    return "thanishka-dev-order-access";
  }
  return secret;
}

/** Opaque guest token so /order/[id] is not guessable by cuid alone. */
export function createOrderAccessToken(orderId: string) {
  return crypto
    .createHmac("sha256", accessSecret())
    .update(`order:${orderId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyOrderAccessToken(orderId: string, token: string | null | undefined) {
  if (!token || typeof token !== "string") return false;
  const expected = createOrderAccessToken(orderId);
  if (expected.length !== token.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(token),
    );
  } catch {
    return false;
  }
}
