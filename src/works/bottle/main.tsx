import { createRoot } from 'react-dom/client'
import { Work } from '../../shared/components/Work'
import { bottleScene } from './geometry/bottleSurface'
import '../../shared/global.css'

createRoot(document.getElementById('root')!).render(<Work def={bottleScene} />)
