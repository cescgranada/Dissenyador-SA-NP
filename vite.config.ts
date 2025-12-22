
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' to refer to the project root directory where .env files are typically located.
  // This avoids potential TypeScript issues with the global 'process' object in some environments.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Injectem la clau API al codi del client. 
      // Prioritzem API_KEY (estàndard de Cloud Run) o VITE_API_KEY.
      // @ts-ignore - Bypass potential TypeScript issues with process.env
      'process.env.API_KEY': JSON.stringify(env.API_KEY || (process as any).env?.API_KEY || env.VITE_API_KEY || '')
    },
    server: {
      port: 8080,
      host: true
    },
    preview: {
      // Cloud Run requereix el port 8080
      port: 8080,
      host: true
    }
  }
})
