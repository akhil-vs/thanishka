"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/format";
import { authFetch } from "@/lib/auth/client";

export type BackofficeLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export function BackofficeShell({
  children,
  userName,
  basePath,
  title,
  eyebrow,
  roleLabel,
  logoutPath,
  loginPath,
  links,
  variant,
  footerNote,
}: {
  children: React.ReactNode;
  userName: string;
  basePath: "/admin" | "/studio";
  title: string;
  eyebrow: string;
  roleLabel: string;
  logoutPath: string;
  loginPath: string;
  links: BackofficeLink[];
  variant: "admin" | "studio";
  footerNote?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = variant === "admin";

  async function logout() {
    await authFetch(logoutPath, { method: "POST" });
    router.replace(loginPath);
    router.refresh();
  }

  function isActive(link: BackofficeLink) {
    if (link.exact || link.href === basePath) {
      return pathname === link.href;
    }
    return pathname.startsWith(link.href);
  }

  return (
    <div
      className={cn(
        "min-h-full text-charcoal",
        isAdmin ? "bg-[#ece8e2]" : "bg-mist",
      )}
    >
      <div className="mx-auto flex min-h-full max-w-7xl gap-0 md:gap-8">
        <aside
          className={cn(
            "hidden w-64 shrink-0 md:block",
            isAdmin
              ? "border-r border-charcoal/20 bg-charcoal text-ivory"
              : "border-r border-line bg-ivory",
          )}
        >
          <div className="sticky top-0 flex h-svh flex-col p-6">
            <p
              className={cn(
                "font-display text-[11px] tracking-[0.28em]",
                isAdmin ? "text-kasavu" : "text-kasavu-deep",
              )}
            >
              {eyebrow}
            </p>
            <h1 className="mt-2 font-display text-lg tracking-[0.14em]">
              {title}
            </h1>
            <p
              className={cn(
                "mt-1 font-serif text-sm",
                isAdmin ? "text-ivory/70" : "text-muted",
              )}
            >
              {userName}
            </p>
            <p
              className={cn(
                "mt-3 inline-flex w-fit border px-2 py-1 font-display text-[9px] tracking-[0.16em]",
                isAdmin
                  ? "border-kasavu/50 text-kasavu"
                  : "border-kasavu-deep/40 text-kasavu-deep",
              )}
            >
              {roleLabel}
            </p>
            <nav className="mt-8 space-y-1">
              {links.map((link) => {
                const active = isActive(link);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 font-display text-[10px] tracking-[0.16em] transition-colors",
                      isAdmin
                        ? active
                          ? "bg-ivory text-charcoal"
                          : "text-ivory/65 hover:bg-ivory/10 hover:text-ivory"
                        : active
                          ? "bg-emerald text-ivory"
                          : "text-muted hover:bg-sand/60 hover:text-charcoal",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            {footerNote ? (
              <div
                className={cn(
                  "mt-6 border-t pt-4 font-serif text-xs leading-relaxed",
                  isAdmin
                    ? "border-ivory/15 text-ivory/55"
                    : "border-line text-muted",
                )}
              >
                {footerNote}
              </div>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className={cn(
                "mt-auto flex items-center gap-3 px-3 py-2.5 font-display text-[10px] tracking-[0.16em]",
                isAdmin
                  ? "text-ivory/55 hover:text-sale"
                  : "text-muted hover:text-sale",
              )}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-8">
          <div className="mb-4 md:hidden">
            <p className="font-display text-[10px] tracking-[0.2em] text-kasavu-deep">
              {eyebrow} · {title}
            </p>
            <p className="mt-1 font-serif text-sm text-muted">{roleLabel}</p>
          </div>
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap border px-3 py-2 font-display text-[9px] tracking-[0.14em]",
                  isActive(link)
                    ? isAdmin
                      ? "border-charcoal bg-charcoal text-ivory"
                      : "border-emerald bg-emerald text-ivory"
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
