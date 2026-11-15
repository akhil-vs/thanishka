/**
 * Checks for upload helpers + local-disk store path (no Blob / Vercel).
 */
import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  buildUploadPathname,
  isAllowedImageType,
  MAX_UPLOAD_BYTES,
  storeUploadedImage,
} from "../src/lib/admin/uploads";
import {
  isAppHostedImageRef,
  isImageRef,
} from "../src/lib/image-ref";

async function main() {
  assert.equal(isAllowedImageType("image/jpeg"), true);
  assert.equal(isAllowedImageType("image/png"), true);
  assert.equal(isAllowedImageType("application/pdf"), false);
  assert.equal(MAX_UPLOAD_BYTES, 4 * 1024 * 1024);

  const file = new File([new Uint8Array([1, 2, 3])], "Summer Dress!!.PNG", {
    type: "image/png",
  });
  const pathname = buildUploadPathname(file);
  assert.match(pathname, /^uploads\/\d{8}-summer-dress-[a-f0-9]{8}\.png$/);

  assert.equal(isAppHostedImageRef("/uploads/foo.png"), true);
  assert.equal(isAppHostedImageRef("/api/media/clxyz123"), true);
  assert.equal(isAppHostedImageRef("https://example.com/a.jpg"), false);
  assert.equal(isImageRef("/api/media/clxyz123"), true);
  assert.equal(isImageRef("https://images.unsplash.com/photo-1"), true);
  assert.equal(isImageRef("not-a-url"), false);
  assert.equal(isImageRef("ftp://bad.example/x"), false);

  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL;

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const uploadFile = new File([png], "dot.png", { type: "image/png" });
  const stored = await storeUploadedImage(uploadFile);
  assert.equal(stored.storage, "local");
  assert.ok(stored.url.startsWith("/uploads/"));
  const absolute = path.join(process.cwd(), "public", stored.pathname);
  const onDisk = await readFile(absolute);
  assert.equal(onDisk.equals(png), true);
  await unlink(absolute);

  console.log("test-uploads-fallback: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
