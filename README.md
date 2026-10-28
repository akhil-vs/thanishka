# Thanishka

Premium readymade women's boutique storefront for Trivandrum, Kerala — Meshki-inspired editorial design with kasavu accents and festive collections.

## Stack

- **Next.js** (App Router) + **Tailwind CSS** + **Framer Motion**
- Client cart / wishlist via **Zustand** (persisted)
- Admin backend via **Next.js Route Handlers** + **Drizzle ORM** + **SQLite**

## Develop

```bash
npm install
cp .env.example .env.local   # optional
npm run db:seed              # creates data/thanishka.db + default admin
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Default admin credentials (change via env):

- Email: `admin@thanishka.com`
- Password: `thanishka-admin`

## What’s included (Phase 1–2 storefront)

- Full-bleed hero slider, New In carousel, featured collections
- Offer banner, Shop the Feed, testimonials, subscribe popup / footer
- Shop filters (category, size, occasion) + sort
- Product pages with gallery, size stock, chart, PIN check, related items
- Slide-out bag, wishlist, guest/account checkout demo (UPI/cards/COD)
- Account OTP/email stub, info pages, WhatsApp button, EN/മലയാളം toggle
- Announcement marquee, sticky auto-hiding header, mobile bottom nav

Demo coupon: `THANISHKA10` (10% off).

## Admin backend

Authenticated `/admin` profile backed by SQLite:

| Area | Capabilities |
| --- | --- |
| **Stock** | Single size adjust/set + bulk CSV-style intake + movement log |
| **Products** | Create catalogue items, archive/activate |
| **Discounts** | Create/enable/disable/delete coupon codes |
| **Offers** | Manage promotional banners (feeds homepage offer) |
| **Hero images** | Manage homepage slider slides (feeds `/api/hero`) |
| **Dashboard** | Units, low stock, recent movements, campaign counts |

### Key API routes

- `POST /api/admin/auth/login` · `POST /api/admin/auth/logout` · `GET /api/admin/auth/me`
- `GET/PATCH /api/admin/stock` · `POST /api/admin/stock/bulk`
- `GET/POST /api/admin/products` · `PATCH/DELETE /api/admin/products/:id`
- `GET/POST /api/admin/discounts` · `PATCH/DELETE /api/admin/discounts/:id`
- `GET/POST /api/admin/offers` · `PATCH/DELETE /api/admin/offers/:id`
- `GET/POST /api/admin/hero` · `PATCH/DELETE /api/admin/hero/:id`
- Public: `GET /api/hero` · `GET /api/offers`

## Next phases

Razorpay/Cashfree, Shiprocket, real OTP auth, Cloudinary uploads, GST invoicing, and PostgreSQL migration when traffic needs it.
