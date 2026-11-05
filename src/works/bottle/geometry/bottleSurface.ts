import { BOTTLE as K } from '../config/geometry'
import { MeshBuilder, type SceneDef, type SurfaceMesh } from '../../../shared/surface'

const TAU = Math.PI * 2
const sm = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}
const wrap = (a: number) => ((a + Math.PI * 3) % TAU) - Math.PI // -π..π, 0 at the front (+z)

/** Radius of the glass profile at height y (0 = bottom), before label, seams and flutes. Continuous piece by piece. */
function profile(y: number): number {
  const { heelH, bodyR, bodyTop, shoulderTop, neckR, neckTop, capR, capBottom, capTop } = K
  if (y <= heelH) { const q = (heelH - y) / heelH; return bodyR * Math.sqrt(Math.max(1 - q * q, 0)) }
  if (y <= bodyTop) return bodyR + 0.006 * Math.sin(((y - heelH) / (bodyTop - heelH)) * Math.PI)
  if (y <= shoulderTop) { const t = (y - bodyTop) / (shoulderTop - bodyTop); return neckR + (bodyR - neckR) * 0.5 * (1 + Math.cos(Math.PI * t)) }
  if (y <= neckTop) return neckR + 0.014 * (1 - (y - shoulderTop) / (neckTop - shoulderTop)) ** 2 // gentle flare toward the body
  if (y <= capBottom) return neckR + (capR - neckR) * sm(neckTop, capBottom, y)
  if (y <= capTop) return capR
  const q = (y - capTop) / (K.height - capTop) // rounded top of the cap
  return capR * Math.sqrt(Math.max(1 - q * q, 0))
}

/** Reveal: the glass rises from the base, then the label and collar fill in, the cap closes last. */
function revealThr(y: number, phi: number): number {
  const label = Math.abs(wrap(phi)) < K.labelHalfAngle && y > K.labelY0 && y < K.labelY1 ? 1 : 0
  const collar = y > K.collarY0 && y < K.collarY1 ? 1 : 0
  const cap = y > K.capBottom ? 1 : 0
  return Math.min(0.72 * (y / K.height) + 0.13 * label + 0.08 * collar + 0.2 * cap, 1)
}

function buildBottleMesh(): SurfaceMesh {
  const b = new MeshBuilder()
  const H = K.height, off = H / 2
  const surf = (u: number, v: number) => {
    const phi = TAU * u
    const y = Math.min(Math.max(v, 1e-4), 1 - 1e-4) * H
    let r = profile(y)
    const d = Math.abs(wrap(phi))
    const edgeA = K.labelHalfAngle
    // raised front label with soft edges
    r += K.labelRaise * sm(edgeA, edgeA - 0.08, d) * sm(K.labelY0, K.labelY0 + 0.03, y) * sm(K.labelY1, K.labelY1 - 0.03, y)
    // neck foil collar, all around
    r += 0.007 * sm(K.collarY0, K.collarY0 + 0.02, y) * sm(K.collarY1, K.collarY1 - 0.02, y)
    // mould seams at the sides, body to neck
    const ds = Math.min(Math.abs(wrap(phi - Math.PI / 2)), Math.abs(wrap(phi + Math.PI / 2)))
    r += K.seamRaise * Math.exp(-((ds / 0.035) ** 2)) * sm(K.heelH, K.heelH + 0.05, y) * sm(K.neckTop, K.neckTop - 0.05, y)
    // crimped cap edge
    if (y > K.capBottom && y < K.capTop + 0.02) r += K.fluteDepth * Math.abs(Math.cos((K.flutes * phi) / 2)) * sm(K.capBottom, K.capBottom + 0.02, y) * sm(K.capTop + 0.02, K.capTop - 0.03, y) - K.fluteDepth * 0.5
    return { phi, y, r }
  }
  const f = (u: number, v: number, o: Float64Array) => {
    const { phi, y, r } = surf(u, v)
    o[0] = r * Math.sin(phi); o[1] = y - off; o[2] = r * Math.cos(phi)
  }
  const ref = (_u: number, v: number, o: Float64Array) => { o[0] = 0; o[1] = Math.min(Math.max(v, 0), 1) * H - off; o[2] = 0 }
  const thr = (p: Float64Array) => revealThr(p[1] + off, Math.atan2(p[0], p[2]))
  b.grid(K.gridU, K.gridV, f, ref, thr, 0.15, 1, true, false)
  return b.build()
}

export const bottleScene: SceneDef = { build: buildBottleMesh, fit: { h: 1.95, w: 0.9 } }
