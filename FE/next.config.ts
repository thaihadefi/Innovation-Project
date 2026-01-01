import type { NextConfig } from "next"; 

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enable React Strict Mode for better dev experience
  images: {
    // Allow external images from these domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4001',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
