import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: [
      'localhost',
      'eventify.local.home',
      'eventify-dev.local.home',
      'eventify-admin.local.home',
      'eventify-admin-dev.local.home',
      'app.chihab.online',
      'admin.chihab.online',
    ],
  },
})
