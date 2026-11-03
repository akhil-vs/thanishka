import { Role } from "@prisma/client";
import { error } from "@/lib/http";
import { getUserById, hasAnyRole, hasRole, primaryShopId, publicUser } from "./users";
import { clearSession, readSession } from "./sessions";
import type { ActorUser, AuthAudience } from "./types";

async function loadAudienceUser(
  audience: AuthAudience,
  allowed: Role[],
): Promise<ActorUser | null> {
  const session = await readSession(audience);
  if (!session) return null;
  const user = await getUserById(session.sub);
  if (!user || !user.active) {
    await clearSession(audience);
    return null;
  }
  if (!hasAnyRole(user, allowed)) {
    await clearSession(audience);
    return null;
  }
  return user;
}

export async function getAdminActor() {
  return loadAudienceUser("admin", [Role.ADMIN]);
}

export async function getStaffActor() {
  return loadAudienceUser("staff", [Role.SHOP_OWNER, Role.SHOP_STAFF]);
}

export async function getCustomerActor() {
  return loadAudienceUser("customer", [Role.CUSTOMER]);
}

/** Admin cookie OR staff cookie — for shared catalogue/stock APIs. */
export async function getBackofficeActor() {
  const admin = await getAdminActor();
  if (admin) return { user: admin, audience: "admin" as const };
  const staff = await getStaffActor();
  if (staff) return { user: staff, audience: "staff" as const };
  return null;
}

export async function requireAdmin() {
  const user = await getAdminActor();
  if (!user) {
    return { user: null as null, response: error("Unauthorized", 401) };
  }
  return { user, response: null as null };
}

export async function requireStaff() {
  const user = await getStaffActor();
  if (!user) {
    return { user: null as null, response: error("Unauthorized", 401) };
  }
  return { user, response: null as null };
}

export async function requireCustomer() {
  const user = await getCustomerActor();
  if (!user) {
    return { user: null as null, response: error("Unauthorized", 401) };
  }
  return { user, response: null as null };
}

export async function requireBackoffice() {
  const actor = await getBackofficeActor();
  if (!actor) {
    return {
      user: null as null,
      audience: null as null,
      response: error("Unauthorized", 401),
    };
  }
  return {
    user: actor.user,
    audience: actor.audience,
    response: null as null,
  };
}

export function assertShopAccess(user: ActorUser, shopId: string | null | undefined) {
  if (hasRole(user, Role.ADMIN)) return true;
  if (!shopId) return false;
  return user.roleAssignments.some(
    (r) =>
      (r.role === Role.SHOP_OWNER || r.role === Role.SHOP_STAFF) &&
      r.shopId === shopId,
  );
}

export function actorShopId(user: ActorUser) {
  return primaryShopId(user);
}

export { publicUser };
