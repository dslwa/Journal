import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // potrzebne zeby Vite sluchal poza kontenerem
    port: 5173,
    proxy: {
      // Requesty na /api/* przekierowuje do backendu
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
      },
    },
  },
})
