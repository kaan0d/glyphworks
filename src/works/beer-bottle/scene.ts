import data from './mesh.json'
import { importedMesh, type MeshData } from '../../shared/importedMesh'
import type { SceneDef } from '../../shared/surface'

/** Reveal: glass rises from the base, the beer fills in, the plug closes last. The glass does not hide the beer behind it. */
const rules = [
  { match: /plug/i, base: 0.75, span: 0.25, seam: 0.5, weight: 1.5 },
  { match: /liquid/i, base: 0.25, span: 0.5, seam: 0.1, weight: 1 },
  { match: /./, base: 0, span: 0.7, seam: 0.15, weight: 1, ghost: true },
]
export const scene: SceneDef = { build: () => importedMesh(data as MeshData, 1.9, rules), fit: { h: 1.95, w: 0.9 } }
