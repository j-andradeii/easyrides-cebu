import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "djuny0idasckxayv.public.blob.vercel-storage.com",
      },
      // Tour images uploaded from /admin/tours land in this project's blob
      // store; the wildcard keeps working if that store is ever recreated.
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
    dangerouslyAllowSVG: true,
  },
};
export default nextConfig;

