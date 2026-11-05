import data from './mesh.json'
import { importedMesh, type MeshData } from '../../shared/importedMesh'
import type { SceneDef } from '../../shared/surface'

/** Hourglass: plates and posts rise first, the see-through glass with them, the sand fills in last. y from -1.35 to 1.35. */
const rules = [
  { match: /sand/, base: 0.35, span: 0.65, seam: 0.1, weight: 1 },
  { match: /glass/, base: 0, span: 0.7, seam: 0.3, weight: 1, ghost: true },
  { match: /./, base: 0, span: 0.75, seam: 0.4, weight: 1.2 },
]
export const scene: SceneDef = { build: () => importedMesh(data as MeshData, 2.7, rules), fit: { h: 2.35, w: 1.2 } }
