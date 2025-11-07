import { fileURLToPath } from 'url';
import path from 'path';

/** Corrige o escopo ESModules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  outputFileTracingRoot: __dirname,
  output: 'standalone'
};

export default nextConfig;
