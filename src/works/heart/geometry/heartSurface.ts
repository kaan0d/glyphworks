import { GEO } from '../config/geometry'
import type { SceneDef, SurfaceMesh } from '../../../shared/surface'

const TAU = Math.PI * 2
const NORM = 1 / 16

function classic(t: number): [number, number] {
  return [
    16 * Math.sin(t) ** 3,
    13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
  ]
}

/** Outer balloon contour: heart with a shallow, pinched notch. */
function outer(t: number): [number, number] {
  const [x, y] = classic(t)
  const yy = y + GEO.notchFill * Math.exp(-((x / GEO.notchSigma) ** 2))
  return [x * NORM, (yy - GEO.outerCenterY) * NORM]
}

/** Inner hole contour: scaled classic heart, keeps the deep notch. */
function inner(t: number): [number, number] {
  const [x, y] = classic(t)
  const k = GEO.innerScale
  const yy = GEO.innerCenterY + k * (y - GEO.outerCenterY) + GEO.innerNotchRaise * Math.exp(-((x / 2) ** 2))
  return [k * x * NORM, (yy - GEO.outerCenterY) * NORM]
}

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Point on the inflated shell. s: 0 outer seam .. 1 inner seam. side: +1 front, -1 back. */
export function surfacePoint(t: number, s: number, side: number, out: Float64Array) {
  const [ox, oy] = outer(t)
  const [ix, iy] = inner(t)
  const x = ox + (ix - ox) * s
  const y = oy + (iy - oy) * s
  const w = Math.hypot(ox - ix, oy - iy)
  const ribs = 1 + GEO.ribAmp * Math.sin(GEO.ribs * t) * sstep(0.4, 0.75, s)
  out[0] = x
  out[1] = y
  out[2] = side * GEO.depthRatio * w * Math.pow(Math.sin(Math.PI * s), GEO.profilePow) * ribs
}

const A = new Float64Array(3), B = new Float64Array(3), C = new Float64Array(3), D = new Float64Array(3)

function normalAt(t: number, s: number, side: number, out: Float64Array) {
  const et = 2e-4, es = 4e-3
  const s0 = Math.min(Math.max(s, es), 1 - es)
  surfacePoint(t - et, s0, side, A); surfacePoint(t + et, s0, side, B)
  surfacePoint(t, s0 - es, side, C); surfacePoint(t, s0 + es, side, D)
  const tx = B[0] - A[0], ty = B[1] - A[1], tz = B[2] - A[2]
  const sx = D[0] - C[0], sy = D[1] - C[1], sz = D[2] - C[2]
  let nx = ty * sz - tz * sy, ny = tz * sx - tx * sz, nz = tx * sy - ty * sx
  const l = Math.hypot(nx, ny, nz) || 1
  nx /= l; ny /= l; nz /= l
  // outward: the front shell faces +z, the back shell faces -z
  if (nz * side < 0) { nx = -nx; ny = -ny; nz = -nz }
  out[0] = nx; out[1] = ny; out[2] = nz
}

/** Reveal threshold in [0,1]: tip first, sides rise, lobes, notch; outline before fill. */
function revealThreshold(t: number, s: number): number {
  const a = Math.abs(t - Math.PI) / Math.PI
  return Math.min(0.64 * a + 0.2 * Math.sin(Math.PI * s) + 0.08, 1)
}

function buildHeartMesh(): SurfaceMesh {
  const T = GEO.gridT, S = GEO.gridS
  const per = T * (S + 1)
  const nv = per * 2
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), thr = new Float32Array(nv), seam = new Float32Array(nv)
  const p = new Float64Array(3), n = new Float64Array(3)
  for (let sd = 0; sd < 2; sd++) {
    const side = sd === 0 ? 1 : -1
    for (let i = 0; i < T; i++) {
      const t = (i / T) * TAU
      for (let j = 0; j <= S; j++) {
        const s = j / S
        const v = sd * per + i * (S + 1) + j
        surfacePoint(t, s, side, p); normalAt(t, s, side, n)
        pos.set([p[0], p[1], p[2]], v * 3); nrm.set([n[0], n[1], n[2]], v * 3)
        thr[v] = revealThreshold(t, s); seam[v] = 1 - Math.sin(Math.PI * s)
      }
    }
  }
  const idx = new Uint32Array(2 * T * S * 6)
  let k = 0
  for (let sd = 0; sd < 2; sd++) for (let i = 0; i < T; i++) for (let j = 0; j < S; j++) {
    const i2 = (i + 1) % T
    const a = sd * per + i * (S + 1) + j, b = sd * per + i2 * (S + 1) + j
    idx[k++] = a; idx[k++] = b; idx[k++] = a + 1
    idx[k++] = b; idx[k++] = b + 1; idx[k++] = a + 1
  }
  return { pos, nrm, thr, seam, weight: new Float32Array(nv).fill(1), idx }
}

export const heartScene: SceneDef = { build: buildHeartMesh, fit: { h: 1.5, w: 1.15 } }
