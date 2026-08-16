import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
    allowedHosts: [
      'c947-2401-4900-1ce0-6e68-5dc5-7b39-69aa-886f.ngrok-free.app'
    ]
  },
});
