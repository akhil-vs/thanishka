#!/usr/bin/env bash
set -euo pipefail

# Vercel Marketplace Prisma / Postgres may set any of these.
export DATABASE_URL="${DATABASE_URL:-${PRISMA_DATABASE_URL:-${POSTGRES_URL:-}}}"

if [[ -z "${DATABASE_URL}" ]]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "In Vercel → Storage, connect a Prisma Postgres database to this project,"
  echo "or add DATABASE_URL under Environment Variables."
  exit 1
fi

echo "→ prisma generate"
npx prisma generate

echo "→ prisma migrate deploy"
npx prisma migrate deploy

echo "→ prisma db seed (idempotent)"
npx prisma db seed

echo "→ next build"
npx next build
