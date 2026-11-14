import { existsSync } from "node:fs";
import { hashSync } from "bcryptjs";
import {
  FeedbackStatus,
  OrderStatus,
  PaymentMethod,
  PrismaClient,
  Role,
} from "@prisma/client";
import { products as mockProducts } from "../src/lib/products";

// `npm run db:seed` does not load .env the way `prisma db seed` / migrate do.
if (existsSync(".env") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}

const prisma = new PrismaClient();

async function ensureShop() {
  const phone = process.env.STORE_PHONE?.trim() || null;
  const whatsapp = process.env.STORE_WHATSAPP?.trim() || phone;
  return prisma.shop.upsert({
    where: { slug: "thanishka" },
    update: {
      name: "Thanishka",
      active: true,
      ...(phone ? { phone } : {}),
      ...(whatsapp ? { whatsapp } : {}),
    },
    create: {
      id: "shop_thanishka_default",
      slug: "thanishka",
      name: "Thanishka",
      phone,
      whatsapp,
      active: true,
    },
  });
}

async function ensureBackofficeUser(shopId: string) {
  const email = (process.env.ADMIN_EMAIL ?? "admin@thanishka.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "thanishka-admin";
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { roleAssignments: true },
  });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        email,
        name: "Thanishka Admin",
        passwordHash: hashSync(password, 10),
        roleAssignments: {
          create: [
            { role: Role.ADMIN },
            { role: Role.SHOP_OWNER, shopId },
          ],
        },
      },
    });
    console.log(`Seeded backoffice user ${email}`);
    return user;
  }

  const hasAdmin = existing.roleAssignments.some((r) => r.role === Role.ADMIN);
  const hasOwner = existing.roleAssignments.some(
    (r) => r.role === Role.SHOP_OWNER && r.shopId === shopId,
  );
  if (!hasAdmin) {
    await prisma.roleAssignment.create({
      data: { userId: existing.id, role: Role.ADMIN },
    });
  }
  if (!hasOwner) {
    await prisma.roleAssignment.create({
      data: { userId: existing.id, role: Role.SHOP_OWNER, shopId },
    });
  }
  return existing;
}

async function ensureDemoCustomer() {
  const email = "customer@thanishka.com";
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { roleAssignments: true },
  });
  if (existing) return existing;

  const user = await prisma.user.create({
    data: {
      email,
      phone: "+919999000001",
      name: "Demo Customer",
      passwordHash: hashSync("thanishka-customer", 10),
      customerProfile: { create: {} },
      roleAssignments: { create: [{ role: Role.CUSTOMER }] },
      addresses: {
        create: {
          label: "Home",
          line1: "Near Kowdiar Palace",
          city: "Thiruvananthapuram",
          state: "Kerala",
          postalCode: "695003",
          phone: "+919999000001",
          isDefault: true,
        },
      },
    },
  });
  console.log(`Seeded demo customer ${email}`);
  return user;
}

async function ensureDemoFeedback(customerId: string) {
  const feedbackCount = await prisma.feedback.count();
  if (feedbackCount > 0) return;

  const product =
    (await prisma.product.findFirst({ orderBy: { createdAt: "asc" } })) ??
    null;
  if (!product) return;

  const images = Array.isArray(product.images)
    ? (product.images as string[])
    : [];

  async function ensureDeliveredOrder(opts: {
    orderNumber: string;
    size: string;
    paymentMethod: PaymentMethod;
    razorpayPaymentId?: string;
  }) {
    const existing = await prisma.order.findUnique({
      where: { orderNumber: opts.orderNumber },
    });
    if (existing) return existing;

    return prisma.order.create({
      data: {
        orderNumber: opts.orderNumber,
        userId: customerId,
        status: OrderStatus.DELIVERED,
        paymentMethod: opts.paymentMethod,
        customerName: "Demo Customer",
        customerEmail: "customer@thanishka.com",
        customerPhone: "+919999000001",
        shippingLine1: "Near Kowdiar Palace",
        shippingCity: "Thiruvananthapuram",
        shippingState: "Kerala",
        shippingPostalCode: "695003",
        subtotal: product!.price,
        discountAmount: 0,
        shippingAmount: 0,
        total: product!.price,
        stockReserved: true,
        paidAt: new Date(),
        razorpayPaymentId: opts.razorpayPaymentId,
        items: {
          create: {
            productId: product!.id,
            productName: product!.name,
            productSlug: product!.slug,
            productImage: images[0] ?? null,
            size: opts.size,
            unitPrice: product!.price,
            quantity: 1,
            lineTotal: product!.price,
          },
        },
      },
    });
  }

  const publishedOrder = await ensureDeliveredOrder({
    orderNumber: "TH-SEED-FEEDBACK",
    size: "M",
    paymentMethod: PaymentMethod.COD,
  });

  await prisma.feedback.create({
    data: {
      orderId: publishedOrder.id,
      userId: customerId,
      rating: 5,
      message:
        "The Onam set saree arrived ready to wear — fabric felt premium and the fit was true.",
      displayName: "Ananya R.",
      place: "Kowdiar",
      status: FeedbackStatus.PUBLISHED,
    },
  });

  const inboxOrder = await ensureDeliveredOrder({
    orderNumber: "TH-SEED-FEEDBACK-2",
    size: "S",
    paymentMethod: PaymentMethod.RAZORPAY,
    razorpayPaymentId: "pay_seed_demo",
  });

  await prisma.feedback.create({
    data: {
      orderId: inboxOrder.id,
      userId: customerId,
      rating: 4,
      message:
        "Soft linen, exact colour as photos. Delivery to Vellayambalam was quick.",
      displayName: "Demo Customer",
      place: "Thiruvananthapuram",
      status: FeedbackStatus.NEW,
    },
  });

  console.log("Seeded demo delivered orders + feedback");
}

async function main() {
  const shop = await ensureShop();
  await ensureBackofficeUser(shop.id);

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

  const discountCount = await prisma.discount.count();
  if (discountCount === 0) {
    await prisma.discount.create({
      data: {
        code: "THANISHKA10",
        label: "Welcome 10% off",
        type: "percent",
        value: 10,
        firstOrderOnly: true,
        active: true,
      },
    });
    console.log("Seeded discount THANISHKA10");
  } else {
    await prisma.discount.updateMany({
      where: { code: "THANISHKA10", firstOrderOnly: false },
      data: { firstOrderOnly: true },
    });
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

  const customer = await ensureDemoCustomer();
  if (customer) {
    await ensureDemoFeedback(customer.id);
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
