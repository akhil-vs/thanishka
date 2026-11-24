"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Bell, X } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import { ORDER_ALERT_EVENT } from "@/lib/alerts/events";
import {
  armOrderAlertSound,
  enableOrderAlertSound,
  notifyBrowser,
  orderAlertsUnlocked,
  playOrderChime,
  subscribeOrderAlerts,
} from "@/lib/alerts/chime";
import { cn } from "@/lib/format";

type ShopAlert = {
  id: string;
  orderId: string;
  title: string;
  body: string;
  whatsappStatus: string;
  readAt: string | null;
  createdAt: string;
};

type AlertsResponse = {
  alerts: ShopAlert[];
  unreadCount: number;
};

const FRESH_MS = 20_000;

function whatsappLabel(status: string) {
  switch (status) {
    case "SENT":
      return "WhatsApp sent";
    case "FAILED":
      return "WhatsApp could not be sent";
    case "SKIPPED":
      return "WhatsApp not configured";
    default:
      return "Sending WhatsApp…";
  }
}

function soundOff() {
  return false;
}

function formatAlertTime(iso: string) {
  const delta = Date.now() - Date.parse(iso);
  if (!Number.isFinite(delta) || delta < 45_000) return "Just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderAlerts({ basePath }: { basePath: "/admin" | "/studio" }) {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<ShopAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ShopAlert[]>([]);
  const [panelPath, setPanelPath] = useState<string | null>(null);
  const soundOn = useSyncExternalStore(
    subscribeOrderAlerts,
    orderAlertsUnlocked,
    soundOff,
  );
  const open = panelPath === pathname;
  const seen = useRef<Set<string> | null>(null);
  const hideTimers = useRef<number[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const apply = useCallback((data: AlertsResponse) => {
    setAlerts(data.alerts);
    setUnreadCount(data.unreadCount);

    const fresh: ShopAlert[] = [];
    if (seen.current === null) {
      seen.current = new Set(data.alerts.map((alert) => alert.id));
      for (const alert of data.alerts) {
        if (!alert.readAt && Date.now() - Date.parse(alert.createdAt) < FRESH_MS) {
          fresh.push(alert);
        }
      }
    } else {
      for (const alert of data.alerts) {
        if (seen.current.has(alert.id)) continue;
        seen.current.add(alert.id);
        fresh.push(alert);
      }
    }

    if (fresh.length === 0) return;

    setToasts((prev) => {
      const ids = new Set(prev.map((toast) => toast.id));
      return [...fresh.filter((alert) => !ids.has(alert.id)), ...prev].slice(0, 3);
    });
    for (const alert of fresh) {
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== alert.id));
      }, 20_000);
      hideTimers.current.push(timer);
    }
    if (orderAlertsUnlocked()) void playOrderChime();
    for (const alert of fresh) {
      notifyBrowser({
        title: alert.title,
        body: alert.body,
        href: `${basePath}/orders`,
        tag: alert.id,
      });
    }
    window.dispatchEvent(new CustomEvent(ORDER_ALERT_EVENT));
  }, [basePath]);

  const load = useCallback(async () => {
    const data = await adminFetch<AlertsResponse>("/api/admin/notifications", {
      cache: "no-store",
    });
    apply(data);
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    async function pull() {
      try {
        const data = await adminFetch<AlertsResponse>("/api/admin/notifications", {
          cache: "no-store",
        });
        if (!cancelled) apply(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message === "Unauthorized") cancelled = true;
      }
    }

    void pull();
    timer = window.setInterval(() => {
      if (!cancelled) void pull();
    }, 7000);

    function onVisible() {
      if (document.visibilityState === "visible" && !cancelled) void pull();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      hideTimers.current.forEach((id) => window.clearTimeout(id));
      hideTimers.current = [];
    };
  }, [apply]);

  useEffect(() => {
    if (!soundOn) return;
    function arm() {
      void armOrderAlertSound();
    }
    window.addEventListener("pointerdown", arm);
    return () => window.removeEventListener("pointerdown", arm);
  }, [soundOn]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setPanelPath(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPanelPath(null);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markRead(opts: { ids?: string[]; all?: boolean }) {
    await adminFetch("/api/admin/notifications", {
      method: "POST",
      body: JSON.stringify(opts),
    });
    await load();
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    void markRead({ ids: [id] }).catch(() => undefined);
  }

  async function turnOnSound() {
    await enableOrderAlertSound();
  }

  return (
    <>
      <div className="sticky top-0 z-30 mb-4 border-b border-line bg-mist/95 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          {!soundOn ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <p className="font-serif text-sm text-muted">
                Play a sound when a new order is placed.
              </p>
              <button
                type="button"
                onClick={() => void turnOnSound()}
                className="border border-charcoal bg-charcoal px-3 py-2 font-display text-[10px] tracking-[0.16em] text-ivory"
              >
                Turn on sound
              </button>
            </div>
          ) : (
            <p className="font-display text-[10px] tracking-[0.18em] text-muted">
              Order alerts
            </p>
          )}
          <div ref={panelRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setPanelPath(open ? null : pathname)}
              className="relative flex h-10 w-10 items-center justify-center border border-line bg-ivory text-charcoal hover:border-charcoal"
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread order alerts`
                  : "Order alerts"
              }
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-sale px-1 font-display text-[8px] tracking-normal text-ivory">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            {open ? (
              <div
                role="dialog"
                aria-label="Recent order alerts"
                className="absolute right-0 top-full z-40 mt-2 w-[min(calc(100vw-2rem),22rem)] border border-line bg-ivory shadow-lg"
              >
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <p className="font-display text-[10px] tracking-[0.16em]">
                    Recent orders
                  </p>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => void markRead({ all: true })}
                      className="font-display text-[9px] tracking-[0.14em] text-muted hover:text-charcoal"
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <div className="max-h-96 overflow-auto">
                  {alerts.length === 0 ? (
                    <p className="px-4 py-6 font-serif text-sm text-muted">
                      No orders yet. A placed order shows up here and plays a sound.
                    </p>
                  ) : (
                    alerts.map((alert) => (
                      <Link
                        key={alert.id}
                        href={`${basePath}/orders`}
                        onClick={() => {
                          setPanelPath(null);
                          if (!alert.readAt) void markRead({ ids: [alert.id] });
                        }}
                        className={cn(
                          "block border-b border-line px-4 py-3 last:border-b-0 hover:bg-sand/50",
                          !alert.readAt && "shadow-[inset_3px_0_0_0_var(--kasavu)]",
                        )}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-display text-[10px] tracking-[0.14em]">
                            {alert.title}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted">
                            {formatAlertTime(alert.createdAt)}
                          </span>
                        </span>
                        <span className="mt-2 block whitespace-pre-wrap font-serif text-sm leading-snug">
                          {alert.body}
                        </span>
                        <span
                          className={cn(
                            "mt-2 block font-display text-[9px] tracking-[0.14em]",
                            alert.whatsappStatus === "SENT"
                              ? "text-emerald"
                              : alert.whatsappStatus === "FAILED"
                                ? "text-sale"
                                : "text-muted",
                          )}
                        >
                          {whatsappLabel(alert.whatsappStatus)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-4 right-4 z-50 flex w-[min(calc(100%-2rem),24rem)] flex-col gap-3"
        aria-live="polite"
      >
        {toasts.map((alert) => (
          <article key={alert.id} className="border border-charcoal bg-ivory shadow-lg" role="status">
            <div className="h-1 bg-kasavu" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[11px] tracking-[0.16em]">{alert.title}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(alert.id)}
                  className="text-muted hover:text-charcoal"
                  aria-label={`Dismiss ${alert.title}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap font-serif text-sm leading-snug">
                {alert.body}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "font-display text-[9px] tracking-[0.14em]",
                    alert.whatsappStatus === "SENT"
                      ? "text-emerald"
                      : alert.whatsappStatus === "FAILED"
                        ? "text-sale"
                        : "text-muted",
                  )}
                >
                  {whatsappLabel(alert.whatsappStatus)}
                </p>
                <Link
                  href={`${basePath}/orders`}
                  onClick={() => dismissToast(alert.id)}
                  className="font-display text-[10px] tracking-[0.16em] text-kasavu-deep hover:text-charcoal"
                >
                  View orders
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
