"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/products";
import { EXAMPLE_MODELS } from "@/lib/virtual-try-on/example-models";
import { isVirtualTryOnEligible } from "@/lib/virtual-try-on/eligibility";

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.85;

async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process photo");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function VirtualTryOn({ product }: { product: Product }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (!isVirtualTryOnEligible(product.categorySlug)) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/virtual-try-on");
        const data = (await res.json()) as { enabled?: boolean };
        if (!cancelled) setConfigured(Boolean(data.enabled));
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product.categorySlug]);

  if (!isVirtualTryOnEligible(product.categorySlug)) {
    return null;
  }

  if (configured === null) {
    return (
      <section className="mt-10 border border-line p-4">
        <p className="font-display text-[11px] tracking-[0.16em]">
          Virtual try-on
        </p>
        <p className="mt-2 text-sm text-muted">Checking availability…</p>
      </section>
    );
  }

  if (!configured) {
    return (
      <section className="mt-10 border border-line p-4">
        <p className="font-display text-[11px] tracking-[0.16em]">
          Virtual try-on
        </p>
        <p className="mt-2 text-sm text-muted">
          Coming soon — preview this piece on you with AI. Size guide remains the
          best guide for fit.
        </p>
      </section>
    );
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose a JPEG or PNG photo.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPersonImage(dataUrl);
      setSelectedModelId(null);
      setResultImage(null);
      setMessage("");
    } catch {
      setMessage("Could not read that photo. Try another image.");
    }
  }

  function selectModel(id: string, image: string) {
    setSelectedModelId(id);
    setPersonImage(image);
    setResultImage(null);
    setMessage("");
  }

  async function generate() {
    if (!personImage) {
      setMessage("Upload a photo or pick an example model first.");
      return;
    }
    if (!consent) {
      setMessage(
        "Please confirm you agree to process the photo for this preview.",
      );
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/virtual-try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userImage: personImage,
          productImage: product.images[0],
          productName: product.name,
          productDescription: product.description,
          categorySlug: product.categorySlug,
          fabric: product.fabric,
          category: product.category,
        }),
      });
      const data = (await res.json()) as {
        imageUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setMessage(data.error || "Try-on failed. Please try again.");
        return;
      }
      if (!data.imageUrl) {
        setMessage("No preview was returned. Please try again.");
        return;
      }
      setResultImage(data.imageUrl);
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 border border-line p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[11px] tracking-[0.16em]">
            Virtual try-on
          </p>
          <p className="mt-1 text-sm text-muted">
            See this piece on you — illustration only. Use the size chart for fit.
          </p>
        </div>
        <Sparkles
          size={18}
          strokeWidth={1.5}
          className="mt-0.5 shrink-0 text-kasavu-deep"
        />
      </div>

      <div className="mt-4">
        <p className="font-display text-[10px] tracking-[0.14em] text-muted">
          Example models
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {EXAMPLE_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => selectModel(model.id, model.image)}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden border",
                selectedModelId === model.id
                  ? "border-charcoal"
                  : "border-line hover:border-charcoal",
              )}
              aria-label={`Use example model ${model.name}`}
              aria-pressed={selectedModelId === model.id}
            >
              <Image
                src={model.image}
                alt={model.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void onPickFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          className="px-4"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} strokeWidth={1.5} />
          Upload photo
        </Button>
        <Button
          type="button"
          variant="gold"
          className="px-4"
          disabled={busy || !personImage}
          onClick={() => void generate()}
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={14} strokeWidth={1.5} />
              Try on
            </>
          )}
        </Button>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I agree that this photo is used only to generate a try-on preview and
          is not stored as a profile image.
        </span>
      </label>

      {(personImage || resultImage) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {personImage && (
            <div>
              <p className="mb-2 font-display text-[10px] tracking-[0.14em] text-muted">
                You
              </p>
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URLs / remote models */}
                <img
                  src={personImage}
                  alt="Selected person"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          {resultImage && (
            <div>
              <p className="mb-2 font-display text-[10px] tracking-[0.14em] text-muted">
                Preview
              </p>
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element -- model returns data URLs */}
                <img
                  src={resultImage}
                  alt={`${product.name} virtual try-on preview`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {busy && (
        <p className="mt-3 text-sm text-muted">
          Generating with AI — this can take up to a minute…
        </p>
      )}
      {message && <p className="mt-3 text-sm text-sale">{message}</p>}

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Powered by Google Gemini via OpenRouter. Not available for set saree /
        mundu. Preview may differ from the finished garment.
      </p>
    </section>
  );
}
