import { Suspense } from "react";
import type { Metadata } from "next";
import { StudioShell } from "@/components/studio/StudioShell";
import { getStaffActor } from "@/lib/auth/policy";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-mist font-serif text-muted">
          Loading studio…
        </div>
      }
    >
      <StudioLayoutInner>{children}</StudioLayoutInner>
    </Suspense>
  );
}

async function StudioLayoutInner({ children }: { children: React.ReactNode }) {
  const user = await getStaffActor();

  if (!user) {
    return <div className="min-h-full bg-mist">{children}</div>;
  }

  return <StudioShell userName={user.name}>{children}</StudioShell>;
}
