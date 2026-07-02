import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@takumi-rs/core"],
  staticPageGenerationTimeout: 300,
};

export default nextConfig;
