import { MeshBuilder } from '../../shared/surface'
import { TAU, capped, fromR, revolve, rise, rod, scene, spline, tube, type V3 } from '../../shared/shapes'

/** Light bulb: glass globe, threaded screw base with a contact, and a filament on two stems. y from -1.1 to 1.12. */
const lower = spline([[-0.5, 0.3], [-0.3, 0.32], [0, 0.46], [0.2, 0.68], [0.4, 0.72], [0.6, 0.7]])
const glass = (y: number) => (y >= 0.4 ? Math.sqrt(Math.max(0.72 * 0.72 - (y - 0.4) ** 2, 0)) : lower(y))

export const scene_ = scene({ h: 1.95, w: 1.15 }, (b: MeshBuilder) => {
  const thr = rise(-1.1, 1.12)
  revolve(b, fromR(-0.5, 1.12, glass), { thr, nu: 260, nv: 280 })
  // screw base with a helical thread, then the contact at the bottom
  revolve(b, capped(-0.98, -0.45, () => 0.3, 0.04), {
    thr, nu: 260, nv: 200, w: 1.1,
    post: (r, y, phi) => (y > -0.95 && y < -0.5 ? r + 0.03 * Math.cos(phi - 38 * y) : r),
  })
  revolve(b, capped(-1.1, -0.96, (y) => 0.12 * Math.sqrt(Math.max(1 - ((-0.96 - y) / 0.14) ** 2 * 0.5, 0)), 0.2), { thr, nu: 80, nv: 40 })
  // filament: two stems and a loop between them
  rod(b, [-0.16, -0.4, 0], [-0.16, 0.4, 0], 0.012, thr, { nt: 20, nr: 8 })
  rod(b, [0.16, -0.4, 0], [0.16, 0.4, 0], 0.012, thr, { nt: 20, nr: 8 })
  const fil = (t: number): V3 => [-0.16 + 0.32 * t, 0.4 + 0.1 * Math.sin(Math.PI * t) + 0.02 * Math.sin(TAU * 8 * t), 0]
  tube(b, { path: fil, radius: () => 0.014, nt: 140, nr: 8, thr, cap: 0.02, w: 1.3 })
})
export { scene_ as scene }
