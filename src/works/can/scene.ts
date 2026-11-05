import data from './mesh.json'
import { importedMesh, type MeshData } from '../../shared/importedMesh'
import type { SceneDef } from '../../shared/surface'

/** Reveal: the can rises from its base, the rim and tab fill in last. */
const rules = [
  { match: /top/i, base: 0.2, span: 0.8, seam: 0.5, weight: 1.5 },
  { match: /./, base: 0, span: 0.8, seam: 0.15, weight: 1 },
]
export const scene: SceneDef = { build: () => importedMesh(data as MeshData, 1.8, rules), fit: { h: 1.6, w: 0.95 } }
