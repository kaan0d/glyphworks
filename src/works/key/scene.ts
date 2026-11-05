import { TAU, capped, rbox, revolve, rise, scene, tube, type V3 } from '../../shared/shapes'

/** Old key: round bow, shaft with two collars, and a toothed bit at the end. y from about -1.3 to 1.46. */
export const scene_ = scene({ h: 2.35, w: 1.2 }, (b) => {
  const thr = rise(-1.3, 1.5)
  tube(b, { closed: true, nt: 200, nr: 18, radius: () => 0.085, path: (t): V3 => [0.4 * Math.cos(TAU * t), 0.95 + 0.4 * Math.sin(TAU * t), 0], thr })
  revolve(b, capped(-1.3, 0.52, () => 0.07, 0.03), { thr, nu: 80, nv: 200 })
  revolve(b, capped(0.38, 0.48, () => 0.135, 0.2), { thr, nu: 100, nv: 40 })
  revolve(b, capped(0.12, 0.22, () => 0.11, 0.2), { thr, nu: 100, nv: 40 })
  rbox(b, [0.2, -0.72, 0], [0.2, 0.075, 0.055], thr)
  rbox(b, [0.16, -0.93, 0], [0.16, 0.075, 0.055], thr)
  rbox(b, [0.23, -1.14, 0], [0.23, 0.075, 0.055], thr)
}, (m) => { for (let i = 1; i < m.pos.length; i += 3) m.pos[i] -= 0.08; return m })
export { scene_ as scene }
