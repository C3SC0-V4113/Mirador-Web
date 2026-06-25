import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// La app es 100% dinámica (SSR + Server Actions, sin ISR), así que no se
// configura un incremental cache (R2). Si en el futuro se agregan rutas con
// `revalidate`/ISR, añadir aquí un `incrementalCache` (p. ej. r2IncrementalCache).
export default defineCloudflareConfig();
