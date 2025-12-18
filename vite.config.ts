import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carreguem variables d'entorn des del directori actual ('.') per evitar problemes amb process.cwd()
  const env = loadEnv(mode, '.', '');

  // Lògica de recuperació de la clau en ordre de prioritat:
  // 1. VITE_API_KEY (Estàndard Vite local o Vercel)
  // 2. API_KEY (Estàndard Vercel System Env)
  // 3. process.env (Fallback per si el build system ja les té carregades)
  const apiKey = 
    env.VITE_API_KEY || 
    env.API_KEY || 
    process.env.VITE_API_KEY || 
    process.env.API_KEY || 
    '';

  // Log de diagnòstic per al build log de Vercel (no visible al navegador)
  if (!apiKey) {
    console.warn('⚠️  AVÍS: No s\'ha detectat cap API KEY durant el build. Assegura\'t de tenir VITE_API_KEY configurada a Vercel.');
  } else {
    console.log('✅ API Key detectada i injectada correctament.');
  }

  return {
    plugins: [react()],
    define: {
      // Injectem la clau com a string estàtic en el codi final
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})