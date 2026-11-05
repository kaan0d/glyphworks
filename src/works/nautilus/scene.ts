import { MeshBuilder } from '../../shared/surface'
import { TAU, clamp01, normalizer, scene } from '../../shared/shapes'

/**
 * Nautilus shell: a tube that grows by a constant factor per turn (logarithmic spiral). The section is a kidney, flattened
 * where it rests on the previous whorl, and dense stripes run across the shell like the real pattern.
 */
const B = 0.19, KAPPA = 0.56, T0 = -3.4, T1 = 9.2
const g = (u: number, v: number, o: Float64Array) => {
  const th = T0 + (T1 - T0) * u, ph = TAU * v, rho = Math.exp(B * th)
  const close = Math.sqrt(1 - (1 - Math.min(u / 0.03, 1)) ** 2) // closes the tiny apex
  const k = KAPPA * close * (1 - 0.2 * Math.max(-Math.cos(ph), 0)) // flat side towards the centre of the spiral
  const rad = 1 + k * Math.cos(ph)
  o[0] = rho * rad * Math.cos(th); o[1] = rho * rad * Math.sin(th); o[2] = rho * k * Math.sin(ph) * 1.15
}

export const scene_ = scene({ h: 1.55, w: 1.5 }, (b: MeshBuilder) => {
  const n = normalizer(g, 2.2)
  const l0 = B * T0, l1 = B * T1
  b.surface({
    nu: 560, nv: 72, wrapV: true, f: n.map,
    // denser glyphs on stripes that sweep from the spiral outwards over the back of the shell
    w: (u, v) => 0.7 + 0.8 * Math.max(0, Math.sin(26 * (T0 + (T1 - T0) * u) + 2.4 * Math.cos(TAU * v))) ** 3,
    // away from the centre line of the tube
    ref: (u, _v, o) => { const th = T0 + (T1 - T0) * u, rho = Math.exp(B * th); o[0] = (rho * Math.cos(th) - n.c[0]) * n.s; o[1] = (rho * Math.sin(th) - n.c[1]) * n.s; o[2] = -n.c[2] * n.s },
    thr: (p) => 0.9 * clamp01((Math.log(Math.hypot(p[0] / n.s + n.c[0], p[1] / n.s + n.c[1]) || 1) - l0 + 0.6) / (l1 - l0 + 0.6)),
  })
})
export { scene_ as scene }
