import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/gateway': {
          target: process.env.VITE_GATEWAY_URL || 'http://localhost:4000',
          changeOrigin: true,
        },
        '/arkham': {
          target: process.env.VITE_ARKHAM_URL || 'http://localhost:4100',
          changeOrigin: true,
        },
      },
    },
  };
});
