import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps built asset paths relative so the app works from any
// subpath — GitHub Pages project sites, Netlify, or a plain file server.
export default defineConfig({
  base: './',
  plugins: [react()],
})
