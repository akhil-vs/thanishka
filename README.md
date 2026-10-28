# Thanishka

Premium readymade women's boutique storefront for Trivandrum, Kerala — Meshki-inspired editorial design with kasavu accents and festive collections.

## Stack

- **Next.js** (App Router) + **Tailwind CSS** + **Framer Motion**
- Client cart / wishlist via **Zustand** (persisted)
- Admin backend via **Next.js Route Handlers** + **Prisma ORM** + **PostgreSQL** (Vercel / Prisma Postgres)

## Develop

```bash
npm install
cp .env.example .env
# paste DATABASE_URL + DIRECT_URL from Vercel / Prisma Console
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Default admin credentials (override with env):

- Email: `admin@thanishka.com`
- Password: `thanishka-admin`

## Deploy on Vercel (Prisma Postgres)

This is the same Prisma workflow you already use on other projects.

1. **Push** this branch / merge to the GitHub repo connected to Vercel.
2. In the Vercel project → **Storage** → **Connect Database** → choose **Prisma** (Marketplace).
3. Connect the Prisma Postgres database to **Production** (and Preview if you want).
   Vercel injects `DATABASE_URL` (and usually `POSTGRES_URL` / `PRISMA_DATABASE_URL`).
4. In Vercel → **Settings → Environment Variables**, also set:
   - `DIRECT_URL` — same as `DATABASE_URL`, or the direct (non-pooled) string from Prisma Console
   - `ADMIN_JWT_SECRET` — long random secret
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — optional seed overrides
5. Redeploy. `vercel.json` runs:
   `prisma generate && prisma migrate deploy && prisma db seed && next build`
6. Open `https://YOUR_DOMAIN/admin` and sign in.

### Local env from Vercel

```bash
npx vercel link
npx vercel env pull .env
```

Ensure `.env` has both `DATABASE_URL` and `DIRECT_URL`.

## Admin backend

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

## Storefront (Phase 1–2)

- Full-bleed hero slider, New In carousel, featured collections
- Offer banner, Shop the Feed, testimonials, subscribe popup / footer
- Shop filters (category, size, occasion) + sort
- Product pages, bag, wishlist, guest checkout demo
- Demo coupon: `THANISHKA10` (10% off)

## Next phases

Razorpay/Cashfree, Shiprocket, real OTP auth, Cloudinary uploads, GST invoicing.
