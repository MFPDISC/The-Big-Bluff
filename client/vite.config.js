import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/The-Big-Bluff/',
  plugins: [react()],
  preview: {
    allowedHosts: ['bigbluff.btcnews.co.za', 'localhost', '127.0.0.1']
  },
  server: {
    port: 3302,
    host: '0.0.0.0',
    allowedHosts: ['bigbluff.btcnews.co.za', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' ? 'http://146.190.230.28:5000' : 'http://localhost:5002',
        changeOrigin: true
      }
    }
  }
})
