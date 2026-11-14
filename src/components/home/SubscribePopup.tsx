"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SubscribeForm } from "@/components/home/SubscribeForm";

export function SubscribePopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("thanishka-sub-dismissed");
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="relative w-full max-w-md border border-line bg-ivory p-6 shadow-xl md:p-8">
        <button
          aria-label="Close"
          className="absolute top-3 right-3 p-1 text-muted"
          onClick={() => {
            localStorage.setItem("thanishka-sub-dismissed", "1");
            setOpen(false);
          }}
        >
          <X size={18} />
        </button>
        <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
          Welcome gift
        </p>
        <h3 className="mt-2 font-display text-xl tracking-[0.14em]">
          10% off your first order
        </h3>
        <p className="mt-3 font-serif text-muted">
          Join the list for new arrivals, Onam edits, and private sale invites.
        </p>
        <SubscribeForm source="popup" variant="popup" />
      </div>
    </div>
  );
}
