import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carreguem les variables d'entorn del fitxer .env i de les variables de sistema de Vercel
  // @ts-ignore - process.cwd() is standard in Node.js environments where vite.config.ts executes
  const env = loadEnv(mode, process.cwd(), '');
  
  // Busquem la clau en les diferents variants que pot tenir a Vercel o en local
  const apiKey = env.VITE_API_KEY || env.API_KEY || process.env.VITE_API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Substitució literal de process.env.API_KEY en tot el codi font per complir amb les guidelines de Gemini
      'process.env.API_KEY': JSON.stringify(apiKey),
      // També definim una variable global per seguretat
      'globalThis.VITE_API_KEY': JSON.stringify(apiKey)
    }
  }
})
