import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { setupAPI } from './api';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'setup-express',
      configureServer(server) {
        setupAPI(server);
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  base: '/',
  server: {
    port: 5173
  }
});