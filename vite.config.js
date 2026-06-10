import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://odectra.github.io/Portfoljbygge/ on GitHub Pages.
  base: '/Portfoljbygge/',
  plugins: [react(), tailwindcss()],
})
