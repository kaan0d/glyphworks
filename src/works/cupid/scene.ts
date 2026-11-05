import { MeshBuilder } from '../../shared/surface'
import { TAU, ball, clamp01, rod, scene, sheet, type V3 } from '../../shared/shapes'
import { heartScene } from '../heart/geometry/heartSurface'

/** The heart balloon pierced by an arrow: it enters on the front, leaves at the back, and the heart hides the middle. */
const TAIL: V3 = [-1.2, 0.75, 0.55], TIP: V3 = [1.2, -0.6, -0.55]

export const scene_ = scene({ h: 1.55, w: 1.45 }, (b: MeshBuilder) => {
  b.merge(heartScene.build())
  const d = TIP.map((v, i) => v - TAIL[i]) as V3, len = Math.hypot(...d)
  const u = d.map((v) => v / len) as V3
  const along = (s: number): V3 => [TAIL[0] + u[0] * s, TAIL[1] + u[1] * s, TAIL[2] + u[2] * s]
  const thr = (p: ArrayLike<number>) => 0.78 + 0.15 * clamp01((p[0] + 1.2) / 2.4)
  rod(b, TAIL, along(len - 0.3), 0.03, thr, { nt: 60, nr: 12, w: 1.3 })
  rod(b, along(len - 0.36), TIP, (t) => 0.11 * (1 - t) ** 0.8, thr, { nt: 24, nr: 16, cap: 0.02 })
  ball(b, TAIL, 0.045, thr)
  // three vanes at the tail, spread around the shaft
  const e1 = norm(cross(u, [0, 1, 0])), e2 = cross(u, e1)
  for (let k = 0; k < 3; k++) {
    const a = (TAU * k) / 3 + 0.4, w = e1.map((v, i) => Math.cos(a) * v + Math.sin(a) * e2[i]) as V3
    const at = (s: number, o: number): V3 => { const p = along(s); return [p[0] + w[0] * o, p[1] + w[1] * o, p[2] + w[2] * o] }
    sheet(b, [[at(0.02, 0), at(0.4, 0), at(0.5, 0.2)], [at(0.02, 0), at(0.5, 0.2), at(0.12, 0.2)]], thr, 0.3, 1.2, 0.004)
  }
})
export { scene_ as scene }

function cross(a: V3, c: V3): V3 { return [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]] }
function norm(a: V3): V3 { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l] }
