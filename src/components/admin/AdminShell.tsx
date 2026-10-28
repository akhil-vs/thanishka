"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgePercent,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/format";
import { adminFetch } from "@/lib/admin/client";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/stock", label: "Stock", icon: Warehouse },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/discounts", label: "Discounts", icon: BadgePercent },
  { href: "/admin/offers", label: "Offers", icon: Sparkles },
  { href: "/admin/hero", label: "Hero images", icon: ImageIcon },
];

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await adminFetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-full bg-mist text-charcoal">
      <div className="mx-auto flex min-h-full max-w-7xl gap-0 md:gap-8">
        <aside className="hidden w-60 shrink-0 border-r border-line bg-ivory md:block">
          <div className="sticky top-0 flex h-svh flex-col p-6">
            <p className="font-display text-[11px] tracking-[0.28em] text-kasavu-deep">
              Thanishka
            </p>
            <h1 className="mt-2 font-display text-lg tracking-[0.14em]">Admin</h1>
            <p className="mt-1 font-serif text-sm text-muted">{adminName}</p>
            <nav className="mt-8 space-y-1">
              {links.map((link) => {
                const active =
                  link.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 font-display text-[10px] tracking-[0.16em] transition-colors",
                      active
                        ? "bg-charcoal text-ivory"
                        : "text-muted hover:bg-sand/60 hover:text-charcoal",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={logout}
              className="mt-auto flex items-center gap-3 px-3 py-2.5 font-display text-[10px] tracking-[0.16em] text-muted hover:text-sale"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-8">
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap border px-3 py-2 font-display text-[9px] tracking-[0.14em]",
                  pathname === link.href ||
                    (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "border-charcoal bg-charcoal text-ivory"
                    : "border-line bg-ivory",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
