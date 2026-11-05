import { TAU, capped, fromR, revolve, rise, rod, scene, spline } from '../../shared/shapes'

/** Hourglass: two glass bulbs, a pinched neck, end plates, three posts and a mound of sand below. y from -1.35 to 1.35. */
const glass = (y: number) => {
  const h = Math.abs(y)
  const flare = 0.05 + 0.5 * Math.sin(Math.PI * 0.5 * Math.min(h / 0.75, 1)) ** 1.6
  const round = h > 1.0 ? Math.sqrt(Math.max(1 - ((h - 1.0) / 0.2) ** 2, 0)) : 1
  return flare * round
}
const sand = spline([[-1.05, 0.0], [-1.04, 0.3], [-0.9, 0.42], [-0.75, 0.3], [-0.55, 0.12], [-0.45, 0.0]])

export const scene_ = scene({ h: 2.35, w: 1.2 }, (b) => {
  const thr = rise(-1.35, 1.35)
  revolve(b, fromR(-1.2, 1.2, glass), { thr, nu: 240, nv: 320 })
  revolve(b, capped(-1.34, -1.2, () => 0.68, 0.12), { thr, nu: 200, nv: 60 })
  revolve(b, capped(1.2, 1.34, () => 0.68, 0.12), { thr, nu: 200, nv: 60 })
  for (let k = 0; k < 3; k++) {
    const a = TAU * (k / 3 + 0.08), x = 0.6 * Math.sin(a), z = 0.6 * Math.cos(a)
    rod(b, [x, -1.25, z], [x, 1.25, z], 0.035, thr, { nt: 80, cap: 0.01 })
  }
  revolve(b, capped(-1.06, -0.44, sand, 0.02), { thr: (p) => 0.35 + 0.4 * (p[1] + 1.06), nu: 120, nv: 80, w: 0.9 })
})
export { scene_ as scene }
