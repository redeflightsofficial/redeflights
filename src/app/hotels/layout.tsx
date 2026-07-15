import type { Metadata } from "next";
import { hotelsMetadata } from "@/lib/site-seo";

export const metadata: Metadata = hotelsMetadata;

export default function HotelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
