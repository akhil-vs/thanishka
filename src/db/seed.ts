import { hashSync } from "bcryptjs";
import { count } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { products as mockProducts } from "@/lib/products";
import * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function ensureSeeded(db: Db) {
  const [{ value: productCount }] = db
    .select({ value: count() })
    .from(schema.products)
    .all();

  if (productCount === 0) {
    db.insert(schema.products)
      .values(
        mockProducts.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          category: p.category,
          categorySlug: p.categorySlug,
          price: p.price,
          compareAt: p.compareAt ?? null,
          colors: p.colors,
          fabric: p.fabric,
          occasion: p.occasion,
          description: p.description,
          care: p.care,
          images: [...p.images],
          sizes: p.sizes,
          isNew: Boolean(p.isNew),
          onSale: Boolean(p.onSale),
          featured: Boolean(p.featured),
          active: true,
        })),
      )
      .run();
  }

  const [{ value: adminCount }] = db
    .select({ value: count() })
    .from(schema.admins)
    .all();

  if (adminCount === 0) {
    const email = process.env.ADMIN_EMAIL ?? "admin@thanishka.com";
    const password = process.env.ADMIN_PASSWORD ?? "thanishka-admin";
    db.insert(schema.admins)
      .values({
        id: id("adm"),
        email,
        name: "Thanishka Admin",
        passwordHash: hashSync(password, 10),
      })
      .run();
  }

  const [{ value: discountCount }] = db
    .select({ value: count() })
    .from(schema.discounts)
    .all();

  if (discountCount === 0) {
    db.insert(schema.discounts)
      .values({
        id: id("dsc"),
        code: "THANISHKA10",
        label: "Welcome 10% off",
        type: "percent",
        value: 10,
        minOrder: 0,
        maxUses: null,
        usedCount: 0,
        active: true,
      })
      .run();
  }

  const [{ value: offerCount }] = db
    .select({ value: count() })
    .from(schema.offers)
    .all();

  if (offerCount === 0) {
    db.insert(schema.offers)
      .values({
        id: id("ofr"),
        title: "Free Shipping Above ₹1,999",
        eyebrow: "Limited Weekend",
        subtitle:
          "Plus THANISHKA10 for 10% off your first order — email or WhatsApp welcome when you subscribe.",
        ctaLabel: "Shop the Offer",
        ctaHref: "/shop?sort=price-asc",
        active: true,
        sortOrder: 0,
      })
      .run();
  }

  const [{ value: heroCount }] = db
    .select({ value: count() })
    .from(schema.heroSlides)
    .all();

  if (heroCount === 0) {
    db.insert(schema.heroSlides)
      .values([
        {
          id: id("hero"),
          title: "Shop New",
          subtitle:
            "Readymade dresses for Kerala light — from kasavu borders to evening gowns.",
          ctaLabel: "Explore New In",
          ctaHref: "/shop?category=new-in",
          imageUrl:
            "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2000&q=80",
          active: true,
          sortOrder: 0,
        },
        {
          id: id("hero"),
          title: "Onam Edit",
          subtitle:
            "Ivory, gold, and celebration-ready silhouettes — stocked XS to XXL.",
          ctaLabel: "Shop Festive",
          ctaHref: "/shop?category=festive",
          imageUrl:
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=2000&q=80",
          active: true,
          sortOrder: 1,
        },
        {
          id: id("hero"),
          title: "Party Night",
          subtitle:
            "Editorial cuts with quiet drama. No custom stitching — just your size.",
          ctaLabel: "Shop Party",
          ctaHref: "/shop?category=party-western",
          imageUrl:
            "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=2000&q=80",
          active: true,
          sortOrder: 2,
        },
      ])
      .run();
  }
}
