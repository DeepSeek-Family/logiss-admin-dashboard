import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const mediaProxyTarget = (env: Record<string, string>): string => {
  const imageBase = env.VITE_IMAGE_BASE_URL?.trim()
  if (imageBase) {
    return imageBase.replace(/\/api\/v\d+\/?$/i, '').replace(/\/$/, '')
  }
  const apiBase = env.VITE_API_BASE_URL?.trim() || 'http://localhost:5005/api/v1'
  return apiBase.replace(/\/api\/v\d+\/?$/i, '').replace(/\/$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const mediaTarget = mediaProxyTarget(env)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/image': {
          target: mediaTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: mediaTarget,
          changeOrigin: true,
        },
       
      },
    
      
    },
  }
})
