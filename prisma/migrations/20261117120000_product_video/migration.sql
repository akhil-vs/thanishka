-- Optional product video URL (object storage / local path — not DB bytes).
ALTER TABLE "products" ADD COLUMN "video_url" TEXT;
