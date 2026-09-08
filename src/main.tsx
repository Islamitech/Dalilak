import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Prevent Safari pinch-to-zoom gestures if supported
if (typeof window !== 'undefined') {
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  // Handle Vite chunk load failures after new deployments (reloads with fresh chunks)
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error detected, refreshing page for updated assets...', event);
    const lastReload = sessionStorage.getItem('dalelak_vite_preload_reload');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 15000) {
      sessionStorage.setItem('dalelak_vite_preload_reload', String(now));
      window.location.reload();
    }
  });

  // Register Service Worker in production for offline shell & PWA resiliency (Update 37)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[Dalelak PWA] Service Worker registration skipped:', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

