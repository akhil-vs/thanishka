import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedImageType(type: string) {
  return ALLOWED_IMAGE_TYPES.has(type);
}

function extensionFor(file: File) {
  const fromType = EXT_BY_TYPE[file.type];
  if (fromType) return fromType;
  const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "bin";
}

function safeBasename(file: File) {
  return file.name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";
}

export function buildUploadPathname(file: File) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `uploads/${stamp}-${safeBasename(file)}-${randomUUID().slice(0, 8)}.${extensionFor(file)}`;
}

export async function storeUploadedImage(file: File): Promise<{
  url: string;
  pathname: string;
  storage: "blob" | "local";
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

  if (process.env.VERCEL) {
    throw new Error(
      "Image uploads require BLOB_READ_WRITE_TOKEN on Vercel. Connect Blob storage in the Vercel dashboard.",
    );
  }

  const absolute = path.join(process.cwd(), "public", pathname);
  await mkdir(path.dirname(absolute), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);

  return { url: `/${pathname}`, pathname, storage: "local" };
}
