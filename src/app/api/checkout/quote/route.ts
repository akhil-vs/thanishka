import { error, fromZod, json } from "@/lib/http";
import { quoteCheckout, CheckoutError } from "@/lib/checkout/orders";
import { quoteCheckoutSchema } from "@/lib/checkout/validators";

export async function POST(request: Request) {
  try {
    const body = quoteCheckoutSchema.parse(await request.json());
    const quote = await quoteCheckout({
      items: body.items,
      couponCode: body.couponCode,
      customer: {
        phone: body.customerPhone,
        email: body.customerEmail || null,
      },
    });
    return json({
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      shippingAmount: quote.shippingAmount,
      total: quote.total,
      couponCode: quote.discount?.code ?? null,
      couponLabel: quote.discount?.label ?? null,
      couponError: quote.couponError,
      freeShippingThreshold: 1999,
    });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    if (err instanceof CheckoutError) {
      return error(err.message, err.status);
    }
    console.error("[checkout/quote]", err);
    return error("Unable to quote checkout", 500);
  }
}
