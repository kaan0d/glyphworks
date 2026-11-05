import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// One HTML entry per work. Add new works to this list.
const works = ['heart']

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        gallery: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(works.map((w) => [w, resolve(__dirname, `works/${w}/index.html`)])),
      },
    },
  },
})
