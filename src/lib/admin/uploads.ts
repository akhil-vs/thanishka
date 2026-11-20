import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Cap when using Vercel Blob or local disk — originals only (no re-encode). */
export const MAX_VIDEO_UPLOAD_BYTES = 80 * 1024 * 1024;

/**
 * Cap when falling back to Postgres on Vercel without Blob.
 * Matches typical serverless body limits and keeps DB rows smaller.
 */
export const MAX_VIDEO_DATABASE_BYTES = MAX_UPLOAD_BYTES;

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

export type VideoUploadStrategy = UploadStorage;

export function getVideoUploadStrategy(): VideoUploadStrategy {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (!process.env.VERCEL) return "local";
  return "database";
}

export function maxVideoBytesForStrategy(strategy: VideoUploadStrategy) {
  return strategy === "database"
    ? MAX_VIDEO_DATABASE_BYTES
    : MAX_VIDEO_UPLOAD_BYTES;
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
 * Store a product video as-is (no re-encode).
 * Prefer Vercel Blob; fall back to local disk, then Postgres media rows
 * (same durable path as images when Blob is not connected).
 */
export async function storeUploadedVideo(file: File): Promise<{
  url: string;
  pathname: string;
  storage: UploadStorage;
}> {
  const strategy = getVideoUploadStrategy();
  const maxBytes = maxVideoBytesForStrategy(strategy);
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    if (strategy === "database") {
      throw new Error(
        `Without Vercel Blob, product videos must be ${mb} MB or smaller. Connect Blob (BLOB_READ_WRITE_TOKEN) for up to 80 MB uploads.`,
      );
    }
    throw new Error(`Video must be ${mb} MB or smaller`);
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

  if (strategy === "local") {
    const absolute = path.join(process.cwd(), "public", pathname);
    await mkdir(path.dirname(absolute), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolute, buffer);
    return { url: `/${pathname}`, pathname, storage: "local" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const row = await prisma.uploadedImage.create({
    data: {
      pathname,
      contentType: file.type || "video/mp4",
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
