import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'dewmina-logo.png'],
      manifest: {
        name: 'Superline Bus Booking',
        short_name: 'Superline',
        description: 'Book your bus tickets easily with Superline',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'dewmina-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'dewmina-logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
