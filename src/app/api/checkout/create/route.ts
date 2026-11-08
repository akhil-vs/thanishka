import { error, fromZod, json } from "@/lib/http";
import { getCustomerActor } from "@/lib/auth/policy";
import {
  CheckoutError,
  createCheckoutOrder,
} from "@/lib/checkout/orders";
import { createCheckoutSchema } from "@/lib/checkout/validators";

export async function POST(request: Request) {
  try {
    const body = createCheckoutSchema.parse(await request.json());
    const customer = await getCustomerActor();

    const result = await createCheckoutOrder({
      items: body.items,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      shippingLine1: body.shippingLine1,
      shippingLine2: body.shippingLine2,
      shippingCity: body.shippingCity,
      shippingState: body.shippingState,
      shippingPostalCode: body.shippingPostalCode,
      couponCode: body.couponCode,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      userId: customer?.id ?? null,
    });

    return json(result);
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    if (err instanceof CheckoutError) {
      return error(err.message, err.status);
    }
    console.error("[checkout/create]", err);
    const message =
      err instanceof Error ? err.message : "Unable to create checkout";
    return error(message, 500);
  }
}
