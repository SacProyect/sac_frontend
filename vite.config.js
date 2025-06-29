/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from "path"
import { qrcode } from 'vite-plugin-qrcode';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), qrcode()],
  // base: process.env.VITE_BASE_PATH || '/react-vite-deploy',
  define: {
    // env variable from .env file
    'process.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL)
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor_react';
            // if (id.includes('recharts')) return 'vendor_charts';
            if (id.includes('jspdf')) return 'vendor_pdf';
            if (id.includes('html2canvas')) return 'vendor_canvas';
          }
        }
      }
    }
  },
  server: {
    watch: {
      usePolling: false,
      interval: 1000, // 1 segundo
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    origin: "https://f7a3-149-88-17-159.ngrok-free.app", // your ngrok URL
    allowedHosts: [
      "f7a3-149-88-17-159.ngrok-free.app"
    ],
  },
});