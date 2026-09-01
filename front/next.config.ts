import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8001",
        pathname: "/api/products/images/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8001",
        pathname: "/api/products/images/**",
      },
    ],
  },
};

export default nextConfig;