import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminFromSession } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Admin reads the session cookie at request time.
export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-mist font-serif text-muted">
          Loading admin…
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

async function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromSession();

  if (!admin) {
    return <div className="min-h-full bg-mist">{children}</div>;
  }

  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
