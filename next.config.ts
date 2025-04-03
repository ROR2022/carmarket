import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    //domains: ['wlfsjgrjliqlhwxjlbnb.supabase.co'],
    // Alternative approach with remotePatterns:
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wlfsjgrjliqlhwxjlbnb.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
