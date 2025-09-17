import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol : 'https',
        hostname : 'kuqkcswutjdvdcuvzxqn.supabase.co',
      }
    ]
  }, 
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
