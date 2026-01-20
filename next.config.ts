import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Optimize for production
  productionBrowserSourceMaps: false, // Disable source maps in production for faster builds

  // Optimize images
  images: {
    formats: ["image/webp"],
  },

  // Enable SWC minification
  swcMinify: true,

  // Optimize bundle
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },

  // Compress responses
  compress: true,
};

export default nextConfig;
