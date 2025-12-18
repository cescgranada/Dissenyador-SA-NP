import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carreguem totes les variables d'entorn (el tercer paràmetre '' carrega totes, no només les VITE_)
  // Utilitzem process.cwd() per assegurar que busquem al directori arrel del projecte
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Lògica de recuperació de la clau en ordre de prioritat:
  // 1. VITE_API_KEY (Recomanat per Vite/Vercel)
  // 2. API_KEY (Variable de sistema genèrica)
  // 3. Fallback a process.env directe per si el sistema de build ja les té
  const apiKey = 
    env.VITE_API_KEY || 
    env.API_KEY || 
    process.env.VITE_API_KEY || 
    process.env.API_KEY || 
    '';

  // Logs de diagnòstic per al build de Vercel (apareixen al log de Vercel, no al navegador)
  if (!apiKey) {
    console.warn('⚠️  [BUILD WARNING] No s\'ha trobat cap API KEY. L\'app fallarà en execució.');
    console.warn('   Assegura\'t de definir VITE_API_KEY a Vercel > Settings > Environment Variables.');
  } else {
    console.log('✅ [BUILD SUCCESS] API Key detectada correctament.');
  }

  return {
    plugins: [react()],
    define: {
      // Injectem la clau com a string estàtic en el codi final
      // Això substitueix "process.env.API_KEY" pel valor real de la clau
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})