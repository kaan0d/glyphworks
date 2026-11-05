import type { SurfaceMesh } from './surface'

/** Exported OBJ groups: vertices in final world units (centred, y up), normals as ints /100, `part` = group index per vertex. */
export interface MeshData { names: string[]; pos: number[]; nrm: number[]; idx: number[]; part: number[] }
/** How one group is drawn: threshold = base + span * (height 0..1), ghost = see-through glass. */
export interface PartRule { match: RegExp; base: number; span: number; seam: number; weight: number; ghost?: boolean }

export function importedMesh(d: MeshData, height: number, rules: PartRule[]): SurfaceMesh {
  const n = d.part.length
  const thr = new Float32Array(n), seam = new Float32Array(n), weight = new Float32Array(n), ghost = new Float32Array(n)
  const rule = d.names.map((nm) => rules.find((r) => r.match.test(nm)) ?? rules[rules.length - 1])
  for (let i = 0; i < n; i++) {
    const r = rule[d.part[i]], yn = Math.min(Math.max(d.pos[i * 3 + 1] / height + 0.5, 0), 1)
    thr[i] = Math.min(r.base + r.span * yn, 1); seam[i] = r.seam; weight[i] = r.weight; ghost[i] = r.ghost ? 1 : 0
  }
  return { pos: Float32Array.from(d.pos), nrm: Float32Array.from(d.nrm, (v) => v / 100), thr, seam, weight, idx: Uint32Array.from(d.idx), ghost }
}
