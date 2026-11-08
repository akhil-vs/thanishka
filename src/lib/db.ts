import { PrismaClient } from "@prisma/client";
import { ensureDatabaseUrl } from "@/lib/env";

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type {
  User,
  Shop,
  RoleAssignment,
  CustomerProfile,
  Address,
  OtpChallenge,
  Product,
  Discount,
  Offer,
  HeroSlide,
  StockMovement,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Role,
} from "@prisma/client";
