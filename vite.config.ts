import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // SPA 路由回退：所有未匹配请求返回 index.html
  appType: 'spa',
  server: {
    port: 5174,
  },
})
