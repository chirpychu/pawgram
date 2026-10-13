import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Pawgram is served from https://chirpychu.github.io/pawgram/ (a GitHub Pages
// project page, not a custom domain), so every built asset URL needs the
// /pawgram/ prefix or it 404s once deployed.
export default defineConfig({
  base: '/pawgram/',
  plugins: [react()],
})
