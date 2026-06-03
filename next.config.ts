import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/sobre',
        destination: '/sobre/index.html',
      },
    ]
  },
};

export default nextConfig;
