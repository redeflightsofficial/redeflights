import type { Metadata } from "next";
import { flightsMetadata } from "@/lib/site-seo";

export const metadata: Metadata = flightsMetadata;

export default function FlightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
