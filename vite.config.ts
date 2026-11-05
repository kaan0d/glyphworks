import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// works/registry.json lists every work: one HTML entry each, plus a card in the gallery.
const works: { id: string }[] = JSON.parse(readFileSync(resolve(__dirname, 'works/registry.json'), 'utf8'))

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: {
        gallery: resolve(__dirname, 'index.html'),
        ...Object.fromEntries(works.map((w) => [w.id, resolve(__dirname, `works/${w.id}/index.html`)])),
      },
    },
  },
})
