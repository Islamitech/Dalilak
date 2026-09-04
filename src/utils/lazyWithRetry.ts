import { lazy, ComponentType } from 'react';

/**
 * Safe lazy loader with automated retry and cache invalidation.
 * Solves the common Vite/SPA "Failed to fetch dynamically imported module" error
 * caused by new deployments invalidating old asset hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const errMsg = err?.message || String(err || '');
      const isChunkLoadError =
        errMsg.includes('Failed to fetch dynamically imported module') ||
        errMsg.includes('Importing a module script failed') ||
        errMsg.includes('error loading dynamically imported module') ||
        errMsg.includes('Loading chunk');

      if (isChunkLoadError && typeof window !== 'undefined') {
        const lastReload = sessionStorage.getItem('dalelak_chunk_reload_retry');
        const now = Date.now();
        // Prevent infinite reload loops (only reload once within 15 seconds)
        if (!lastReload || now - Number(lastReload) > 15000) {
          sessionStorage.setItem('dalelak_chunk_reload_retry', String(now));
          window.location.reload();
          // Return a hanging promise to wait for reload without throwing to ErrorBoundary
          return new Promise<{ default: T }>(() => {});
        }
      }

      throw err;
    }
  });
}
