import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/sms': {
          target: 'https://api.payamak-panel.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/sms/, '')
        }
      }
    },
  };
});