import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  outputFileTracingRoot: __dirname,
};

export default nextConfig;