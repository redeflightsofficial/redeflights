import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { homeMetadata, SITE_BRAND } from "@/lib/site-seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://redeflights.ae"),
  title: {
    default: SITE_BRAND,
    template: `%s | ${SITE_BRAND}`,
  },
  description: homeMetadata.description,
  keywords: homeMetadata.keywords,
  openGraph: homeMetadata.openGraph,
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden antialiased`}>
      <body className="flex min-h-full w-full max-w-full min-w-0 flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
