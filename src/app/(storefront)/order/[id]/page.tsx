import { Suspense } from "react";
import { OrderConfirmation } from "@/components/cart/OrderConfirmation";

// Order confirmation is request-time (params + client fetch).
export const instant = false;

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-xl py-24 text-center font-serif text-muted">
          Loading order…
        </div>
      }
    >
      <OrderPageInner params={params} />
    </Suspense>
  );
}

async function OrderPageInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderConfirmation orderId={id} />;
}
