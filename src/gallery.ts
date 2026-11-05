import works from './registry.json'

// Cards come from src/registry.json, thumbnails from public/thumbs/<id>.jpg.
const grid = document.getElementById('grid')!
for (const w of works) {
  const a = document.createElement('a')
  a.href = `./${w.id}/`
  a.className = 'card'
  a.innerHTML = `<div class="thumb"><img src="./thumbs/${w.id}.jpg" alt="" loading="lazy" /></div>
    <div class="meta"><span class="t">${w.title}</span><span class="d">${w.description}</span></div>`
  grid.append(a)
}
