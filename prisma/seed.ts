import { hashSync } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { products as mockProducts } from "../src/lib/products";

const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: mockProducts.map((p) => ({
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
    });
    console.log(`Seeded ${mockProducts.length} products`);
  }

  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const email = process.env.ADMIN_EMAIL ?? "admin@thanishka.com";
    const password = process.env.ADMIN_PASSWORD ?? "thanishka-admin";
    await prisma.admin.create({
      data: {
        email,
        name: "Thanishka Admin",
        passwordHash: hashSync(password, 10),
      },
    });
    console.log(`Seeded admin ${email}`);
  }

  const discountCount = await prisma.discount.count();
  if (discountCount === 0) {
    await prisma.discount.create({
      data: {
        code: "THANISHKA10",
        label: "Welcome 10% off",
        type: "percent",
        value: 10,
        active: true,
      },
    });
    console.log("Seeded discount THANISHKA10");
  }

  const offerCount = await prisma.offer.count();
  if (offerCount === 0) {
    await prisma.offer.create({
      data: {
        title: "Free Shipping Above ₹1,999",
        eyebrow: "Limited Weekend",
        subtitle:
          "Plus THANISHKA10 for 10% off your first order — email or WhatsApp welcome when you subscribe.",
        ctaLabel: "Shop the Offer",
        ctaHref: "/shop?sort=price-asc",
        active: true,
        sortOrder: 0,
      },
    });
    console.log("Seeded default offer");
  }

  const heroCount = await prisma.heroSlide.count();
  if (heroCount === 0) {
    await prisma.heroSlide.createMany({
      data: [
        {
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
      ],
    });
    console.log("Seeded hero slides");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
