import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default {
  // ... autres options éventuelles ...
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
