import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Git-learning-tool/',
  server: {
    host: '127.0.0.1',
    open: '/Git-learning-tool/',
  },
})
