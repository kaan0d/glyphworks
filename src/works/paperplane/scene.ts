import { clamp01, scene, sheet, type V3 } from '../../shared/shapes'

/** Paper plane: two wings folded down to a keel, with an inner layer on top. Flat facets, paper thin. */
const A: V3 = [1.35, 0, 0], L: V3 = [-1.1, 0.22, 0.95], R: V3 = [-1.1, 0.22, -0.95], K: V3 = [-1.1, -0.45, 0], T: V3 = [-1.1, 0.05, 0]

export const scene_ = scene({ h: 0.95, w: 1.6 }, (b) => {
  sheet(b, [[A, L, K], [A, K, R], [A, L, T], [A, T, R]], (p) => 0.9 * clamp01((1.35 - p[0]) / 2.45))
})
export { scene_ as scene }
