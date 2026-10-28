import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  categorySlug: text("category_slug").notNull(),
  price: integer("price").notNull(),
  compareAt: integer("compare_at"),
  colors: text("colors", { mode: "json" }).$type<string[]>().notNull(),
  fabric: text("fabric").notNull(),
  occasion: text("occasion", { mode: "json" }).$type<string[]>().notNull(),
  description: text("description").notNull(),
  care: text("care").notNull(),
  images: text("images", { mode: "json" }).$type<string[]>().notNull(),
  sizes: text("sizes", { mode: "json" })
    .$type<Record<string, number>>()
    .notNull(),
  isNew: integer("is_new", { mode: "boolean" }).notNull().default(false),
  onSale: integer("on_sale", { mode: "boolean" }).notNull().default(false),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const stockMovements = sqliteTable("stock_movements", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  delta: integer("delta").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  note: text("note"),
  source: text("source").notNull().default("manual"),
  adminId: text("admin_id").references(() => admins.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const discounts = sqliteTable("discounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  type: text("type").notNull(), // percent | fixed
  value: real("value").notNull(),
  minOrder: integer("min_order").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const offers = sqliteTable("offers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  eyebrow: text("eyebrow").notNull().default(""),
  subtitle: text("subtitle").notNull(),
  ctaLabel: text("cta_label").notNull(),
  ctaHref: text("cta_href").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const heroSlides = sqliteTable("hero_slides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  ctaLabel: text("cta_label").notNull(),
  ctaHref: text("cta_href").notNull(),
  imageUrl: text("image_url").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Admin = typeof admins.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
