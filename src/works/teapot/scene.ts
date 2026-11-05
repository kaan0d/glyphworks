import { TAU, ball, capped, clamp01, revolve, rise, scene, spline, tube, type V3 } from '../../shared/shapes'

/** Teapot: round body, domed lid with a knob, a curved spout on the right and a loop handle on the left. */
const body = spline([[-0.62, 0.34], [-0.55, 0.55], [-0.2, 0.74], [0.15, 0.72], [0.42, 0.56], [0.52, 0.4]])
const lid = spline([[0.5, 0.4], [0.58, 0.3], [0.7, 0.16], [0.78, 0.07]])

export const scene_ = scene({ h: 1.55, w: 1.9 }, (b) => {
  const thr = rise(-0.65, 0.95)
  revolve(b, capped(-0.62, 0.52, body, 0.04), { thr, nu: 240, nv: 200 })
  revolve(b, capped(0.5, 0.78, lid, 0.04), { thr, nu: 160, nv: 80 })
  ball(b, [0, 0.84, 0], 0.075, thr)
  // spout: leaves the body low on the right, curves up and thins out
  const spout = (t: number): V3 => [0.5 + 0.95 * t, -0.3 + 0.85 * t ** 1.8, 0]
  tube(b, { path: spout, radius: (t) => 0.16 - 0.09 * t, nt: 70, nr: 20, thr, cap: 0.01 })
  // handle: a loop through the left side of the body
  const handle = (t: number): V3 => { const a = Math.PI * (0.5 + t); return [-0.58 + 0.62 * Math.cos(a), 0.05 + 0.5 * Math.sin(a), 0] }
  tube(b, { path: handle, radius: (t) => 0.06 + 0.012 * Math.sin(Math.PI * clamp01(t)), nt: 60, nr: 16, thr, cap: 0.01 })
})
export { scene_ as scene }
