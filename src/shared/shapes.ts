import { MeshBuilder, type SceneDef, type SurfaceMesh } from './surface'

/** Shared building blocks for works: lathe, tube, sheets and boxes on top of MeshBuilder. Phi = 0 faces the viewer (+z). */

export const TAU = Math.PI * 2
export type V3 = [number, number, number]
export type Thr = (p: Float64Array) => number

export const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)
export const sm = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }
export const sgnPow = (x: number, p: number) => Math.sign(x) * Math.abs(x) ** p

/** Reveal threshold rising with height: 0 at y0, `span` at y1. */
export const rise = (y0: number, y1: number, span = 0.9): Thr => (p) => span * clamp01((p[1] - y0) / (y1 - y0))

/** Smooth radius(y) through control points [y, r] (Catmull-Rom slopes, y strictly increasing). Repeat a y a hair apart for a crease. */
export function spline(pts: [number, number][]) {
  const n = pts.length
  const slope = (i: number) => (i === 0 || i === n - 1 ? 0 : (pts[i + 1][1] - pts[i - 1][1]) / (pts[i + 1][0] - pts[i - 1][0]))
  return (y: number) => {
    if (y <= pts[0][0]) return pts[0][1]
    if (y >= pts[n - 1][0]) return pts[n - 1][1]
    let i = 0
    while (pts[i + 1][0] < y) i++
    const [y0, r0] = pts[i], [y1, r1] = pts[i + 1], h = y1 - y0, t = (y - y0) / h
    const t2 = t * t, t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * r0 + (t3 - 2 * t2 + t) * h * slope(i) + (-2 * t3 + 3 * t2) * r1 + (t3 - t2) * h * slope(i + 1)
  }
}

/** Profile curve for revolve(): v in [0,1] -> [radius, height]. */
export type Curve = (v: number) => [number, number]

const inner = (v: number) => Math.min(Math.max(v, 1e-4), 1 - 1e-4)

/** Radius R(y) from y0 to y1; R should reach 0 at both ends for a closed shape. */
export const fromR = (y0: number, y1: number, R: (y: number) => number): Curve => (v) => {
  const y = y0 + (y1 - y0) * inner(v)
  return [R(y), y]
}

/** Closed solid: flat disc at the bottom, R(y) up the side, flat disc on top. */
export const capped = (y0: number, y1: number, R: (y: number) => number, cap = 0.06): Curve => (v) => {
  if (v < cap) return [R(y0) * inner(v / cap), y0]
  if (v > 1 - cap) return [R(y1) * inner((1 - v) / cap), y1]
  const y = y0 + (y1 - y0) * ((v - cap) / (1 - 2 * cap))
  return [R(y), y]
}

/** Hollow vessel: outer wall, over the rim, down the inner wall to a floor. R(y) is the outer radius. */
export const vessel = (y0: number, y1: number, R: (y: number) => number, wall: number, depth: number): Curve => {
  const yb = y1 - depth
  return (v) => {
    if (v < 0.62) { const y = y0 + (y1 - y0) * inner(v / 0.62); return [R(y), y] }
    if (v < 0.66) { const q = (v - 0.62) / 0.04; return [R(y1) - wall * q, y1 + 0.006 * Math.sin(Math.PI * q)] }
    if (v < 0.96) { const y = y1 - depth * ((v - 0.66) / 0.3); return [R(y) - wall, y] }
    return [(R(yb) - wall) * (1 - inner((v - 0.96) / 0.04)), yb]
  }
}

/** Sphere profile of radius R centred on the origin. */
export const sphereCurve = (R: number): Curve => (v) => { const a = Math.PI * inner(v); return [R * Math.sin(a), -R * Math.cos(a)] }

/** Closed loop profile (v wraps), for rings and tori. */
export const loopCurve = (cr: number, cy: number, a: number, b: number): Curve => (v) => [cr + a * Math.cos(TAU * v), cy + b * Math.sin(TAU * v)]

interface RevolveOpts {
  nu?: number; nv?: number; thr: Thr; seam?: number; w?: number; at?: V3; wrapV?: boolean
  /** radius change by angle and height, for flutes, threads, labels */
  post?: (r: number, y: number, phi: number) => number
}

/** Surface of revolution around the vertical axis. */
export function revolve(b: MeshBuilder, curve: Curve, o: RevolveOpts) {
  const at = o.at ?? [0, 0, 0]
  b.surface({
    nu: o.nu ?? 220, nv: o.nv ?? 240, wrapU: true, wrapV: o.wrapV, thr: o.thr, seam: o.seam, w: o.w,
    f: (u, v, out) => {
      const phi = TAU * u
      const [r0, y] = curve(v)
      const r = o.post ? o.post(r0, y, phi) : r0
      out[0] = at[0] + r * Math.sin(phi); out[1] = at[1] + y; out[2] = at[2] + r * Math.cos(phi)
    },
  })
}

/** Ball of radius r at a point. */
export const ball = (b: MeshBuilder, at: V3, r: number, thr: Thr, w = 1) => revolve(b, sphereCurve(r), { at, thr, nu: 48, nv: 40, w })

interface TubeOpts {
  path: (t: number) => V3
  /** radius by position along the path and angle around it (angle lets a section be an ellipse that twists) */
  radius?: (t: number, ph: number) => number
  /** alternative to radius: offset (along the curvature normal, along the binormal) of the section point at angle ph */
  section?: (t: number, ph: number) => [number, number]
  nt: number; nr?: number; closed?: boolean; thr: Thr; seam?: number; w?: number
  /** round the ends over this fraction of the path (open tubes) */
  cap?: number
}

