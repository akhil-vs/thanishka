import {
  requireBackoffice,
  json,
  error,
  fromZod,
} from "@/lib/admin/http";
import {
  FeedbackError,
  updateFeedbackStatus,
} from "@/lib/feedback/feedback";
import { feedbackStatusSchema } from "@/lib/feedback/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { response } = await requireBackoffice();
  if (response) return response;

  try {
    const { id } = await context.params;
    const body = feedbackStatusSchema.parse(await request.json());
    const feedback = await updateFeedbackStatus(id, body.status);
    return json({ feedback });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    if (err instanceof FeedbackError) {
      return error(err.message, err.status);
    }
    console.error("[admin/feedback/:id]", err);
    return error("Unable to update feedback", 500);
  }
}
