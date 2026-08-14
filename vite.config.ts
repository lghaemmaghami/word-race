import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cloudflare quick tunnels (and Cursor mobile previews) send a trycloudflare.com Host
// header. Allow those hosts on both the dev server and `vite preview`.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
})
