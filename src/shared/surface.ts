import { rng } from './random'

/** Triangle mesh of a work's surface. Per-vertex data drives lighting, reveal order and sampling density. */
export interface SurfaceMesh {
  pos: Float32Array
  nrm: Float32Array
  thr: Float32Array // reveal threshold 0..1: when this part of the surface appears
  seam: Float32Array // 0..1: edge/highlight emphasis, also steers sparkle placement
  weight: Float32Array // relative glyph density
  idx: Uint32Array
  ghost?: Float32Array // 1 = does not occlude the glyphs behind it (glass you can see through)
}

/** What a work provides to the renderer. */
export interface SceneDef {
  build(): SurfaceMesh
  /** camera fit: half extents in world units * margin (height, width) */
  fit: { h: number; w: number }
}

export interface Samples { count: number; pos: Float32Array; nrm: Float32Array; seed: Float32Array; misc: Float32Array }

/** Area-and-weight proportional random points on the mesh. Random order, so any prefix is uniform too. */
export function sampleMesh(m: SurfaceMesh, count: number, seed = 1337): Samples {
  const tris = m.idx.length / 3
  const cum = new Float64Array(tris)
  let acc = 0
  for (let f = 0; f < tris; f++) {
    const a = m.idx[f * 3], b = m.idx[f * 3 + 1], c = m.idx[f * 3 + 2]
    const ux = m.pos[b * 3] - m.pos[a * 3], uy = m.pos[b * 3 + 1] - m.pos[a * 3 + 1], uz = m.pos[b * 3 + 2] - m.pos[a * 3 + 2]
    const wx = m.pos[c * 3] - m.pos[a * 3], wy = m.pos[c * 3 + 1] - m.pos[a * 3 + 1], wz = m.pos[c * 3 + 2] - m.pos[a * 3 + 2]
    const area = 0.5 * Math.hypot(uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx)
    acc += area * ((m.weight[a] + m.weight[b] + m.weight[c]) / 3)
    cum[f] = acc
  }
  const r = rng(seed)
  const pos = new Float32Array(count * 3), nrm = new Float32Array(count * 3)
  const sd = new Float32Array(count * 4), misc = new Float32Array(count * 2)
  for (let q = 0; q < count; q++) {
    const target = r() * acc
    let lo = 0, hi = tris - 1
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < target) lo = mid + 1; else hi = mid }
    const a = m.idx[lo * 3], b = m.idx[lo * 3 + 1], c = m.idx[lo * 3 + 2]
    let u = r(), v = r()
    if (u + v > 1) { u = 1 - u; v = 1 - v }
    const w = 1 - u - v
    let nx = 0, ny = 0, nz = 0
    for (let k = 0; k < 3; k++) {
      pos[q * 3 + k] = w * m.pos[a * 3 + k] + u * m.pos[b * 3 + k] + v * m.pos[c * 3 + k]
    }
    nx = w * m.nrm[a * 3] + u * m.nrm[b * 3] + v * m.nrm[c * 3]
    ny = w * m.nrm[a * 3 + 1] + u * m.nrm[b * 3 + 1] + v * m.nrm[c * 3 + 1]
    nz = w * m.nrm[a * 3 + 2] + u * m.nrm[b * 3 + 2] + v * m.nrm[c * 3 + 2]
    const l = Math.hypot(nx, ny, nz) || 1
    nrm[q * 3] = nx / l; nrm[q * 3 + 1] = ny / l; nrm[q * 3 + 2] = nz / l
    const rnd = r()
    const thr = w * m.thr[a] + u * m.thr[b] + v * m.thr[c] + 0.16 * (rnd - 0.5)
    sd[q * 4] = Math.min(Math.max(thr, 0), 1)
    sd[q * 4 + 1] = rnd
    sd[q * 4 + 2] = r()
    sd[q * 4 + 3] = 0.85 + 0.3 * r()
    misc[q * 2] = w * m.seam[a] + u * m.seam[b] + v * m.seam[c]
    misc[q * 2 + 1] = pos[q * 3 + 1] > 0 ? 1 : 0
  }
  return { count, pos, nrm, seed: sd, misc }
}

type Fn = (u: number, v: number, out: Float64Array) => void

/** Small helper to assemble a mesh from parametric grids and flat triangles. */
export class MeshBuilder {
  private pos: number[] = []
  private nrm: number[] = []
  private thr: number[] = []
  private seam: number[] = []
  private weight: number[] = []
  private idx: number[] = []
  private ghosts: number[] = []
  /** Set while adding parts that must not hide what is behind them. */
  ghost = false

  vert(p: ArrayLike<number>, n: ArrayLike<number>, thr: number, seam: number, w: number) {
    this.pos.push(p[0], p[1], p[2]); this.nrm.push(n[0], n[1], n[2])
    this.thr.push(thr); this.seam.push(seam); this.weight.push(w); this.ghosts.push(this.ghost ? 1 : 0)
    return this.pos.length / 3 - 1
  }

