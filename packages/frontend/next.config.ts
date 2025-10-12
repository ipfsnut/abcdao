import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove 'output: export' to allow API routes
  images: {
    unoptimized: true
  }
};

export default nextConfig;
