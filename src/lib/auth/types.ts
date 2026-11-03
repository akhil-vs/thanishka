import type { Role, Shop, User } from "@prisma/client";

export type AuthAudience = "admin" | "staff" | "customer";

export type SessionClaims = {
  sub: string;
  email?: string | null;
  phone?: string | null;
  name: string;
  roles: Role[];
  shopId?: string | null;
  aud: AuthAudience;
};

export type ActorUser = User & {
  roleAssignments: Array<{
    id: string;
    role: Role;
    shopId: string | null;
    shop: Shop | null;
  }>;
};

export type PublicUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  roles: Role[];
  shopId: string | null;
};
