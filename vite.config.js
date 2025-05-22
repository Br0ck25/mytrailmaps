import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  base: '/', // Ensure proper routing on Cloudflare Pages
  plugins: [react()],
  server: isDev
    ? {
        proxy: {
          '/api': {
            target: 'https://mytrailmapsworker.jamesbrock25.workers.dev',
            changeOrigin: true,
            secure: false,
          },
        },
      }
    : undefined,
});
