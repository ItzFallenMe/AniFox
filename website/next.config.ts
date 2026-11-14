import type { NextConfig } from "next";
import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";

// Local web development reads the monorepo's single root .env file.
// Cloudflare/Vercel production variables are supplied by the host.
loadDotEnv({ path: resolve(process.cwd(), "../.env"), quiet: true });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  experimental: { externalDir: true },
};

export default nextConfig;
