import type { Metadata } from "next";
import { visaMetadata } from "@/lib/site-seo";

export const metadata: Metadata = visaMetadata;

export default function VisaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
