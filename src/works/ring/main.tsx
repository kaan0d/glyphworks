import { createRoot } from 'react-dom/client'
import { Work } from '../../shared/components/Work'
import { ringScene } from './geometry/ringSurface'
import '../../shared/global.css'

createRoot(document.getElementById('root')!).render(<Work def={ringScene} />)
