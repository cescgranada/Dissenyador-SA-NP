import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid TypeScript errors on the global process object while still loading local env files
  const env = loadEnv(mode, '.', '');

  // Busquem la clau prioritzant el prefix VITE_ (estàndard Vite) 
  // però acceptant API_KEY (estàndard Vercel)
  const apiKey = 
    process.env.VITE_API_KEY || 
    process.env.API_KEY || 
    env.VITE_API_KEY || 
    env.API_KEY || 
    '';

  // Aquest log apareixerà a la consola de Vercel durant el Deployment
  console.log(`[Vite Build] API Key detectada: ${apiKey ? 'SÍ' : 'NO'}`);

  return {
    plugins: [react()],
    define: {
      // Injectem la clau directament al codi
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})
