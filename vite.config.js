import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
