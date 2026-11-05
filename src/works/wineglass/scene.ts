import data from './mesh.json'
import { importedMesh, type MeshData } from '../../shared/importedMesh'
import type { SceneDef } from '../../shared/surface'

/** Reveal: foot and stem rise, the faceted bowl follows, the wine fills in last. The glass does not hide the wine behind it. */
const rules = [
  { match: /01$/, base: 0.4, span: 0.6, seam: 0.1, weight: 1 },
  { match: /./, base: 0, span: 0.75, seam: 0.3, weight: 1, ghost: true },
]
export const scene: SceneDef = { build: () => importedMesh(data as MeshData, 1.9, rules), fit: { h: 1.95, w: 1.15 } }
