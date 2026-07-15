import type { Metadata } from "next";
import { destinationsMetadata } from "@/lib/site-seo";

export const metadata: Metadata = destinationsMetadata;

export default function DestinationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
