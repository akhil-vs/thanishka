/**
 * Product video upload helpers — Blob preferred; local/database fallbacks.
 */
import assert from "node:assert/strict";
import { readFile, unlink, rm } from "node:fs/promises";
import path from "path";
import {
  buildVideoUploadPathname,
  getVideoUploadStrategy,
  isAllowedVideoType,
  maxVideoBytesForStrategy,
  MAX_VIDEO_DATABASE_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  storeUploadedVideo,
} from "../src/lib/admin/uploads";
import { isVideoRef, isAppHostedVideoRef } from "../src/lib/image-ref";
import { productInputSchema } from "../src/lib/admin/validators";

async function main() {
  assert.equal(isAllowedVideoType("video/mp4"), true);
  assert.equal(isAllowedVideoType("video/webm"), true);
  assert.equal(isAllowedVideoType("video/quicktime"), true);
  assert.equal(isAllowedVideoType("video/avi"), false);
  assert.equal(MAX_VIDEO_UPLOAD_BYTES, 80 * 1024 * 1024);
  assert.equal(MAX_VIDEO_DATABASE_BYTES, 4 * 1024 * 1024);
  assert.equal(maxVideoBytesForStrategy("database"), MAX_VIDEO_DATABASE_BYTES);
  assert.equal(maxVideoBytesForStrategy("blob"), MAX_VIDEO_UPLOAD_BYTES);

  assert.equal(isAppHostedVideoRef("/uploads/videos/a.mp4"), true);
  assert.equal(isAppHostedVideoRef("/api/media/clxyz123"), true);
  assert.equal(isVideoRef("/uploads/videos/a.mp4"), true);
  assert.equal(isVideoRef("/api/media/clxyz123"), true);
  assert.equal(
    isVideoRef("https://xyz.public.blob.vercel-storage.com/v.mp4"),
    true,
  );
  assert.equal(isVideoRef("not-a-url"), false);

  const file = new File([new Uint8Array([0, 0, 0, 1])], "Look Book!!.MOV", {
    type: "video/quicktime",
  });
  const pathname = buildVideoUploadPathname(file);
  assert.match(
    pathname,
    /^uploads\/videos\/\d{8}-look-book-[a-f0-9]{8}\.mov$/,
  );

  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL;
  assert.equal(getVideoUploadStrategy(), "local");

  process.env.VERCEL = "1";
  assert.equal(getVideoUploadStrategy(), "database");
  delete process.env.VERCEL;

  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
  assert.equal(getVideoUploadStrategy(), "blob");
  delete process.env.BLOB_READ_WRITE_TOKEN;

  const tiny = new File([new Uint8Array([1, 2, 3, 4])], "clip.mp4", {
    type: "video/mp4",
  });
  const stored = await storeUploadedVideo(tiny);
  assert.equal(stored.storage, "local");
  assert.ok(stored.url.startsWith("/uploads/videos/"));
  const absolute = path.join(process.cwd(), "public", stored.pathname);
  const onDisk = await readFile(absolute);
  assert.equal(onDisk.equals(Buffer.from([1, 2, 3, 4])), true);
  await unlink(absolute);
  await rm(path.dirname(absolute), { recursive: true, force: true }).catch(
    () => undefined,
  );

  const withVideo = productInputSchema.parse({
    name: "Test Dress",
    slug: "test-dress",
    category: "Party & Western",
    categorySlug: "party-western",
    price: 2999,
    colors: ["Black"],
    fabric: "Crepe",
    occasion: ["Party"],
    description: "A sample boutique piece for tests.",
    care: "Dry clean.",
    images: [
      "https://images.unsplash.com/photo-1",
      "https://images.unsplash.com/photo-2",
    ],
    videoUrl: "https://example.com/product.mp4",
    sizes: { XS: 0, S: 1, M: 2, L: 1, XL: 0, XXL: 0 },
  });
  assert.equal(withVideo.videoUrl, "https://example.com/product.mp4");

  const cleared = productInputSchema.partial().parse({ videoUrl: null });
  assert.equal(cleared.videoUrl, null);

  const mediaHosted = productInputSchema.partial().parse({
    videoUrl: "/api/media/clxyz123",
  });
  assert.equal(mediaHosted.videoUrl, "/api/media/clxyz123");

  const omitted = productInputSchema.parse({
    name: "No Video Dress",
    slug: "no-video-dress",
    category: "Party & Western",
    categorySlug: "party-western",
    price: 2999,
    colors: ["Black"],
    fabric: "Crepe",
    occasion: ["Party"],
    description: "A sample boutique piece for tests.",
    care: "Dry clean.",
    images: [
      "https://images.unsplash.com/photo-1",
      "https://images.unsplash.com/photo-2",
    ],
    sizes: { XS: 0, S: 1, M: 2, L: 1, XL: 0, XXL: 0 },
  });
  assert.equal(omitted.videoUrl, undefined);

  console.log("test-video-uploads: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
