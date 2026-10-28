-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "category_slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "compare_at" INTEGER,
    "colors" JSONB NOT NULL,
    "fabric" TEXT NOT NULL,
    "occasion" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "care" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "sizes" JSONB NOT NULL,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "on_sale" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "note" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "admin_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "min_order" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT '',
    "subtitle" TEXT NOT NULL,
    "cta_label" TEXT NOT NULL,
    "cta_href" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "cta_label" TEXT NOT NULL,
    "cta_href" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

