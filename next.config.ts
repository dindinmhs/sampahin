import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns : [
      {
        protocol : 'https',
        hostname : 'kuqkcswutjdvdcuvzxqn.supabase.co',
      }
    ]
  }
};

export default nextConfig;
