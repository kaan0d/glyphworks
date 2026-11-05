import { ball, capped, revolve, rise, scene, sm, spline, tube, type V3 } from '../../shared/shapes'

/** Klein bottle: a pear-shaped bulb whose neck rises, bends over and comes back through the side wall into the bulb. */
const bulb = spline([[-1.4, 0.0], [-1.36, 0.3], [-1.05, 0.64], [-0.6, 0.72], [-0.2, 0.6], [0.1, 0.34], [0.4, 0.17]])
const T = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]
const along = (vals: number[]) => spline(T.map((t, i) => [t, vals[i]] as [number, number]))
const px = along([0, 0, 0.3, 0.85, 1.25, 1.15, 0.7, 0.15])
const py = along([0.25, 0.65, 1.15, 1.35, 0.85, 0.05, -0.55, -0.62])

export const scene_ = scene({ h: 2.1, w: 1.5 }, (b) => {
  const thr = rise(-1.4, 1.45)
  revolve(b, capped(-1.4, 0.4, bulb, 0.03), { thr, nu: 240, nv: 260 })
  tube(b, {
    path: (t): V3 => [px(t), py(t), 0], thr, nt: 220, nr: 28, cap: 0.01,
    radius: (t) => 0.17 + 0.05 * sm(0.75, 1, t),
  })
  ball(b, [0, 0.4, 0], 0.17, thr)
}, (m) => { for (let i = 0; i < m.pos.length; i += 3) m.pos[i] -= 0.34; return m })
export { scene_ as scene }
