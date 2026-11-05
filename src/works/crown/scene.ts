import { ball, clamp01, loopCurve, revolve, rise, scene, sm, TAU } from '../../shared/shapes'
import { MeshBuilder } from '../../shared/surface'

/** Crown: a band with five points, double walled, a rim ring and a jewel on every point and every valley. */
const Y0 = -0.55, WALL = 0.035, N = 5
const tri = (phi: number) => { const q = ((phi * N) / TAU) % 1; return 1 - Math.abs(2 * (q < 0 ? q + 1 : q) - 1) }
const top = (phi: number) => Y0 + 0.65 + 0.55 * tri(phi)
const Rc = (y: number) => 0.58 + 0.2 * clamp01((y - Y0) / 1.2) ** 1.5

export const scene_ = scene({ h: 1.3, w: 1.1 }, (b: MeshBuilder) => {
  const thr = rise(-0.6, 0.75)
  b.surface({
    nu: 320, nv: 120, wrapU: true, wrapV: true, thr, w: 1.1,
    f: (u, v, o) => {
      const phi = TAU * u, s = 1 - Math.abs(2 * v - 1)
      const y = Y0 + (top(phi) - Y0) * s
      const r = Rc(y) - WALL * sm(0.4, 0.6, v)
      o[0] = r * Math.sin(phi); o[1] = y; o[2] = r * Math.cos(phi)
    },
  })
  revolve(b, loopCurve(Rc(Y0) - WALL / 2, Y0, 0.07, 0.045), { thr, nu: 260, nv: 28, wrapV: true })
  for (let k = 0; k < N; k++) {
    const peak = (TAU * (k + 0.5)) / N, mid = (TAU * k) / N, yt = top(peak) + 0.03
    ball(b, [Rc(yt) * Math.sin(peak), yt, Rc(yt) * Math.cos(peak)], 0.07, thr)
    ball(b, [(Rc(-0.3) + 0.01) * Math.sin(mid), -0.3, (Rc(-0.3) + 0.01) * Math.cos(mid)], 0.06, thr)
  }
})
export { scene_ as scene }
