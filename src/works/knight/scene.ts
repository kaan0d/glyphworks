import { MeshBuilder } from '../../shared/surface'
import { TAU, capped, clamp01, revolve, rise, scene, sgnPow, spline } from '../../shared/shapes'

/**
 * Chess knight: a horse head and neck on a round pedestal. The head is a closed pillow built from a side outline:
 * seen from the centre C, the polygon gives a radius at every angle, and the thickness varies by angle (thin ears and muzzle).
 */
const C: [number, number] = [0.2, 0.7]
// side outline, counter-clockwise from the back of the chest; the horse looks to +x
const OUTLINE: [number, number][] = [
  [-0.5, -0.25], [-0.6, 0.05], [-0.56, 0.4], [-0.42, 0.78], [-0.26, 1.08], [-0.16, 1.28],
  [-0.12, 1.55], [0.02, 1.36], [0.2, 1.27], [0.45, 1.12], [0.72, 0.95], [0.92, 0.8], [1.02, 0.68],
  [1.08, 0.56], [1.05, 0.44], [0.95, 0.38], [0.78, 0.4], [0.6, 0.46], [0.46, 0.45], [0.38, 0.3], [0.36, 0.1], [0.46, -0.05], [0.5, -0.25],
]
const N = 720, SQ = 0.78 // SQ < 1 flattens the sides of the head
const gauss = (x: number, m: number, w: number) => Math.exp(-(((x - m) / w) ** 2))
const angDiff = (a: number, m: number) => Math.atan2(Math.sin(a - m), Math.cos(a - m))

/** Farthest hit of the ray from C with the outline. */
function reach(th: number) {
  const dx = Math.cos(th), dy = Math.sin(th)
  let best = 0.05
  for (let i = 0; i < OUTLINE.length; i++) {
    const [ax, ay] = OUTLINE[i], [bx, by] = OUTLINE[(i + 1) % OUTLINE.length]
    const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((ax - C[0]) * ey - (ay - C[1]) * ex) / den
    const s = ((ax - C[0]) * dy - (ay - C[1]) * dx) / den
    if (t > 0 && s >= 0 && s <= 1 && t > best) best = t
  }
  return best
}
// radius table, smoothed so corners become round
let rho = Array.from({ length: N }, (_, i) => reach((TAU * i) / N))
for (let pass = 0; pass < 3; pass++) rho = rho.map((_, i) => { let s = 0; for (let k = -4; k <= 4; k++) s += rho[(i + k + N) % N]; return s / 9 })
const rhoAt = (th: number) => { const x = (((th / TAU) % 1) + 1) % 1 * N, i = Math.floor(x), f = x - i; return rho[i % N] * (1 - f) + rho[(i + 1) % N] * f }
const ear = Math.atan2(1.55 - C[1], -0.12 - C[0]), nose = Math.atan2(0.5 - C[1], 1.05 - C[0])
const depth = (th: number) => 0.34 - 0.21 * gauss(angDiff(th, ear), 0, 0.09) - 0.12 * gauss(angDiff(th, nose), 0, 0.3) - 0.08 * gauss(angDiff(th, Math.PI), 0, 0.3)

const base = spline([[-0.8, 0.5], [-0.78, 0.58], [-0.7, 0.62], [-0.62, 0.52], [-0.5, 0.44], [-0.42, 0.42], [-0.34, 0.5], [-0.27, 0.52]])
const DIMPLES: [number, number, number, number][] = [[0.5, 0.95, 0.075, 0.03], [1.0, 0.56, 0.045, 0.025]] // eye, nostril: x, y, radius, depth

export const scene_ = scene({ h: 2.0, w: 1.55 }, (b: MeshBuilder) => {
  const thr = rise(-0.8, 1.6)
  revolve(b, capped(-0.8, -0.27, base, 0.03), { thr, nu: 240, nv: 200, w: 1.1 })
  b.surface({
    nu: 360, nv: 200, wrapU: true, thr, w: 1.1,
    f: (u, v, o) => {
      const th = TAU * u, ph = Math.PI * clamp01(v)
      const r = rhoAt(th) * Math.sin(ph) ** SQ
      const x = C[0] + r * Math.cos(th), y = C[1] + r * Math.sin(th)
      let z = depth(th) * sgnPow(Math.cos(ph), SQ) * (0.35 + 0.65 * Math.min(rhoAt(th) / 0.5, 1))
      for (const [px, py, rad, dp] of DIMPLES) {
        const d = Math.hypot(x - px, y - py)
        if (d < rad && Math.abs(z) > 0.05) z -= Math.sign(z) * dp * (1 - d / rad) ** 2
      }
      o[0] = x; o[1] = y; o[2] = z
    },
  })
}, (m) => { for (let i = 0; i < m.pos.length; i += 3) { m.pos[i] -= 0.25; m.pos[i + 1] -= 0.38 } return m })
export { scene_ as scene }
