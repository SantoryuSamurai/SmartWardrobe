import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pmmhbhooeqqxocommalo.supabase.co', // Replace with your domain
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
