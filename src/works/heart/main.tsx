import { createRoot } from 'react-dom/client'
import { Work } from '../../shared/components/Work'
import { heartScene } from './geometry/heartSurface'
import '../../shared/global.css'

createRoot(document.getElementById('root')!).render(<Work def={heartScene} />)
