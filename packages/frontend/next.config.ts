import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  outputFileTracingRoot: '.',
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable build cache that causes issues with Cloudflare Pages
  experimental: {
    webpackBuildWorker: false,
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem']
  },
  webpack: (config) => {
    // Disable webpack cache that creates huge files
    config.cache = false;
    return config;
  }
};

export default nextConfig;
