import type { Metadata } from "next";
import { umrahMetadata } from "@/lib/site-seo";

export const metadata: Metadata = umrahMetadata;

export default function UmrahLayout({ children }: { children: React.ReactNode }) {
  return children;
}
