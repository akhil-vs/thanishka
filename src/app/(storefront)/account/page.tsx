import { getCustomerActor, publicUser } from "@/lib/auth/policy";
import { prisma } from "@/lib/db";
import { AccountClient } from "./AccountClient";

export default async function AccountPage() {
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
