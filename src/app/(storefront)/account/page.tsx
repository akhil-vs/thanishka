import { Suspense } from "react";
import type { Metadata } from "next";
import { getCustomerActor, publicUser } from "@/lib/auth/policy";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/checkout/orders";
import { AccountClient } from "./AccountClient";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

// Account reads the customer session cookie at request time.
export const instant = false;

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-20 font-serif text-muted">
          Loading account…
        </div>
      }
    >
      <AccountPageInner />
    </Suspense>
  );
}

async function AccountPageInner() {
  const user = await getCustomerActor();
  if (!user) {
    return <AccountClient initial={null} initialOrders={[]} />;
  }

  const [addresses, orders] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <AccountClient
      initial={{
        user: publicUser(user),
        addresses,
      }}
      initialOrders={orders.map(serializeOrder)}
    />
  );
}
