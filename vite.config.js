import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      clientPort: 3000,
    },
    allowedHosts: ['.e2b.app', '.e2b.dev'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: [
      'tests/e2e/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**'
    ],
  },
})