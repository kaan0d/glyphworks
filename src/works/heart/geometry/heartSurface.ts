import { GEO } from '../config/geometry'
import { rng } from '../../../shared/random'

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

/** Reveal threshold in [0,1]: tip first, sides rise, lobes, notch; outline before fill; small random jitter. */
export function revealThreshold(t: number, s: number, rnd: number): number {
  const a = Math.abs(t - Math.PI) / Math.PI
  return Math.min(0.64 * a + 0.2 * Math.sin(Math.PI * s) + 0.16 * rnd, 1)
}

export interface HeartData {
  mesh: { pos: Float32Array; nrm: Float32Array; thr: Float32Array; idx: Uint32Array }
  samples: { count: number; pos: Float32Array; nrm: Float32Array; seed: Float32Array; misc: Float32Array }
}

export function buildHeart(count: number, seed = 1337): HeartData {
  const T = GEO.gridT, S = GEO.gridS
  const per = T * (S + 1)
  const nv = per * 2
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), thr = new Float32Array(nv)
  const vt = new Float32Array(nv), vs = new Float32Array(nv)
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
        thr[v] = revealThreshold(t, s, 0.5); vt[v] = t; vs[v] = s
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
  // area-weighted triangle sampling => uniform surface density; random order => any prefix is uniform too
  const tris = idx.length / 3
  const cum = new Float64Array(tris)
  let acc = 0
  for (let f = 0; f < tris; f++) {
    const a = idx[f * 3] * 3, b = idx[f * 3 + 1] * 3, c = idx[f * 3 + 2] * 3
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2]
    const wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2]
    acc += 0.5 * Math.hypot(uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx)
    cum[f] = acc
  }
  const r = rng(seed)
  const sp = new Float32Array(count * 3), sn = new Float32Array(count * 3)
  const sseed = new Float32Array(count * 4), misc = new Float32Array(count * 2)
  for (let q = 0; q < count; q++) {
    const target = r() * acc
    let lo = 0, hi = tris - 1
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < target) lo = m + 1; else hi = m }
    const ia = idx[lo * 3], ib = idx[lo * 3 + 1], ic = idx[lo * 3 + 2]
    let u = r(), v = r()
    if (u + v > 1) { u = 1 - u; v = 1 - v }
    const w = 1 - u - v
    for (let c = 0; c < 3; c++) sp[q * 3 + c] = w * pos[ia * 3 + c] + u * pos[ib * 3 + c] + v * pos[ic * 3 + c]
    const nx = w * nrm[ia * 3] + u * nrm[ib * 3] + v * nrm[ic * 3]
    const ny = w * nrm[ia * 3 + 1] + u * nrm[ib * 3 + 1] + v * nrm[ic * 3 + 1]
    const nz = w * nrm[ia * 3 + 2] + u * nrm[ib * 3 + 2] + v * nrm[ic * 3 + 2]
    const l = Math.hypot(nx, ny, nz) || 1
    sn[q * 3] = nx / l; sn[q * 3 + 1] = ny / l; sn[q * 3 + 2] = nz / l
    // dominant vertex gives t (avoids averaging across the 0/2π wrap)
    const dom = w >= u && w >= v ? ia : u >= v ? ib : ic
    const s = w * vs[ia] + u * vs[ib] + v * vs[ic]
    const rnd = r()
    sseed[q * 4] = revealThreshold(vt[dom], s, rnd)
    sseed[q * 4 + 1] = rnd
    sseed[q * 4 + 2] = r()
    sseed[q * 4 + 3] = 0.85 + 0.3 * r()
    misc[q * 2] = 1 - Math.sin(Math.PI * s)
    misc[q * 2 + 1] = sp[q * 3 + 1] > 0 ? 1 : 0
  }
  return { mesh: { pos, nrm, thr, idx }, samples: { count, pos: sp, nrm: sn, seed: sseed, misc } }
}
