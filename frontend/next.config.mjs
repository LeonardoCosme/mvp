// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  output: 'standalone', // mantém compatibilidade com Docker/Railway
};

export default nextConfig;
