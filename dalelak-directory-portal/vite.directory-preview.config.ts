import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Separate entry/output: never replaces the production directory build.
export default defineConfig({
  publicDir: false,
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 5190, strictPort: true, open: false },
  build: { outDir: 'dist-ux-preview', emptyOutDir: false, rollupOptions: { input: 'directory-preview.html' } },
});
