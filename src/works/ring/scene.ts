import data from './mesh.json'
import { MeshBuilder, type SceneDef, type SurfaceMesh } from '../../shared/surface'

const { cy, pos, nrm, idx, layer } = data as { cy: number; pos: number[]; nrm: number[]; idx: number[]; layer: number[] }
const TAU = Math.PI * 2

/** Reveal order: band and pavé draw from the bottom up (0..0.6), head prongs rise (0.6..0.75), the main stone fills in last. */
function thr(p: ArrayLike<number>, l: number) {
  const ang = Math.atan2(p[1] - cy, p[0]) + Math.PI / 2 // 0 at the bottom
  const d = Math.abs(((ang + Math.PI * 3) % TAU) - Math.PI) / Math.PI // 0 bottom .. 1 top
  if (l === 2) return 0.75 + 0.25 * Math.min(Math.max((p[1] - 0.35) / 0.8, 0), 1)
  if (p[1] > cy + 0.85) return 0.6 + 0.15 * Math.min(Math.max((p[1] - cy - 0.85) / 0.6, 0), 1) // head prongs above the band
  return 0.6 * d + (l === 1 ? 0.05 : 0)
}

function build(): SurfaceMesh {
  const b = new MeshBuilder()
  const V = (i: number) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]
  const mi: number[] = []
  for (let t = 0; t < layer.length; t++) {
    const a = V(idx[t * 3]), c = V(idx[t * 3 + 1]), d = V(idx[t * 3 + 2])
    if (layer[t] === 0) {
      mi.push(t)
    } else {
      const cen = [(a[0] + c[0] + d[0]) / 3, (a[1] + c[1] + d[1]) / 3, (a[2] + c[2] + d[2]) / 3]
      b.flat(a, c, d, (p) => thr(p, layer[t]), 0.5, 1.6, [cen[0], cen[1] - cy, cen[2]])
    }
  }
  // metal: one indexed mesh with the exported normals
  const vm = new Map<number, number>()
  const idxOut: number[] = []
  const metalMesh = new MeshBuilder()
  for (const t of mi) for (let k = 0; k < 3; k++) {
    const s = idx[t * 3 + k]
    if (!vm.has(s)) vm.set(s, metalMesh.vert(V(s), [nrm[s * 3] / 100, nrm[s * 3 + 1] / 100, nrm[s * 3 + 2] / 100], thr(V(s), 0), 0.15, 1.2))
    idxOut.push(vm.get(s)!)
  }
  const mm = metalMesh.build()
  mm.idx = Uint32Array.from(idxOut)
  b.merge(mm)
  return b.build()
}

export const scene: SceneDef = { build, fit: { h: 1.85, w: 1.45 } }
