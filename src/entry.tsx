import { createRoot } from 'react-dom/client'
import { Work } from './shared/components/Work'
import type { SceneDef } from './shared/surface'
import './shared/global.css'

// Each work page sets <html data-work="id">; the geometry is src/works/<id>/scene.ts, loaded on demand.
const id = document.documentElement.dataset.work!
const scenes = import.meta.glob<{ scene: SceneDef }>('./works/*/scene.ts')
scenes[`./works/${id}/scene.ts`]().then((m) => createRoot(document.getElementById('root')!).render(<Work def={m.scene} />))
