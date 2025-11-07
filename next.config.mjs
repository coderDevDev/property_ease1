/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  },
  // IMPORTANT: Static export is NOT compatible with this app's architecture
  // The app has dynamic routes with 'use client' which cannot use generateStaticParams
  // For mobile: Deploy Next.js to a server and point Capacitor to it
  // output: 'export',
  // trailingSlash: true,
  // distDir: 'out'
};

export default nextConfig;
