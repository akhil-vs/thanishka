-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SHOP_OWNER', 'SHOP_STAFF', 'CUSTOMER');

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "gstin" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "shop_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "user_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Home',
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Kerala',
    "postal_code" TEXT NOT NULL,
    "phone" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "role_assignments_user_id_idx" ON "role_assignments"("user_id");

-- CreateIndex
CREATE INDEX "role_assignments_shop_id_idx" ON "role_assignments"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignments_user_id_role_shop_id_key" ON "role_assignments"("user_id", "role", "shop_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE INDEX "otp_challenges_phone_created_at_idx" ON "otp_challenges"("phone", "created_at");

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default shop + migrate legacy admins → users
INSERT INTO "shops" ("id", "slug", "name", "phone", "whatsapp", "active", "created_at", "updated_at")
VALUES (
  'shop_thanishka_default',
  'thanishka',
  'Thanishka',
  NULL,
  NULL,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO "users" ("id", "email", "phone", "name", "password_hash", "active", "created_at", "updated_at")
SELECT
  a."id",
  a."email",
  NULL,
  a."name",
  a."password_hash",
  true,
  a."created_at",
  CURRENT_TIMESTAMP
FROM "admins" a;

INSERT INTO "role_assignments" ("id", "user_id", "role", "shop_id", "created_at")
SELECT
  'role_admin_' || a."id",
  a."id",
  'ADMIN'::"Role",
  NULL,
  CURRENT_TIMESTAMP
FROM "admins" a;

INSERT INTO "role_assignments" ("id", "user_id", "role", "shop_id", "created_at")
SELECT
  'role_owner_' || a."id",
  a."id",
  'SHOP_OWNER'::"Role",
  'shop_thanishka_default',
  CURRENT_TIMESTAMP
FROM "admins" a;

-- Stock movements: admin_id → user_id
ALTER TABLE "stock_movements" ADD COLUMN "user_id" TEXT;

UPDATE "stock_movements" sm
SET "user_id" = sm."admin_id"
WHERE sm."admin_id" IS NOT NULL;

ALTER TABLE "stock_movements" DROP CONSTRAINT IF EXISTS "stock_movements_admin_id_fkey";
DROP INDEX IF EXISTS "stock_movements_admin_id_idx";
ALTER TABLE "stock_movements" DROP COLUMN "admin_id";

CREATE INDEX "stock_movements_user_id_idx" ON "stock_movements"("user_id");

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop legacy admins
DROP TABLE "admins";