/** Tube along a path; open tubes end in rounded caps. The cross-section frame follows the path's curvature. */
export function tube(b: MeshBuilder, o: TubeOpts) {
  const e = 1e-3, cap = o.cap ?? 0.025
  b.surface({
    nu: o.nt, nv: o.nr ?? 14, wrapU: !!o.closed, wrapV: true, thr: o.thr, seam: o.seam, w: o.w,
    f: (u, v, out) => {
      const t = o.closed ? u : inner(u)
      const lo = o.closed ? t - e : Math.max(t - e, 0), hi = o.closed ? t + e : Math.min(t + e, 1) // paths need not extend past [0,1]
      const p0 = o.path(lo), p1 = o.path(t), p2 = o.path(hi)
      const T: V3 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]]
      const tl = Math.hypot(...T) || 1
      T[0] /= tl; T[1] /= tl; T[2] /= tl
      let N: V3 = [p2[0] - 2 * p1[0] + p0[0], p2[1] - 2 * p1[1] + p0[1], p2[2] - 2 * p1[2] + p0[2]]
      const dot = N[0] * T[0] + N[1] * T[1] + N[2] * T[2]
      N = [N[0] - dot * T[0], N[1] - dot * T[1], N[2] - dot * T[2]]
      let nl = Math.hypot(...N)
      if (nl < 1e-7) { // straight stretch: any axis not parallel to the path
        const ax: V3 = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
        const d2 = ax[0] * T[0] + ax[1] * T[1] + ax[2] * T[2]
        N = [ax[0] - d2 * T[0], ax[1] - d2 * T[1], ax[2] - d2 * T[2]]
        nl = Math.hypot(...N)
      }
      N = [N[0] / nl, N[1] / nl, N[2] / nl]
      const B: V3 = [T[1] * N[2] - T[2] * N[1], T[2] * N[0] - T[0] * N[2], T[0] * N[1] - T[1] * N[0]]
      const ph = TAU * v
      let [c, s] = o.section ? o.section(t, ph) : [Math.cos(ph) * o.radius!(t, ph), Math.sin(ph) * o.radius!(t, ph)]
      if (!o.closed) { const k = Math.min(t / cap, (1 - t) / cap, 1), f = Math.sqrt(1 - (1 - k) * (1 - k)); c *= f; s *= f }
      out[0] = p1[0] + c * N[0] + s * B[0]; out[1] = p1[1] + c * N[1] + s * B[1]; out[2] = p1[2] + c * N[2] + s * B[2]
    },
  })
}

/** Straight tube between two points. */
export const rod = (b: MeshBuilder, a: V3, c: V3, r: number | ((t: number) => number), thr: Thr, o: { nt?: number; nr?: number; cap?: number; w?: number } = {}) =>
  tube(b, {
    path: (t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t],
    radius: typeof r === 'number' ? () => r : (t) => r(t), nt: o.nt ?? 8, nr: o.nr ?? 10, cap: o.cap ?? 0.12, thr, w: o.w,
  })

/** Paper-thin sheet from triangles: both sides, slightly apart, flat shaded. */
export function sheet(b: MeshBuilder, tris: [V3, V3, V3][], thr: (p: number[]) => number, seam = 0.35, w = 1.2, gap = 0.006) {
  for (const [p, q, r] of tris) {
    const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2], vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2]
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    const l = Math.hypot(nx, ny, nz) || 1
    nx /= l; ny /= l; nz /= l
    for (const s of [1, -1]) {
      const sh = (a: V3): number[] => [a[0] + s * gap * nx, a[1] + s * gap * ny, a[2] + s * gap * nz]
      b.flat(sh(p), sh(q), sh(r), thr, seam, w, [s * nx, s * ny, s * nz])
    }
  }
}

/** Rounded box (superellipsoid), half sizes h, edge sharpness e (small = sharper). */
export function rbox(b: MeshBuilder, c: V3, h: V3, thr: Thr, e = 0.2, w = 1) {
  b.surface({
    nu: 56, nv: 40, wrapU: true, thr, w,
    f: (u, v, out) => {
      const lon = TAU * u, lat = Math.PI * (inner(v) - 0.5)
      const cl = sgnPow(Math.cos(lat), e)
      out[0] = c[0] + h[0] * cl * sgnPow(Math.sin(lon), e)
      out[1] = c[1] + h[1] * sgnPow(Math.sin(lat), e)
      out[2] = c[2] + h[2] * cl * sgnPow(Math.cos(lon), e)
    },
  })
}

/** Rotate a finished mesh around the z axis. */
export function tiltZ(m: SurfaceMesh, ang: number): SurfaceMesh {
  const c = Math.cos(ang), s = Math.sin(ang)
  for (const a of [m.pos, m.nrm]) for (let i = 0; i < a.length; i += 3) { const x = a[i], y = a[i + 1]; a[i] = c * x - s * y; a[i + 1] = s * x + c * y }
  return m
}

/** SceneDef from a builder function; `after` can post-process the finished mesh. */
export const scene = (fit: { h: number; w: number }, make: (b: MeshBuilder) => void, after?: (m: SurfaceMesh) => SurfaceMesh): SceneDef => ({
  fit,
  build: () => { const b = new MeshBuilder(); make(b); const m = b.build(); return after ? after(m) : m },
})

type G = (u: number, v: number, out: Float64Array) => void

/** Scale and offset that centre a parametric surface and fit its tallest side to `size`. */
export function normalizer(g: G, size: number, n = 70) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], p = new Float64Array(3)
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    g(i / n, j / n, p)
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]) }
  }
  const c = lo.map((l, k) => (l + hi[k]) / 2)
  const s = size / Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2])
  return { s, c, map: (u: number, v: number, out: Float64Array) => { g(u, v, out); for (let k = 0; k < 3; k++) out[k] = (out[k] - c[k]) * s } }
}
