# Thanishka

Premium readymade women's boutique storefront for Trivandrum, Kerala — Meshki-inspired editorial design with kasavu accents and festive collections.

## Stack

- **Next.js** (App Router) + **Tailwind CSS** + **Framer Motion**
- Client cart / wishlist via **Zustand** (persisted)
- Checkout via **Razorpay** (Orders + Checkout.js) with server-priced totals, COD option, and Prisma `Order` records
- Admin backend via **Next.js Route Handlers** + **Prisma ORM** + **PostgreSQL** (Vercel / Prisma Postgres)

## Develop

```bash
npm install
cp .env.example .env
# paste DATABASE_URL from Vercel / Prisma Console
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Backoffice credentials (override with env):

- Email: `admin@thanishka.com`
- Password: `thanishka-admin`
- Admin UI: `/admin` (platform admin session)
- Studio UI: `/studio` (shop owner / staff session — same seed user holds both roles)

Demo customer (seeded):

- Email: `customer@thanishka.com`
- Password: `thanishka-customer`
- Account: `/account` (OTP or email; OTP returns `devCode` when `OTP_DEV_MODE` is on)

## Deploy on Vercel (Prisma Postgres)

Backend is Next.js Route Handlers on the same Vercel project — no separate API service.

1. **Push** this branch / merge to the GitHub repo connected to Vercel (`akhil-vikramans-projects/thanishka`).
2. In the Vercel project → **Storage** → **Connect Database** → choose **Prisma** (Marketplace).
3. Connect the Prisma Postgres database to **Production** (and Preview if you want).
   Vercel injects `DATABASE_URL` and/or `POSTGRES_URL` / `PRISMA_DATABASE_URL`.
4. Confirm the connected DB env vars exist for **Production and Preview**:
   - `PRISMA_DATABASE_URL` / `POSTGRES_URL` (from Marketplace), **or**
   - add `DATABASE_URL` yourself with the same Postgres connection string
5. In Vercel → **Settings → Environment Variables**, also set for Production (+ Preview):
   - `ADMIN_JWT_SECRET` / `STAFF_JWT_SECRET` / `CUSTOMER_JWT_SECRET` — long random secrets
   - `OTP_DEV_MODE` / `OTP_DEV_CODE` / `OTP_PEPPER` — customer OTP (`OTP_DEV_MODE` must be unset in real Production)
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — live keys in Production (`rzp_live_*`; staging may set `ALLOW_RAZORPAY_TEST_KEYS=true`)
   - `RAZORPAY_WEBHOOK_SECRET` — required in Production; point webhook to `/api/checkout/webhook` (`payment.captured`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — optional seed overrides
   - `BLOB_READ_WRITE_TOKEN` — from Vercel → Storage → Blob (admin image uploads on Products / Hero)
6. Redeploy. `vercel.json` runs `scripts/vercel-build.sh`
   (`prisma generate` → `migrate deploy` → `db seed` → `next build`).
   The script remaps Marketplace URL aliases onto `DATABASE_URL` and fails clearly if Production has no DB URL.
7. Open `https://YOUR_DOMAIN/admin` and sign in with the seeded admin.

If deploy fails with a database URL error, open Vercel → **Storage** → your
Prisma DB → **Connect**, and enable the variable sync for Production + Preview.

### Local env from Vercel

```bash
npx vercel link
npx vercel env pull .env
```

Ensure `.env` includes `DATABASE_URL` (or set it from `PRISMA_DATABASE_URL` / `POSTGRES_URL`).

## Accounts

| Role | Surface | Auth |
| --- | --- | --- |
| **Admin** | `/admin` | Email + password → `thanishka_admin_session` |
| **Shop owner / staff** | `/studio` | Email + password → `thanishka_staff_session` |
| **Customer** | `/account` | OTP (primary) or email → `thanishka_customer_session` |

Identity is a shared `User` model with `RoleAssignment` (`ADMIN`, `SHOP_OWNER`, `SHOP_STAFF`, `CUSTOMER`) and a `Shop` row (Thanishka). Catalogue/stock APIs accept either admin or staff sessions.

## Admin / Studio backend

| Area | Capabilities |
| --- | --- |
| **Stock** | Single size adjust/set + bulk CSV-style intake + movement log |
| **Products** | Create catalogue items with image upload, archive/activate |
| **Discounts** | Create/enable/disable/delete coupon codes |
| **Offers** | Manage promotional banners (feeds homepage offer) |
| **Hero images** | Manage homepage slider slides (feeds `/api/hero`) — file upload |
| **Dashboard** | Units, low stock, recent movements, campaign counts |
| **Uploads** | `POST /api/admin/uploads` — JPEG/PNG/WebP/GIF (max 4 MB); Vercel Blob in production, `public/uploads` locally |

