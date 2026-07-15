import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export function SiteShell({
  children,
  active,
  overlayNav = false,
}: {
  children: ReactNode;
  active?: string;
  overlayNav?: boolean;
}) {
  const contentOffsetClass = overlayNav ? "" : "pt-[124px] sm:pt-[92px]";

  return (
    <main className={`relative w-full max-w-full min-w-0 overflow-x-hidden bg-[var(--surface-muted)] text-[var(--foreground)] ${contentOffsetClass}`}>
      <WhatsAppFloat />
      <Navbar active={active} overlay={overlayNav} />
      {children}
      <Footer />
    </main>
  );
}
