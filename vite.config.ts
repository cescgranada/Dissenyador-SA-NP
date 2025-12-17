import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Carreguem variables locals (.env) si estem en local
  const env = loadEnv(mode, (process as any).cwd(), '');

  // 2. Busquem la clau a TOTS els llocs possibles per ordre de prioritat:
  // - VITE_API_KEY (Estàndard Vite)
  // - API_KEY (Estàndard Vercel/Node)
  // - process.env (Entorn de construcció de Vercel)
  // - env (Entorn local carregat)
  const apiKey = 
    process.env.VITE_API_KEY || 
    process.env.API_KEY || 
    env.VITE_API_KEY || 
    env.API_KEY || 
    '';

  console.log(`[Vite Build] Processant build...`);
  console.log(`[Vite Build] API Key trobada? ${apiKey ? 'SÍ (Injectant...)' : 'NO'}`);

  return {
    plugins: [react()],
    // Aquest bloc 'define' substitueix les variables al codi final per text real
    define: {
      // Això assegura que 'import.meta.env.VITE_API_KEY' sempre tingui valor,
      // fins i tot si a Vercel l'has anomenat només 'API_KEY'.
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey),
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})