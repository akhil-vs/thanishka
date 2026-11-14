import { requireBackoffice, json, error } from "@/lib/admin/http";
import {
  getAnalyticsPayload,
  resolveAnalyticsRange,
} from "@/lib/admin/analytics";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const compare = url.searchParams.get("compare") !== "0";

  try {
    resolveAnalyticsRange({ from, to });
  } catch (err) {
    return error(err instanceof Error ? err.message : "Invalid range", 400);
  }

  const payload = await getAnalyticsPayload(prisma, { from, to, compare });
  return json(payload);
}
