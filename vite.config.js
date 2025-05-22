import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://mytrailmapsworker.jamesbrock25.workers.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
