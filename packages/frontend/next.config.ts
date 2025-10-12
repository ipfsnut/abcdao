import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove 'output: export' to allow API routes
  images: {
    unoptimized: true
  },
  // Disable build cache that causes issues with Cloudflare Pages
  experimental: {
    webpackBuildWorker: false
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Disable webpack cache that creates huge files
    config.cache = false;
    return config;
  }
};

export default nextConfig;
