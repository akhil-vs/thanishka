import { error, fromZod, json } from "@/lib/http";
import { getCustomerActor } from "@/lib/auth/policy";
import {
  FeedbackError,
  getFeedbackForOrder,
  submitFeedback,
} from "@/lib/feedback/feedback";
import { feedbackSubmitSchema } from "@/lib/feedback/validators";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return error("orderId is required", 400);

  const token =
    url.searchParams.get("t") ||
    url.searchParams.get("token") ||
    request.headers.get("x-order-access-token");

  try {
    const customer = await getCustomerActor();
    const data = await getFeedbackForOrder({
      orderId,
      customer,
      accessToken: token,
    });
    return json(data);
  } catch (err) {
    if (err instanceof FeedbackError) {
      return error(err.message, err.status);
    }
    console.error("[feedback GET]", err);
    return error("Unable to load feedback", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = feedbackSubmitSchema.parse(await request.json());
    const customer = await getCustomerActor();
    const headerToken = request.headers.get("x-order-access-token");
    const feedback = await submitFeedback({
      orderId: body.orderId,
      rating: body.rating,
      message: body.message,
      displayName: body.displayName,
      customer,
      accessToken: body.accessToken ?? headerToken,
    });
    return json({ feedback }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    if (err instanceof FeedbackError) {
      return error(err.message, err.status);
    }
    console.error("[feedback POST]", err);
    return error("Unable to submit feedback", 500);
  }
}
