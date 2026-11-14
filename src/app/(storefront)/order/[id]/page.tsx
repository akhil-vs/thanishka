import { Suspense } from "react";
import { OrderConfirmation } from "@/components/cart/OrderConfirmation";

// Order confirmation is request-time (params + client fetch).
export const instant = false;

export default function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; token?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-xl py-24 text-center font-serif text-muted">
          Loading order…
        </div>
      }
    >
      <OrderPageInner params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderPageInner({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; token?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const accessToken = query.t || query.token || null;
  return <OrderConfirmation orderId={id} accessToken={accessToken} />;
}
