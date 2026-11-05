import { clamp01, scene, sheet, tiltZ, type V3 } from '../../shared/shapes'

/** Paper plane: a vertical keel folded down the middle and two wings spread from its lower edge. Flat facets, paper thin. */
const A: V3 = [1.4, 0.0, 0], P: V3 = [-1.1, 0.16, 0], K: V3 = [-1.1, -0.62, 0]
const L: V3 = [-1.1, 0.32, 0.98], R: V3 = [-1.1, 0.32, -0.98]
const Lm: V3 = [-0.3, -0.05, 0.5], Rm: V3 = [-0.3, -0.05, -0.5] // wing fold line, where the wing steps back

export const scene_ = scene({ h: 1.0, w: 1.6 }, (b) => {
  sheet(b, [[A, K, P], [A, Lm, K], [A, K, Rm], [Lm, L, K], [Rm, K, R]], (p) => 0.9 * clamp01((1.4 - p[0]) / 2.5))
}, (m) => {
  // turn it so the default view is three quarters, nose slightly up
  const c = Math.cos(0.7), s = Math.sin(0.7)
  for (const a of [m.pos, m.nrm]) for (let i = 0; i < a.length; i += 3) { const x = a[i], z = a[i + 2]; a[i] = c * x + s * z; a[i + 2] = -s * x + c * z }
  return tiltZ(m, 0.12)
})
export { scene_ as scene }
