import { Suspense } from "react";
import { getCustomerActor, publicUser } from "@/lib/auth/policy";
import { prisma } from "@/lib/db";
import { AccountClient } from "./AccountClient";

// Session cookie is read at request time.
export const instant = false;

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-md py-16">
          <p className="font-serif text-muted">Loading account…</p>
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
