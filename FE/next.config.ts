import type { NextConfig } from "next"; 

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enable React Strict Mode for better dev experience
  
  // Performance: Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Performance: Optimize large package imports (tree-shaking)
  experimental: {
    optimizePackageImports: ['react-icons', 'recharts', 'filepond'],
  },
  
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
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

