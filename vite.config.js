import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { qrcode } from 'vite-plugin-qrcode'

export default defineConfig({
  plugins: [react(), qrcode()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL),
  },
})