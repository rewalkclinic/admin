import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.hilsapictures.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  }
};

export default nextConfig;