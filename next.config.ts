import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/webhooks/:path*',
        destination: '/api/webhooks/:path*',
      },
    ]
  },
};

export default nextConfig;
