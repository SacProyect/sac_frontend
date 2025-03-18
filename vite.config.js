/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: process.env.VITE_BASE_PATH || '/react-vite-deploy',
  define: {
    // env variable from .env file
    'process.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL)
  }
})
