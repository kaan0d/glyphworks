import { TAU, ball, rise, rod, scene, tube, type V3 } from '../../shared/shapes'

/** DNA double helix: two backbone strands and the base pairs between them. y from -1.4 to 1.4. */
const H = 1.4, TURNS = 3.2, RAD = 0.5, OFFSET = 2.4

export const scene_ = scene({ h: 2.25, w: 1.0 }, (b) => {
  const thr = rise(-H, H)
  const at = (y: number, off: number): V3 => { const a = (TAU * TURNS * (y + H)) / (2 * H) + off; return [RAD * Math.sin(a), y, RAD * Math.cos(a)] }
  for (const off of [0, OFFSET]) tube(b, { path: (t) => at(-H + 2 * H * t, off), radius: () => 0.07, nt: 360, nr: 14, thr, cap: 0.01 })
  const rungs = 30
  for (let i = 0; i <= rungs; i++) {
    const y = -H + 0.1 + ((2 * H - 0.2) * i) / rungs
    const p = at(y, 0), q = at(y, OFFSET), m: V3 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]
    rod(b, p, m, 0.03, thr, { nt: 6, nr: 8 })
    rod(b, m, q, 0.03, thr, { nt: 6, nr: 8 })
    ball(b, p, 0.055, thr); ball(b, q, 0.055, thr)
  }
})
export { scene_ as scene }
