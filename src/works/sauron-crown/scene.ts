import data from './mesh.json'
import { importedMesh, type MeshData } from '../../shared/importedMesh'
import type { SceneDef } from '../../shared/surface'

/** Sauron's crown: the spiked ring rises from the base to the tips. */
const rules = [{ match: /./, base: 0, span: 1, seam: 0.3, weight: 1 }]
export const scene: SceneDef = { build: () => importedMesh(data as MeshData, 1.9, rules), fit: { h: 1.7, w: 1.3 } }
