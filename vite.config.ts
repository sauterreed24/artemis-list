import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Dedicated dev port: many Vite apps default to 5173; if another project (or an old
// server) is still bound there, the browser can show the wrong site at localhost:5173.
export default defineConfig({
  base: '/artemis-list/',
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    open: true,
  },
})
