import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turboMode: true, //Disable Turbopack
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bfohmdgcgylgbdmpqops.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
      protocol: "http",
      hostname: "example.com",
      }
    ],
  },
};

export default nextConfig;