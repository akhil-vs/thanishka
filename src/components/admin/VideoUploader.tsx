"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch, adminUploadVideo } from "@/lib/admin/client";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
};

type VideoMode = {
  strategy: "blob" | "local" | "database";
  maxBytes: number;
};

function formatMb(bytes: number) {
  return Math.round(bytes / (1024 * 1024));
}

function defaultHint(mode: VideoMode | null) {
  if (!mode) {
    return "MP4, WebM or MOV · stored as-is (no quality loss)";
  }
  const mb = formatMb(mode.maxBytes);
  if (mode.strategy === "database") {
    return `MP4, WebM or MOV · max ${mb} MB without Blob (connect Vercel Blob for up to 80 MB) · stored as-is`;
  }
  return `MP4, WebM or MOV · max ${mb} MB · stored as-is (no quality loss)`;
}

export function VideoUploader({
  value,
  onChange,
  label = "Product video",
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<VideoMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminFetch<VideoMode>("/api/admin/uploads/video")
      .then((data) => {
        if (!cancelled) setMode(data);
      })
      .catch(() => {
        // Hint falls back to generic copy if mode probe fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onFileSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const result = await adminUploadVideo(file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const shownHint = hint ?? defaultHint(mode);

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-[9px] tracking-[0.14em] text-muted">
            {label}
          </p>
          {shownHint ? (
            <p className="mt-1 font-serif text-xs text-muted">{shownHint}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {value ? (
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-2"
              disabled={uploading}
              onClick={() => onChange(null)}
            >
              Remove video
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-2"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading
              ? "Uploading…"
              : value
                ? "Replace video"
                : "Upload video"}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          onChange={(e) => onFileSelected(e.target.files)}
        />
      </div>

      {error ? <p className="mb-2 text-sm text-sale">{error}</p> : null}

      {value ? (
        <div className="overflow-hidden border border-line bg-sand/40">
          <video
            src={value}
            controls
            playsInline
            preload="metadata"
            className="aspect-video max-h-72 w-full bg-charcoal object-contain"
          />
          <p className="truncate px-3 py-2 font-serif text-xs text-muted">
            {value}
          </p>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center border border-dashed border-line bg-ivory px-4 py-10 text-center transition hover:bg-sand/30"
        >
          <span className="font-display text-[10px] tracking-[0.16em]">
            Optional product video
          </span>
          <span className="mt-2 font-serif text-xs text-muted">
            {defaultHint(mode)}
          </span>
        </button>
      )}
    </div>
  );
}
