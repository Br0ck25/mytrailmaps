import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  base: '/website/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'MyTrailMaps',
        short_name: 'TrailMaps',
        description: 'Offroad and hiking trails map viewer',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
        workbox: {
    skipWaiting: true,       // 👈 Add this
    clientsClaim: true,      // 👈 Add this
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
    runtimeCaching: [
          {
            urlPattern: /^\/index\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-root-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 86400, // 1 day
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2592000, // 30 days
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
          {
  urlPattern: /\/tiles\//,
  handler: 'CacheFirst',
  options: {
    cacheName: 'vector-tiles',
    expiration: {
      maxEntries: 1000,
      maxAgeSeconds: 2592000, // 30 days
    },
  },
},

          {
            urlPattern: /\/tracks\/.*\.geojson$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'track-files',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2592000,
              },
            },
          },
          {
            urlPattern: /\/admin-gpx\/.+/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gpx-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2592000,
              },
            },
          },
          {
            urlPattern: /\/admin-gpx-list$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 604800, // 7 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 2592000, // 30 days
              },
            },
          },
          {
            urlPattern: /\/api\/.+/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400, // 1 day
              },
            },
          },
        ],
        navigateFallback: '/index.html',
      },
    }),
  ],
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
