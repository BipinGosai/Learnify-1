import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Turbopack can resolve the project root correctly.
  turbopack: {
    root: __dirname,
  },
  // Allow optimized images from these hosts.
  images:{
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'aigurulab.tech',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  }

};

export default nextConfig;
