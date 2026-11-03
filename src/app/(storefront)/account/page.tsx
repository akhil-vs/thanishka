import { Suspense } from "react";
import type { Metadata } from "next";
import { getCustomerActor, publicUser } from "@/lib/auth/policy";
import { prisma } from "@/lib/db";
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
    return <AccountClient initial={null} />;
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AccountClient
      initial={{
        user: publicUser(user),
        addresses,
      }}
    />
  );
}
