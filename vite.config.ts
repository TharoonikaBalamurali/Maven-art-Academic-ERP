import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Deterministic port. `strictPort` makes a busy port fail loudly instead of
    // silently starting a second dev server on 5174 — two servers serving the
    // same app is a reliable way to end up debugging a stale tab.
    port: Number(process.env.PORT ?? 5173),
    strictPort: true,
  },
  preview: {
    port: Number(process.env.PREVIEW_PORT ?? 4173),
    strictPort: true,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Keep vendor code in its own chunks so ERP module growth does not
        // bloat the entry chunk as modules are added.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack')) return 'vendor-query';
          if (/[\\/]node_modules[\\/](react-hook-form|zod|@hookform)[\\/]/.test(id)) {
            return 'vendor-forms';
          }
          return 'vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
