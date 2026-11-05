import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// src/registry.json lists every work: one HTML entry each, plus a card in the gallery.
const works: { id: string }[] = JSON.parse(readFileSync(resolve(__dirname, 'src/registry.json'), 'utf8'))

// Pages live in works/<id>/ in the source tree but are served at /<id>/ (dev and build).
const flatten = (): Plugin => ({
  name: 'flatten-works',
  configureServer(s) {
    s.middlewares.use((req, _res, next) => {
      const m = req.url?.match(/^\/([\w-]+)\/(\?.*)?$/)
      if (m && works.some((w) => w.id === m[1])) req.url = `/works/${m[1]}/${m[2] ?? ''}`
      next()
    })
  },
  closeBundle() {
    const out = resolve(__dirname, 'dist/works')
    for (const id of readdirSync(out)) {
      const f = resolve(out, id, 'index.html')
      writeFileSync(f, readFileSync(f, 'utf8').replaceAll('../../', '../'))
      cpSync(resolve(out, id), resolve(__dirname, 'dist', id), { recursive: true })
    }
    rmSync(out, { recursive: true })
  },
})

export default defineConfig({
  base: './',
  plugins: [react(), flatten()],
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
