import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/cylinders",
        destination: "/cylinder-returns",
        permanent: false,
      },
      {
        source: "/returns",
        destination: "/cylinder-returns",
        permanent: false,
      },
      {
        source: "/godown/cylinders",
        destination: "/cylinder-returns",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
