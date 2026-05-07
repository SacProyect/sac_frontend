/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { qrcode } from 'vite-plugin-qrcode'

export default defineConfig({
  plugins: [react(), qrcode()],
  resolve: {
<<<<<<< HEAD
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
=======
    dedupe: ['react', 'react-dom'],
>>>>>>> staging2.0
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL),
  },
})
