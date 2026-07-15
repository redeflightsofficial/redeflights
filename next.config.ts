import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    "/api/banners": ["./data/banners.local.json"],
    "/api/banners/[id]": ["./data/banners.local.json"],
    "/api/visas": ["./data/visas.local.json"],
    "/api/visas/[id]": ["./data/visas.local.json"],
    "/api/visas/slug/[slug]": ["./data/visas.local.json"],
    "/api/hotels": ["./data/hotels.local.json"],
    "/api/hotels/[id]": ["./data/hotels.local.json"],
    "/api/hotels/slug/[slug]": ["./data/hotels.local.json"],
    "/api/destinations": ["./data/destinations.local.json"],
    "/api/destinations/[id]": ["./data/destinations.local.json"],
    "/api/airlines": ["./data/airlines.local.json", "./data/airlines.deleted-iata.json"],
    "/api/airlines/[id]": ["./data/airlines.local.json", "./data/airlines.deleted-iata.json"],
    "/api/airports": ["./data/airports.local.json", "./data/airports.deleted-iata.json"],
    "/api/airports/[id]": ["./data/airports.local.json", "./data/airports.deleted-iata.json"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.trvl-media.com",
      },
      {
        protocol: "https",
        hostname: "assets.hyatt.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
