import { TAU, scene, tube, type V3 } from '../../shared/shapes'

/** Möbius band: a wide flat section that makes half a twist on the way round, so the loop has one side. */
const R = 0.9, A = 0.34, B = 0.05, TILT = 0.5

export const scene_ = scene({ h: 1.6, w: 1.5 }, (b) => {
  tube(b, {
    closed: true, nt: 520, nr: 36,
    path: (t): V3 => [R * Math.cos(TAU * t), R * Math.sin(TAU * t) * Math.cos(TILT), R * Math.sin(TAU * t) * Math.sin(TILT)],
    section: (t, ph) => { const x = A * Math.cos(ph), y = B * Math.sin(ph), c = Math.cos(Math.PI * t), s = Math.sin(Math.PI * t); return [x * c - y * s, x * s + y * c] },
    thr: (p) => 0.9 * (Math.atan2(p[1], p[0]) / TAU + 0.5),
  })
})
export { scene_ as scene }
