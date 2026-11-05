// Writes <id>/index.html for every entry in src/registry.json (the pages differ only in title and id).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const works = JSON.parse(readFileSync('src/registry.json', 'utf8'))
for (const w of works) {
  mkdirSync(w.id, { recursive: true })
  writeFileSync(`${w.id}/index.html`, `<!doctype html>
<html lang="en" data-work="${w.id}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${w.title} · glyphworks</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="../src/entry.tsx"></script>
  </body>
</html>
`)
}
console.log(`wrote ${works.length} pages`)
