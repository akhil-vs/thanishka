import { Role } from "@prisma/client";
import type { ActorUser } from "./types";
import { createSession, clearSession } from "./sessions";
import { hasRole, rolesOf } from "./users";

export async function createCustomerSession(user: ActorUser) {
  if (!hasRole(user, Role.CUSTOMER)) {
    throw new Error("User is not a customer");
  }
  await createSession({
    sub: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    roles: rolesOf(user).filter((r) => r === Role.CUSTOMER),
    shopId: null,
    aud: "customer",
  });
}

export async function clearCustomerSession() {
  await clearSession("customer");
}
