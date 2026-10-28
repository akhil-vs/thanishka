/**
 * Vercel Marketplace Prisma Postgres usually injects PRISMA_DATABASE_URL /
 * POSTGRES_URL. Prisma Client expects DATABASE_URL — normalize once at boot.
 */
export function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      process.env.PRISMA_DATABASE_URL ||
      process.env.POSTGRES_URL ||
      "";
  }
  return process.env.DATABASE_URL;
}