  /** One flat-shaded triangle (own vertices, face normal): crisp facets. */
  flat(a: number[], b: number[], c: number[], thr: (p: number[]) => number, seam: number, w: number, outward?: number[]) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    const l = Math.hypot(nx, ny, nz) || 1
    nx /= l; ny /= l; nz /= l
    if (outward && nx * outward[0] + ny * outward[1] + nz * outward[2] < 0) { nx = -nx; ny = -ny; nz = -nz }
    const i = [a, b, c].map((p) => this.vert(p, [nx, ny, nz], thr(p), seam, w))
    this.idx.push(i[0], i[1], i[2])
  }

  /**
   * Smooth parametric grid f(u,v), u and v in [0,1). Normals by finite differences, flipped to point away from `ref`
   * (a centre point per sample). wrap* closes the grid.
   */
  grid(nu: number, nv: number, f: Fn, ref: Fn, thr: (p: Float64Array) => number, seam: number, w: number, wrapU: boolean, wrapV: boolean) {
    const NU = wrapU ? nu : nu + 1, NV = wrapV ? nv : nv + 1
    const base = this.pos.length / 3
    const p = new Float64Array(3), a = new Float64Array(3), b = new Float64Array(3), c = new Float64Array(3), d = new Float64Array(3), rf = new Float64Array(3)
    const e = 1e-3
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const u = i / nu, v = j / nv
      f(u, v, p)
      f(u - e, v, a); f(u + e, v, b); f(u, v - e, c); f(u, v + e, d)
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2]
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
      const l = Math.hypot(nx, ny, nz) || 1
      nx /= l; ny /= l; nz /= l
      ref(u, v, rf)
      if (nx * (p[0] - rf[0]) + ny * (p[1] - rf[1]) + nz * (p[2] - rf[2]) < 0) { nx = -nx; ny = -ny; nz = -nz }
      this.vert(p, [nx, ny, nz], thr(p), seam, w)
    }
    const at = (i: number, j: number) => base + (i % NU) * NV + (j % NV)
    for (let i = 0; i < (wrapU ? NU : NU - 1); i++) for (let j = 0; j < (wrapV ? NV : NV - 1); j++) {
      this.idx.push(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1))
    }
  }

  /**
   * Like grid(), with options. Without `ref` the normals take one global sign from the enclosed volume
   * (right for any closed, orientable surface); with `ref` they point away from that per-sample centre.
   * `flip` reverses the result for open or one-sided surfaces.
   */
  surface(o: {
    nu: number; nv: number; f: Fn; thr: (p: Float64Array) => number; seam?: number; w?: number | ((u: number, v: number) => number)
    wrapU?: boolean; wrapV?: boolean; ref?: Fn; flip?: boolean
  }) {
    const { nu, nv, f, thr, ref } = o
    const wrapU = !!o.wrapU, wrapV = !!o.wrapV
    const NU = wrapU ? nu : nu + 1, NV = wrapV ? nv : nv + 1
    const base = this.pos.length / 3
    const first = this.idx.length
    const p = new Float64Array(3), a = new Float64Array(3), b = new Float64Array(3), c = new Float64Array(3), d = new Float64Array(3), rf = new Float64Array(3)
    const e = 1e-3
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const u = i / nu, v = j / nv
      f(u, v, p)
      f(u - e, v, a); f(u + e, v, b); f(u, v - e, c); f(u, v + e, d)
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2]
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
      const l = Math.hypot(nx, ny, nz) || 1
      nx /= l; ny /= l; nz /= l
      if (ref) {
        ref(u, v, rf)
        if (nx * (p[0] - rf[0]) + ny * (p[1] - rf[1]) + nz * (p[2] - rf[2]) < 0) { nx = -nx; ny = -ny; nz = -nz }
      }
      this.vert(p, [nx, ny, nz], thr(p), o.seam ?? 0, typeof o.w === 'function' ? o.w(u, v) : (o.w ?? 1))
    }
    const at = (i: number, j: number) => base + (i % NU) * NV + (j % NV)
    for (let i = 0; i < (wrapU ? NU : NU - 1); i++) for (let j = 0; j < (wrapV ? NV : NV - 1); j++) {
      this.idx.push(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1))
    }
    let flip = !!o.flip
    if (!ref) {
      // the winding follows the normals, so a negative volume means they point inwards
      let vol = 0
      const P = this.pos
      for (let t = first; t < this.idx.length; t += 3) {
        const i0 = this.idx[t] * 3, i1 = this.idx[t + 1] * 3, i2 = this.idx[t + 2] * 3
        vol += P[i0] * (P[i1 + 1] * P[i2 + 2] - P[i1 + 2] * P[i2 + 1]) - P[i0 + 1] * (P[i1] * P[i2 + 2] - P[i1 + 2] * P[i2]) + P[i0 + 2] * (P[i1] * P[i2 + 1] - P[i1 + 1] * P[i2])
      }
      if (vol < 0) flip = !flip
    }
    if (flip) for (let k = base * 3; k < this.nrm.length; k++) this.nrm[k] = -this.nrm[k]
  }

  /** Append a finished mesh. */
  merge(m: SurfaceMesh) {
    const off = this.pos.length / 3
    for (let i = 0; i < m.pos.length; i++) { this.pos.push(m.pos[i]); this.nrm.push(m.nrm[i]) }
    for (let i = 0; i < m.thr.length; i++) { this.thr.push(m.thr[i]); this.seam.push(m.seam[i]); this.weight.push(m.weight[i]); this.ghosts.push(m.ghost?.[i] ?? 0) }
    for (let i = 0; i < m.idx.length; i++) this.idx.push(m.idx[i] + off)
  }

  build(): SurfaceMesh {
    return {
      pos: Float32Array.from(this.pos), nrm: Float32Array.from(this.nrm), thr: Float32Array.from(this.thr),
      seam: Float32Array.from(this.seam), weight: Float32Array.from(this.weight), idx: Uint32Array.from(this.idx), ghost: Float32Array.from(this.ghosts),
    }
  }
}
