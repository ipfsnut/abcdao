import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  outputFileTracingRoot: '.',
  // Handle dynamic routes for static export
  distDir: 'out',
  // Generate consistent build ID for deterministic asset names
  generateBuildId: async () => {
    return 'abcdao-static-build-v1'
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
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
    // Disable webpack cache that causes issues with Cloudflare Pages
    config.cache = false;
    
    // Resolve dependency warnings for web environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    
    return config;
  }
};

export default nextConfig;
