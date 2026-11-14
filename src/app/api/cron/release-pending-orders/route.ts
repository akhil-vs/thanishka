import { error, json } from "@/lib/http";
import { PENDING_PAYMENT_HOLD_MINUTES } from "@/lib/checkout/constants";
import { releaseExpiredPendingOrders } from "@/lib/checkout/orders";

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Local / unset: allow in non-production so owners can smoke-test.
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(request.url).searchParams.get("secret") || "";
  return bearer === secret || query === secret;
}

async function run(request: Request) {
  if (!authorizeCron(request)) {
    return error("Unauthorized", 401);
  }

  try {
    const url = new URL(request.url);
    const minutesRaw = url.searchParams.get("minutes");
    const olderThanMinutes = minutesRaw
      ? Number(minutesRaw)
      : PENDING_PAYMENT_HOLD_MINUTES;
    const result = await releaseExpiredPendingOrders({
      olderThanMinutes: Number.isFinite(olderThanMinutes)
        ? olderThanMinutes
        : PENDING_PAYMENT_HOLD_MINUTES,
    });
    return json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/release-pending-orders]", err);
    return error("Release job failed", 500);
  }
}

/** Vercel Cron invokes GET. */
export async function GET(request: Request) {
  return run(request);
}

/** Manual / ops trigger. */
export async function POST(request: Request) {
  return run(request);
}
