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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'ws': 'commonjs ws'
      });
    }
    return config;
  },
};

export default nextConfig;
