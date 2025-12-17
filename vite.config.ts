
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carreguem les variables d'entorn de la carpeta actual i de les variables de sistema (Vercel)
  // Fix: Property 'cwd' does not exist on type 'Process' - casting process to any to access Node.js environment methods
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Prioritzem VITE_API_KEY però acceptem API_KEY de Vercel
  // Casting process.env to any to avoid potential type errors in restricted TS environments
  const apiKey = env.VITE_API_KEY || env.API_KEY || (process.env as any).API_KEY || '';

  console.log(`[Vite Build] Injectant API Key: ${apiKey ? 'SÍ' : 'NO'}`);

  return {
    plugins: [react()],
    define: {
      // Això substitueix literalment "process.env.API_KEY" pel valor de la clau en tot el projecte
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})
