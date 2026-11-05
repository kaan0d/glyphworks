import { capped, revolve, rise, scene, vessel } from '../../shared/shapes'

/** Wine glass: foot, stem, then a tulip bowl with a hollow inside. y from -1.2 to 1.2. */
const BOWL_Y0 = -0.2, TOP = 1.2
const bowlR = (y: number) => 0.62 * Math.sin(0.78 * Math.PI * ((y - BOWL_Y0) / (TOP - BOWL_Y0)) ** 0.8)

export const scene_ = scene({ h: 2.0, w: 1.0 }, (b) => {
  const thr = rise(-1.2, 1.2)
  revolve(b, capped(-1.2, -1.0, (y) => 0.05 + 0.43 * (1 - (y + 1.2) / 0.2) ** 1.6, 0.3), { thr, nv: 120 })
  revolve(b, capped(-1.05, -0.12, (y) => 0.045 + 0.012 * Math.cos((y + 1.05) * 3), 0.03), { thr, nv: 120 })
  revolve(b, vessel(BOWL_Y0, TOP, bowlR, 0.018, 1.15), { thr, nv: 360, nu: 260 })
})
export { scene_ as scene }
