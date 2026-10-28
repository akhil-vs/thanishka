import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { ensureSeeded } from "./seed";

const globalForDb = globalThis as unknown as {
  __thanishkaDb?: ReturnType<typeof createDb>;
};

function resolveDbPath() {
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv && path.isAbsolute(fromEnv)) {
    return fromEnv;
  }
  // Keep filesystem access statically scoped under ./data for Turbopack tracing.
  const relative = fromEnv && !path.isAbsolute(fromEnv) ? fromEnv : "thanishka.db";
  const fileName = path.basename(relative);
  return path.join(process.cwd(), "data", fileName);
}

function createDb() {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });
  migrate(sqlite);
  ensureSeeded(db);

  return db;
}

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      price INTEGER NOT NULL,
      compare_at INTEGER,
      colors TEXT NOT NULL,
      fabric TEXT NOT NULL,
      occasion TEXT NOT NULL,
      description TEXT NOT NULL,
      care TEXT NOT NULL,
      images TEXT NOT NULL,
      sizes TEXT NOT NULL,
      is_new INTEGER NOT NULL DEFAULT 0,
      on_sale INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size TEXT NOT NULL,
      delta INTEGER NOT NULL,
      quantity_after INTEGER NOT NULL,
      note TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      admin_id TEXT REFERENCES admins(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      min_order INTEGER NOT NULL DEFAULT 0,
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT,
      ends_at TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      eyebrow TEXT NOT NULL DEFAULT '',
      subtitle TEXT NOT NULL,
      cta_label TEXT NOT NULL,
      cta_href TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT,
      ends_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hero_slides (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      cta_label TEXT NOT NULL,
      cta_href TEXT NOT NULL,
      image_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function getDb() {
  if (!globalForDb.__thanishkaDb) {
    globalForDb.__thanishkaDb = createDb();
  }
  return globalForDb.__thanishkaDb;
}

export type AppDb = ReturnType<typeof getDb>;
