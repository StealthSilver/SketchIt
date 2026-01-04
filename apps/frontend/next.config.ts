import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/common"],
  /* config options here */
};

export default nextConfig;
