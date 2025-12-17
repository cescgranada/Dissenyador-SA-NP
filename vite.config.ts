import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega les variables de l'entorn local (.env) si n'hi ha.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // ESTRATÈGIA DE CERCA DE LA CLAU:
  // 1. process.env.VITE_API_KEY (Prioritari a Vercel)
  // 2. process.env.API_KEY (Alternativa)
  // 3. env.VITE_API_KEY (Local .env)
  // 4. env.API_KEY (Local .env antic)
  const apiKey = process.env.VITE_API_KEY || process.env.API_KEY || env.VITE_API_KEY || env.API_KEY || '';

  console.log(`[Vite Build] API Key detected: ${apiKey ? 'Yes (Hidden)' : 'No'}`);

  return {
    plugins: [react()],
    define: {
      // Injectem la clau globalment perquè estigui disponible com a process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})