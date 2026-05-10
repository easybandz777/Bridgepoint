import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude gallery images from serverless function bundling (too large for 250MB limit)
  // Images are still served as static files from Vercel's CDN
  outputFileTracingExcludes: {
    "*": ["./public/images/gallery/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
