import type { Metadata } from "next";
import { packagesMetadata } from "@/lib/site-seo";

export const metadata: Metadata = packagesMetadata;

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
