import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// OpenNext (Cloudflare): habilita las versiones locales de los bindings de
// Cloudflare durante `next dev`. No afecta el build de producción.
void initOpenNextCloudflareForDev();
