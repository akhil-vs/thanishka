"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { adminUpload } from "@/lib/admin/client";

type Props = {
  values: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
  hint?: string;
};

export function ImageUploader({
  values,
  onChange,
  maxFiles = 8,
  label = "Images",
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(true);
    try {
      const room = Math.max(0, maxFiles - values.length);
      const selected = Array.from(files).slice(0, room);
      if (!selected.length) {
        setError(`You can upload up to ${maxFiles} images.`);
        return;
      }
      const uploaded: string[] = [];
      for (const file of selected) {
        const result = await adminUpload(file);
        uploaded.push(result.url);
      }
      onChange([...values, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-[9px] tracking-[0.14em] text-muted">
            {label}
          </p>
          {hint ? (
            <p className="mt-1 font-serif text-xs text-muted">{hint}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-2"
          disabled={uploading || values.length >= maxFiles}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload images"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => onFilesSelected(e.target.files)}
        />
      </div>

      {error ? <p className="mb-2 text-sm text-sale">{error}</p> : null}

      {values.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="overflow-hidden border border-line bg-sand/40"
            >
              <div className="relative h-36 bg-sand">
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  unoptimized={url.startsWith("/uploads/")}
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <p className="truncate font-serif text-xs text-muted">
                  Image {index + 1}
                </p>
                <button
                  type="button"
                  className="font-display text-[9px] tracking-[0.14em] text-sale"
                  onClick={() => removeAt(index)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center border border-dashed border-line bg-ivory px-4 py-10 text-center transition hover:bg-sand/30"
        >
          <span className="font-display text-[10px] tracking-[0.16em]">
            Drop or choose images
          </span>
          <span className="mt-2 font-serif text-xs text-muted">
            JPEG, PNG, WebP or GIF · max 4 MB each
          </span>
        </button>
      )}
    </div>
  );
}
