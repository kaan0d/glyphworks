import { ball, clamp01, loopCurve, revolve, scene, sphereCurve, tiltZ } from '../../shared/shapes'

/** Ringed planet with a moon: banded globe, two rings with a gap between them, tilted so the turn reads. */
export const scene_ = scene({ h: 1.2, w: 2.0 }, (b) => {
  const globe = (p: Float64Array) => 0.45 * clamp01((p[1] + 0.62) / 1.24)
  const ring = (p: Float64Array) => 0.5 + 0.35 * clamp01((Math.hypot(p[0], p[2]) - 0.9) / 1.2)
  revolve(b, sphereCurve(0.62), { thr: globe, nu: 240, nv: 200, post: (r, y) => r + 0.014 * Math.sin(y * 34) })
  revolve(b, loopCurve(1.13, 0, 0.2, 0.02), { thr: ring, nu: 400, nv: 24, wrapV: true, w: 1.2 })
  revolve(b, loopCurve(1.6, 0, 0.27, 0.02), { thr: ring, nu: 440, nv: 24, wrapV: true, w: 1.2 })
  ball(b, [1.75, 0.5, 0.3], 0.12, () => 0.9)
}, (m) => {
  tiltZ(m, -0.9)
  // start turned 60 degrees so the rings are open on load, not edge-on
  const c = Math.cos(1.05), sn = Math.sin(1.05)
  for (const a of [m.pos, m.nrm]) for (let i = 0; i < a.length; i += 3) { const x = a[i], z = a[i + 2]; a[i] = c * x + sn * z; a[i + 2] = -sn * x + c * z }
  return m
})
export { scene_ as scene }
