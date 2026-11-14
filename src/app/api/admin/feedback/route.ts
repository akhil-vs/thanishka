import { FeedbackStatus } from "@prisma/client";
import { requireBackoffice, json } from "@/lib/admin/http";
import { listFeedbackForAdmin } from "@/lib/feedback/feedback";
import type { FeedbackStatusValue } from "@/lib/feedback/types";

export async function GET(request: Request) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam &&
    Object.values(FeedbackStatus).includes(statusParam as FeedbackStatus)
      ? (statusParam as FeedbackStatusValue)
      : null;
  const limit = Number(url.searchParams.get("limit") || 60);

  const data = await listFeedbackForAdmin({
    status,
    limit: Number.isFinite(limit) ? limit : 60,
  });
  return json(data);
}
