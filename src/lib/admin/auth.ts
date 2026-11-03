import { Role } from "@prisma/client";
import {
  clearSession,
  createSession,
  readSession,
  ADMIN_COOKIE,
} from "@/lib/auth/sessions";
import { verifyPassword } from "@/lib/auth/passwords";
import type { ActorUser } from "@/lib/auth/types";
import { getUserById, hasRole, publicUser, rolesOf } from "@/lib/auth/users";
import { getAdminActor } from "@/lib/auth/policy";

export { ADMIN_COOKIE };

export async function createAdminSession(user: ActorUser) {
  if (!hasRole(user, Role.ADMIN)) {
    throw new Error("User is not an admin");
  }
  await createSession({
    sub: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    roles: rolesOf(user).filter((r) => r === Role.ADMIN),
    shopId: null,
    aud: "admin",
  });
}

export async function clearAdminSession() {
  await clearSession("admin");
}

export async function getAdminFromSession() {
  return getAdminActor();
}

export function verifyAdminPassword(user: ActorUser, password: string) {
  return verifyPassword(user.passwordHash, password);
}

export function publicAdmin(user: ActorUser) {
  return publicUser(user);
}

export async function peekAdminSession() {
  return readSession("admin");
}

export { getUserById };
