import { RING as K } from '../config/geometry'
import { MeshBuilder, type SceneDef, type SurfaceMesh } from '../../../shared/surface'

const TAU = Math.PI * 2
const sgnPow = (x: number, p: number) => Math.sign(x) * Math.abs(x) ** p

/**
 * Reveal order: the band draws itself from the bottom up (0..0.5),
 * the prongs rise (0.5..0.7), then the stone fills in from its culet (0.7..1).
 */
function band(b: MeshBuilder) {
  const f = (u: number, v: number, o: Float64Array) => {
    const a = TAU * u, w = TAU * v + 0.013
    const rad = K.bandR + K.bandA * sgnPow(Math.cos(w), K.squareness)
    o[0] = rad * Math.cos(a); o[1] = K.bandCy + rad * Math.sin(a); o[2] = K.bandB * sgnPow(Math.sin(w), K.squareness)
  }
  const ref = (u: number, _v: number, o: Float64Array) => {
    const a = TAU * u
    o[0] = K.bandR * Math.cos(a); o[1] = K.bandCy + K.bandR * Math.sin(a); o[2] = 0
  }
  const thr = (p: Float64Array) => {
    const ang = Math.atan2(p[1] - K.bandCy, p[0]) + Math.PI / 2 // 0 at the bottom
    const d = Math.abs(((ang + Math.PI * 3) % TAU) - Math.PI) / Math.PI // 0 bottom .. 1 top
    return 0.5 * d
  }
  b.grid(420, 40, f, ref, thr, 0, 1, true, true)
}

function prongs(b: MeshBuilder) {
  const top = K.girdleY + 0.01, h = top - K.prongBaseY
  // prongs hug the pavilion: radius grows from the culet to the girdle
  const radial = (t: number) => K.culetR + 0.015 + (K.girdleR - K.culetR + 0.012) * t
  for (let k = 0; k < K.prongs; k++) {
    const th = (TAU * (k + 0.5)) / K.prongs
    const c = Math.cos(th), s = Math.sin(th)
    const f = (u: number, v: number, o: Float64Array) => {
      const t = Math.min(Math.max(u, 0), 1.0001)
      const r0 = radial(t), y0 = K.prongBaseY + h * t
      const dr = K.girdleR - K.culetR + 0.012
      const tl = Math.hypot(dr, h)
      const e1 = [-s, 0, c]
      const T = [(dr * c) / tl, h / tl, (dr * s) / tl]
      const e2 = [T[1] * e1[2] - T[2] * e1[1], T[2] * e1[0] - T[0] * e1[2], T[0] * e1[1] - T[1] * e1[0]]
      const rad = K.prongRadius * (1 - 0.4 * t), ph = TAU * v
      o[0] = r0 * c + rad * (Math.cos(ph) * e1[0] + Math.sin(ph) * e2[0])
      o[1] = y0 + rad * (Math.cos(ph) * e1[1] + Math.sin(ph) * e2[1])
      o[2] = r0 * s + rad * (Math.cos(ph) * e1[2] + Math.sin(ph) * e2[2])
    }
    const ref = (u: number, _v: number, o: Float64Array) => { o[0] = radial(u) * c; o[1] = K.prongBaseY + h * u; o[2] = radial(u) * s }
    const thr = (p: Float64Array) => 0.5 + 0.2 * Math.min(Math.max((p[1] - K.prongBaseY) / h, 0), 1)
    b.grid(18, 10, f, ref, thr, 0.5, 1.5, false, true)
  }
}

/** Faceted round stone: table, 16 crown facets in two kinds, girdle, 16 pavilion facets to the culet. */
function stone(b: MeshBuilder) {
  const N = K.facets, d = TAU / N
  const thr = (p: number[]) => 0.7 + 0.3 * Math.min(Math.max((p[1] - K.culetY) / (K.tableY - K.culetY), 0), 1)
  const ring = (r: number, y: number, k: number, off: number) => [r * Math.cos((k + off) * d), y, r * Math.sin((k + off) * d)]
  const centre = [0, K.tableY, 0]
  const W = 1.6, S = 0.5
  for (let k = 0; k < N; k++) {
    const t0 = ring(K.tableR, K.tableY, k, 0), t1 = ring(K.tableR, K.tableY, k + 1, 0)
    const g0 = ring(K.girdleR, K.girdleY, k, 0.5), g1 = ring(K.girdleR, K.girdleY, k + 1, 0.5)
    const o = [Math.cos((k + 0.5) * d), 0.3, Math.sin((k + 0.5) * d)]
    b.flat(centre, t1, t0, thr, S, W, [0, 1, 0]) // table
    b.flat(t0, t1, g0, thr, S, W, o) // crown, kite
    b.flat(t1, g1, g0, thr, S, W, o) // crown, star
    const c0 = ring(K.culetR, K.culetY, k, 0), c1 = ring(K.culetR, K.culetY, k + 1, 0)
    const o2 = [Math.cos((k + 0.5) * d), -0.6, Math.sin((k + 0.5) * d)]
    b.flat(g0, c0, c1, thr, S, W, o2) // pavilion
    b.flat(g0, c1, g1, thr, S, W, [Math.cos((k + 1) * d), -0.6, Math.sin((k + 1) * d)])
  }
  // girdle band: thin vertical strip just under the crown rim
  for (let k = 0; k < N; k++) {
    const a0 = ring(K.girdleR, K.girdleY, k, 0.5), a1 = ring(K.girdleR, K.girdleY, k + 1, 0.5)
    const dn = (p: number[]) => [p[0], p[1] - 0.02, p[2]]
    const o = [Math.cos((k + 1) * d), 0, Math.sin((k + 1) * d)]
    b.flat(a0, a1, dn(a0), thr, S, W, o)
    b.flat(a1, dn(a1), dn(a0), thr, S, W, o)
  }
}

function buildRingMesh(): SurfaceMesh {
  const b = new MeshBuilder()
  band(b); prongs(b); stone(b)
  return b.build()
}

export const ringScene: SceneDef = { build: buildRingMesh, fit: { h: 1.75, w: 1.4 } }
