"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { formatINR, cn } from "@/lib/format";

type ShareProductButtonProps = {
  name: string;
  price: number;
  className?: string;
};

function productUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href.split("#")[0] ?? window.location.href;
}

function shareText(name: string, price: number) {
  return `Look at ${name} from Thanishka — ${formatINR(price)}`;
}

function subscribeNoop() {
  return () => {};
}

function getCanNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function ShareProductButton({
  name,
  price,
  className,
}: ShareProductButtonProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canNativeShare = useSyncExternalStore(
    subscribeNoop,
    getCanNativeShare,
    () => false,
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyLink() {
    const url = productUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this product link", url);
    }
  }

  async function shareNative() {
    const url = productUrl();
    const text = shareText(name, price);
    try {
      await navigator.share({ title: `${name} · Thanishka`, text, url });
      setOpen(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copyLink();
    }
  }

  async function shareWhatsApp() {
    const url = productUrl();
    const text = `${shareText(name, price)}\n${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={copied ? "Link copied" : "Share product"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-12 w-12 items-center justify-center border border-line transition",
          open && "border-charcoal bg-mist",
          copied && "text-emerald",
        )}
      >
        {copied ? (
          <Check size={18} strokeWidth={1.5} />
        ) : (
          <Share2 size={18} strokeWidth={1.5} />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Share options"
          className="absolute bottom-full right-0 z-40 mb-2 w-48 border border-line bg-ivory py-1 shadow-[0_12px_40px_rgba(28,25,23,0.12)] md:bottom-auto md:top-full md:mb-0 md:mt-2"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void shareWhatsApp();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-mist"
          >
            <WhatsAppGlyph className="h-4 w-4 shrink-0" />
            WhatsApp
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void copyLink().then(() => setOpen(false));
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-mist"
          >
            <Link2 size={16} strokeWidth={1.5} className="shrink-0" />
            Copy link
          </button>
          {canNativeShare && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void shareNative();
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-mist"
            >
              <Share2 size={16} strokeWidth={1.5} className="shrink-0" />
              More…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("fill-current", className)} aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l5.9-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5ZM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.5.7.7-3.4-.2-.3A9 9 0 1 1 12 21Zm5-6.6c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.1-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.6-.3Z" />
    </svg>
  );
}
