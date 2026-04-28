import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        motherNew: 'mother-new.html',
      },
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
});
