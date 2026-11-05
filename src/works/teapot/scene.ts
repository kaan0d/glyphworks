import { ball, capped, clamp01, revolve, rise, scene, sm, spline, tube, type V3 } from '../../shared/shapes'

/** Teapot: round body on a foot ring, lid with a rim and a knob, curved spout on the right, loop handle on the left. */
const body = spline([[-0.64, 0.36], [-0.6, 0.4], [-0.5, 0.58], [-0.25, 0.75], [0.05, 0.78], [0.3, 0.7], [0.45, 0.55], [0.52, 0.44]])
const lid = spline([[0.5, 0.45], [0.54, 0.46], [0.56, 0.4], [0.62, 0.34], [0.72, 0.2], [0.8, 0.06]])
const T = [0, 0.2, 0.4, 0.6, 0.8, 1]
const along = (vals: number[]) => spline(T.map((t, i) => [t, vals[i]] as [number, number]))
const hx = along([-0.35, -0.75, -1.1, -1.12, -0.85, -0.5])
const hy = along([0.42, 0.48, 0.2, -0.15, -0.38, -0.36])

export const scene_ = scene({ h: 1.5, w: 1.95 }, (b) => {
  const thr = rise(-0.65, 0.95)
  revolve(b, capped(-0.62, 0.52, body, 0.04), { thr, nu: 260, nv: 220 })
  revolve(b, capped(0.5, 0.8, lid, 0.04), { thr, nu: 200, nv: 100 })
  ball(b, [0, 0.85, 0], 0.075, thr)
  const spout = (t: number): V3 => [0.4 + 0.95 * t, -0.3 + 0.85 * t ** 1.6, 0]
  tube(b, { path: spout, radius: (t) => 0.17 - 0.095 * t + 0.02 * sm(0.9, 1, t), nt: 80, nr: 22, thr, cap: 0.01 })
  tube(b, { path: (t): V3 => [hx(t), hy(t), 0], radius: (t) => 0.065 + 0.012 * Math.sin(Math.PI * clamp01(t)), nt: 80, nr: 16, thr, cap: 0.01 })
})
export { scene_ as scene }
