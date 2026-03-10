import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração para suportar o ambiente do Electron
export default defineConfig({
  plugins: [react()],
  base: './', // Importante para que o Electron encontre os assets no build
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
