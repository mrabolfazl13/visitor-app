import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3100,
    strictPort: true,
    // Browser-only dev path: the Tauri build calls the API through the Rust
    // `api_request` command instead, so no proxy is involved there.
    proxy: {
      '/api': {
        target: process.env.B2B_API_PROXY ?? 'https://visitor.absadeghi.ir',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
