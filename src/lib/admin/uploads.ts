import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Cap for product videos — originals only (no re-encode). Prefer Blob over DB. */
export const MAX_VIDEO_UPLOAD_BYTES = 80 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const IMAGE_EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const VIDEO_EXT_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function isAllowedImageType(type: string) {
  return ALLOWED_IMAGE_TYPES.has(type);
}

export function isAllowedVideoType(type: string) {
  return ALLOWED_VIDEO_TYPES.has(type);
}

export type UploadStorage = "blob" | "local" | "database";

export type VideoUploadStrategy = "blob" | "local";

export function getVideoUploadStrategy(): VideoUploadStrategy | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (!process.env.VERCEL) return "local";
  return null;
}

function extensionFor(
  file: File,
  extByType: Record<string, string>,
  fallback = "bin",
) {
  const fromType = extByType[file.type];
  if (fromType) return fromType;
  const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? fallback;
}

function safeBasename(file: File, fallback: string) {
  return (
    file.name
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || fallback
  );
}

export function buildUploadPathname(file: File) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `uploads/${stamp}-${safeBasename(file, "image")}-${randomUUID().slice(0, 8)}.${extensionFor(file, IMAGE_EXT_BY_TYPE)}`;
}

export function buildVideoUploadPathname(file: File) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `uploads/videos/${stamp}-${safeBasename(file, "video")}-${randomUUID().slice(0, 8)}.${extensionFor(file, VIDEO_EXT_BY_TYPE, "mp4")}`;
}

export async function storeUploadedImage(file: File): Promise<{
  url: string;
  pathname: string;
  storage: UploadStorage;
}> {
  const pathname = buildUploadPathname(file);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, pathname: blob.pathname, storage: "blob" };
  }

  // Local disk only works outside Vercel (serverless FS is ephemeral).
  if (!process.env.VERCEL) {
    const absolute = path.join(process.cwd(), "public", pathname);
    await mkdir(path.dirname(absolute), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolute, buffer);
    return { url: `/${pathname}`, pathname, storage: "local" };
  }

  // Durable fallback on Vercel when Blob is not connected yet.
  const buffer = Buffer.from(await file.arrayBuffer());
  const row = await prisma.uploadedImage.create({
    data: {
      pathname,
      contentType: file.type || "application/octet-stream",
      bytes: buffer,
      byteSize: buffer.byteLength,
    },
  });

  return {
    url: `/api/media/${row.id}`,
    pathname,
    storage: "database",
  };
}

/**
 * Store a product video as-is (no re-encode) in object storage or local disk.
 * Never writes video bytes into Postgres — that would bloat the database.
 */
export async function storeUploadedVideo(file: File): Promise<{
  url: string;
  pathname: string;
  storage: Exclude<UploadStorage, "database">;
}> {
  const strategy = getVideoUploadStrategy();
  if (!strategy) {
    throw new Error(
      "Product videos require Vercel Blob. Connect Blob (BLOB_READ_WRITE_TOKEN) — videos are not stored in the database.",
    );
  }

  const pathname = buildVideoUploadPathname(file);

  if (strategy === "blob") {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type || "video/mp4",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, pathname: blob.pathname, storage: "blob" };
  }

  const absolute = path.join(process.cwd(), "public", pathname);
  await mkdir(path.dirname(absolute), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);
  return { url: `/${pathname}`, pathname, storage: "local" };
}
