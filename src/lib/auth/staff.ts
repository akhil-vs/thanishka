import { Role } from "@prisma/client";
import type { ActorUser } from "./types";
import { createSession, clearSession } from "./sessions";
import { hasAnyRole, primaryShopId, rolesOf } from "./users";

export async function createStaffSession(user: ActorUser) {
  if (!hasAnyRole(user, [Role.SHOP_OWNER, Role.SHOP_STAFF])) {
    throw new Error("User is not shop staff");
  }
  const roles = rolesOf(user).filter(
    (r) => r === Role.SHOP_OWNER || r === Role.SHOP_STAFF,
  );
  await createSession({
    sub: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    roles,
    shopId: primaryShopId(user),
    aud: "staff",
  });
}

export async function clearStaffSession() {
  await clearSession("staff");
}
