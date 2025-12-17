import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carreguem totes les variables d'entorn disponibles sense prefix (per agafar API_KEY de Vercel)
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Prioritat de cerca de la clau:
  // 1. Variable d'entorn real de Node (process.env)
  // 2. Variable carregada des de .env o Vercel (env)
  const apiKey = 
    process.env.VITE_API_KEY || 
    process.env.API_KEY || 
    env.VITE_API_KEY || 
    env.API_KEY || 
    '';

  console.log(`[Build Log] Clau detectada: ${apiKey ? 'SÍ' : 'NO'}`);

  return {
    plugins: [react()],
    define: {
      // Això substitueix literalment "process.env.API_KEY" pel valor real de la clau en el codi final
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})