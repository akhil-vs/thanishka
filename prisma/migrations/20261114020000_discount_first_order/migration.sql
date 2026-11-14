-- AlterTable
ALTER TABLE "discounts" ADD COLUMN "first_order_only" BOOLEAN NOT NULL DEFAULT false;

-- Backfill welcome coupon so marketing copy matches checkout rules.
UPDATE "discounts"
SET "first_order_only" = true
WHERE UPPER("code") = 'THANISHKA10';
