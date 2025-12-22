import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Injectem la clau API de l'entorn de build al codi del client
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    port: 8080,
    host: true
  },
  preview: {
    port: 8080,
    host: true
  }
})