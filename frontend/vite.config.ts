import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow external access
    port: 5173,
    allowedHosts: [
      'deann-salubrious-orville.ngrok-free.dev',
      '.ngrok-free.dev', // Allow any ngrok subdomain
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
