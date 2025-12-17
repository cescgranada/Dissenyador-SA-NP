import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This is necessary because the code uses process.env.API_KEY directly,
      // which is not standard in Vite (normally it uses import.meta.env).
      // This maps the system environment variable to the code.
      // We default to '' to avoid crashing if the variable is missing during build.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  }
})