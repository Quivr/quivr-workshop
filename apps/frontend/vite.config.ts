import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:3001'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: AGENT_URL,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
