import { TAU, scene, tube, type V3 } from '../../shared/shapes'

/** Trefoil knot: a (2,3) torus knot drawn as one thick tube. */
const K = 0.4

export const scene_ = scene({ h: 1.55, w: 1.5 }, (b) => {
  tube(b, {
    closed: true, nt: 700, nr: 20, radius: () => 0.17,
    path: (t): V3 => { const s = TAU * t, r = 2 + Math.cos(3 * s); return [K * r * Math.cos(2 * s), K * r * Math.sin(2 * s), K * 1.1 * Math.sin(3 * s)] },
    thr: (p) => 0.9 * (Math.atan2(p[1], p[0]) / TAU + 0.5),
  })
})
export { scene_ as scene }
