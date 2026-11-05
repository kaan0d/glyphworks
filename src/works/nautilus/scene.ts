import { MeshBuilder } from '../../shared/surface'
import { TAU, clamp01, normalizer, scene } from '../../shared/shapes'

/** Nautilus shell: a tube whose size grows by a constant factor per turn (logarithmic spiral), with fine ribs. */
const B = 0.19, KAPPA = 0.55, T0 = -3.2, T1 = 9.4
const g = (u: number, v: number, o: Float64Array) => {
  const th = T0 + (T1 - T0) * u, ph = TAU * v, rho = Math.exp(B * th)
  const close = Math.sqrt(1 - (1 - Math.min(u / 0.03, 1)) ** 2) // closes the tiny apex
  const k = KAPPA * close * (1 + 0.035 * Math.sin(70 * th))
  const rad = 1 + k * Math.cos(ph)
  o[0] = rho * rad * Math.cos(th); o[1] = rho * rad * Math.sin(th); o[2] = rho * k * Math.sin(ph) * 1.1
}

export const scene_ = scene({ h: 1.55, w: 1.5 }, (b: MeshBuilder) => {
  const n = normalizer(g, 2.2)
  const l0 = Math.log(Math.exp(B * T0)), l1 = Math.log(Math.exp(B * T1))
  b.surface({
    nu: 520, nv: 64, wrapV: true, f: n.map,
    // away from the centre line of the tube
    ref: (u, _v, o) => { const th = T0 + (T1 - T0) * u, rho = Math.exp(B * th); o[0] = (rho * Math.cos(th) - n.c[0]) * n.s; o[1] = (rho * Math.sin(th) - n.c[1]) * n.s; o[2] = (0 - n.c[2]) * n.s },
    thr: (p) => 0.9 * clamp01((Math.log(Math.hypot(p[0] / n.s + n.c[0], p[1] / n.s + n.c[1]) || 1) - l0 + 0.6) / (l1 - l0 + 0.6)),
  })
})
export { scene_ as scene }
