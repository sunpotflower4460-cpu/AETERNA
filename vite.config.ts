import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  test: {
    // Playwright e2e specs under tests/e2e live in a separate runner
    // (npm run test:e2e) and must not be collected by vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  },
});
