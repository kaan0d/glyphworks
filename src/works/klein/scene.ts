import { MeshBuilder } from '../../shared/surface'
import { TAU, clamp01, normalizer, scene } from '../../shared/shapes'

/** Klein bottle: a bottle whose neck bends back and passes through its own wall to join the base. */
const g = (u: number, v: number, o: Float64Array) => {
  const U = Math.PI * u, V = TAU * v
  const cu = Math.cos(U), su = Math.sin(U), cv = Math.cos(V), sv = Math.sin(V)
  o[0] = (-2 / 15) * cu * (3 * cv - 30 * su + 90 * cu ** 4 * su - 60 * cu ** 6 * su + 5 * cu * cv * su)
  o[1] = (-1 / 15) * su * (3 * cv - 3 * cu ** 2 * cv - 48 * cu ** 4 * cv + 48 * cu ** 6 * cv - 60 * su + 5 * cu * cv * su - 5 * cu ** 3 * cv * su - 80 * cu ** 5 * cv * su + 80 * cu ** 7 * cv * su)
  o[2] = (2 / 15) * (3 + 5 * cu * su) * sv
}

export const scene_ = scene({ h: 1.75, w: 1.3 }, (b: MeshBuilder) => {
  const n = normalizer(g, 2.2)
  const tmp = new Float64Array(3)
  // the surface is non-orientable, so point normals away from the local axis of the tube instead
  const axis = (u: number, _v: number, out: Float64Array) => {
    out.fill(0)
    for (let k = 0; k < 8; k++) { n.map(u, k / 8, tmp); out[0] += tmp[0] / 8; out[1] += tmp[1] / 8; out[2] += tmp[2] / 8 }
  }
  b.surface({ nu: 240, nv: 120, wrapV: true, f: n.map, ref: axis, thr: (p) => 0.9 * clamp01((p[0] + 1.2) / 2.4) })
})
export { scene_ as scene }
