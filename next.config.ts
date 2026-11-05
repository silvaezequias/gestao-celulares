import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fixa a raiz do projeto (evita o Next "adivinhar" uma pasta acima quando
  // existe outro package-lock.json no computador).
  turbopack: { root: __dirname },
};

export default nextConfig;
