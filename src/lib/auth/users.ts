import { Role, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ActorUser, PublicUser } from "./types";

const actorInclude = {
  roleAssignments: {
    include: { shop: true },
  },
} satisfies Prisma.UserInclude;

export async function getUserById(id: string): Promise<ActorUser | null> {
  return prisma.user.findUnique({
    where: { id },
    include: actorInclude,
  });
}

export function rolesOf(user: ActorUser): Role[] {
  return user.roleAssignments.map((r) => r.role);
}

export function primaryShopId(user: ActorUser): string | null {
  const owned =
    user.roleAssignments.find((r) => r.role === Role.SHOP_OWNER && r.shopId) ??
    user.roleAssignments.find((r) => r.role === Role.SHOP_STAFF && r.shopId);
  return owned?.shopId ?? null;
}

export function hasRole(user: ActorUser, role: Role) {
  return user.roleAssignments.some((r) => r.role === role);
}

export function hasAnyRole(user: ActorUser, roles: Role[]) {
  return roles.some((role) => hasRole(user, role));
}

export function publicUser(user: ActorUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    roles: rolesOf(user),
    shopId: primaryShopId(user),
  };
}

export async function ensureShop(): Promise<{ id: string; slug: string; name: string }> {
  const existing = await prisma.shop.findUnique({ where: { slug: "thanishka" } });
  if (existing) return existing;
  return prisma.shop.create({
    data: {
      id: "shop_thanishka_default",
      slug: "thanishka",
      name: "Thanishka",
    },
  });
}

export async function ensureCustomerUser(opts: {
  phone?: string | null;
  email?: string | null;
  name?: string;
  passwordHash?: string | null;
}): Promise<ActorUser> {
  const phone = opts.phone ?? null;
  const email = opts.email?.toLowerCase() ?? null;

  let user =
    (phone
      ? await prisma.user.findUnique({ where: { phone }, include: actorInclude })
      : null) ??
    (email
      ? await prisma.user.findUnique({ where: { email }, include: actorInclude })
      : null);

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        email,
        name: opts.name ?? "Thanishka customer",
        passwordHash: opts.passwordHash ?? null,
        customerProfile: { create: {} },
        roleAssignments: {
          create: [{ role: Role.CUSTOMER }],
        },
      },
      include: actorInclude,
    });
    return user;
  }

  if (!hasRole(user, Role.CUSTOMER)) {
    await prisma.roleAssignment.create({
      data: { userId: user.id, role: Role.CUSTOMER },
    });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    await prisma.customerProfile.create({ data: { userId: user.id } });
  }

  if (opts.passwordHash && !user.passwordHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: opts.passwordHash },
    });
  }

  if (opts.name && user.name === "Thanishka customer") {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: opts.name },
    });
  }

  const refreshed = await getUserById(user.id);
  if (!refreshed) throw new Error("User missing after ensure");
  return refreshed;
}
