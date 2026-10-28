#!/usr/bin/env bash
set -euo pipefail

# Vercel Marketplace Prisma / Postgres may set any of these.
# Prefer an explicit DATABASE_URL, then marketplace aliases.
export DATABASE_URL="${DATABASE_URL:-${PRISMA_DATABASE_URL:-${POSTGRES_URL:-}}}"

echo "→ prisma generate"
npx prisma generate

if [[ -z "${DATABASE_URL}" ]]; then
  if [[ "${VERCEL_ENV:-}" == "production" ]]; then
    echo "ERROR: DATABASE_URL / PRISMA_DATABASE_URL / POSTGRES_URL is not set."
    echo "In Vercel → Storage, connect Prisma Postgres to Production,"
    echo "or add DATABASE_URL under Project → Settings → Environment Variables."
    exit 1
  fi
  echo "WARN: No database URL in this environment (${VERCEL_ENV:-local})."
  echo "Skipping migrate/seed and building the Next.js app only."
  npx next build
  exit 0
fi

# Log host only — never print credentials.
DB_HOST="$(node -e 'try{console.log(new URL(process.env.DATABASE_URL).host)}catch{console.log("unknown")}')"
echo "→ using database host: ${DB_HOST}"

echo "→ prisma migrate deploy"
npx prisma migrate deploy

echo "→ prisma db seed (idempotent)"
npx prisma db seed

echo "→ next build"
npx next build
