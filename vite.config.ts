import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The last parameter '' ensures we load all env vars, not just VITE_ ones locally.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Robustly find the API KEY. 
  // Priority: VITE_API_KEY (Standard for Vite) > API_KEY (Generic)
  // We check both process.env (System/Vercel) and env (.env files)
  const apiKey = process.env.VITE_API_KEY || process.env.API_KEY || env.VITE_API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Manually define process.env.API_KEY so it's available in the client code
      // regardless of how it was named in the environment variables.
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})