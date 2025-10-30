import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'mentescreativasstore.local', // 👈 añade esta línea
    port: 5173,                         // 👈 puedes fijar el puerto si quieres
    proxy: {
      '/api': 'http://localhost:3000',
      '/img/disenios_base': 'http://localhost:3000',
    },
  },
})