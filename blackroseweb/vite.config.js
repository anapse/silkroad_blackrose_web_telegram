import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@game': path.resolve(__dirname, 'src/game'),
      '@web': path.resolve(__dirname, 'src/web'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    host: true,
    watch: {
      usePolling: false,
      ignored: ['**/.git/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:100',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:100',
        ws: true,
      },
    },
  },
})