import Link from "next/link";
import { cn } from "@/lib/format";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "gold";

const styles: Record<Variant, string> = {
  primary:
    "bg-charcoal text-ivory hover:bg-ink active:scale-[0.98]",
  secondary:
    "border border-charcoal/25 bg-transparent text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
  ghost: "bg-transparent text-charcoal hover:text-kasavu-deep",
  gold: "bg-kasavu text-ink hover:bg-kasavu-deep hover:text-ivory active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 py-3 font-display text-[11px] tracking-[0.18em] transition-all duration-300 disabled:opacity-40",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  onClick,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 py-3 font-display text-[11px] tracking-[0.18em] transition-all duration-300",
        styles[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
