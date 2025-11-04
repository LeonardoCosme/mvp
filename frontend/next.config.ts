import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  trailingSlash: true,
  outputFileTracingRoot: __dirname,
  output: 'standalone', // ✅ Adicionado
};

export default nextConfig;