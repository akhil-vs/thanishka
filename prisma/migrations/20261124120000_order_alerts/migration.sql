-- CreateEnum
CREATE TYPE "WhatsAppDelivery" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "order_alerts" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "whatsapp_status" "WhatsAppDelivery" NOT NULL DEFAULT 'PENDING',
    "whatsapp_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_alerts_order_id_key" ON "order_alerts"("order_id");

-- CreateIndex
CREATE INDEX "order_alerts_created_at_idx" ON "order_alerts"("created_at");

-- CreateIndex
CREATE INDEX "order_alerts_read_at_idx" ON "order_alerts"("read_at");

-- AddForeignKey
ALTER TABLE "order_alerts" ADD CONSTRAINT "order_alerts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
