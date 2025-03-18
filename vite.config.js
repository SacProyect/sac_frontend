/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { defineConfig } from 'vite'
<<<<<<< HEAD
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { qrcode } from 'vite-plugin-qrcode'
=======
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)

export default defineConfig({
<<<<<<< HEAD
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
=======
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/react-vite-deploy',
  define: {
    // env variable from .env file
    'process.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL)
  }
})
>>>>>>> f015be3 (validations and changes in files for tsx instead of jsx)