### Key API routes

- `POST /api/admin/auth/login` · `POST /api/admin/auth/logout` · `GET /api/admin/auth/me`
- `POST /api/auth/staff/login` · `POST /api/auth/staff/logout` · `GET /api/auth/staff/me`
- `POST /api/auth/customer/otp/request` · `POST /api/auth/customer/otp/verify`
- `POST /api/auth/customer/login` · `POST /api/auth/customer/register` · `POST /api/auth/customer/logout` · `GET /api/auth/customer/me`
- `GET/POST /api/account/addresses` · `PATCH/DELETE /api/account/addresses/:id`
- `GET/PATCH /api/admin/stock` · `POST /api/admin/stock/bulk`
- `GET/POST /api/admin/products` · `PATCH/DELETE /api/admin/products/:id`
- `GET/POST /api/admin/discounts` · `PATCH/DELETE /api/admin/discounts/:id`
- `GET/POST /api/admin/offers` · `PATCH/DELETE /api/admin/offers/:id`
- `GET/POST /api/admin/hero` · `PATCH/DELETE /api/admin/hero/:id`
- `POST /api/admin/uploads` — multipart image upload for admin/studio
- Public: `GET /api/hero` · `GET /api/offers` · `GET /api/feedback/public`
- Checkout: `POST /api/checkout/quote` · `POST /api/checkout/create` · `POST /api/checkout/verify` · `GET /api/checkout/orders/:id` · `POST /api/checkout/webhook`
- Orders desk: `GET /api/admin/orders` · `GET/PATCH /api/admin/orders/:id`
- Feedback: `GET/POST /api/feedback` (order-linked, delivered only) · `GET /api/admin/feedback` · `PATCH /api/admin/feedback/:id`
- Account: `GET /api/account/orders`

## Checkout / Razorpay

1. Bag stays client-side (Zustand). Checkout posts line items to the server.
2. Server loads live catalogue prices + stock from Postgres, applies `Discount` coupons, computes shipping (free above ₹1,999), and creates an `Order`.
3. Stock is **held at create** (row-locked) for both Razorpay and COD. Guest confirmation links include an HMAC access token (`?t=`).
4. **Razorpay**: creates a Razorpay Order, opens Checkout.js, then `POST /api/checkout/verify` checks the HMAC signature and marks the order `PAID`. Bad signatures leave the order `PENDING_PAYMENT` so webhooks can still recover.
5. **COD**: creates `COD_CONFIRMED` in the same transaction as the stock hold (failure rolls back).
6. Without Razorpay keys locally, prepaid uses a **dev complete** path (`RAZORPAY_DEV_MODE` or missing keys outside production). `RAZORPAY_DEV_MODE` is **blocked in production**. Production requires live keys + webhook secret.

Webhook (required in Production): Razorpay → `POST /api/checkout/webhook` for `payment.captured` only.

Admin / Studio **Orders** desk: list, pack/ship/deliver, cancel (restocks held inventory).

Admin / Studio **Feedback** inbox: moderate order-linked notes from delivered customers; publish quotes to the homepage.

## Storefront (Phase 1–2)

- Full-bleed hero slider, New In carousel, featured collections
- Offer banner, Shop the Feed, testimonials, subscribe popup / footer
- Shop filters (category, size, occasion) + sort
- Product pages, bag, wishlist, guest/account checkout with Razorpay + COD
- Coupon: `THANISHKA10` (10% off) from the discounts table
- Order confirmation at `/order/[id]`; signed-in history on `/account`
- Order-linked feedback after delivery (one note per order; optional homepage publish)

## Ops jobs

- **Abandoned payment release** — Vercel Cron hits `GET /api/cron/release-pending-orders` once daily at 04:00 UTC (see `vercel.json`; Hobby plans allow at most one run per day — use a denser schedule on Pro). Cancels `PENDING_PAYMENT` / `PAYMENT_FAILED` orders older than 45 minutes and releases held stock. Set `CRON_SECRET` in Production; Vercel sends `Authorization: Bearer $CRON_SECRET`.

## Next phases

Shiprocket deep integration, SMS OTP provider, automated GST invoicing PDFs, open (non-order) feedback.
