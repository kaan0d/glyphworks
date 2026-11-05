import { capped, revolve, rise, scene, spline, ball } from '../../shared/shapes'

/** Chess queen: stepped base, waisted body, collar and a crown of points with a ball on top. y from -1.15 to 1.15. */
const R = spline([
  [-1.1, 0.5], [-1.0, 0.56], [-0.92, 0.5], [-0.86, 0.4], [-0.8, 0.44], [-0.74, 0.34], [-0.4, 0.22], [0.1, 0.14], [0.45, 0.2],
  [0.72, 0.36], [0.76, 0.4], [0.82, 0.34], [0.86, 0.46], [1.0, 0.5], [1.04, 0.3],
])

export const scene_ = scene({ h: 2.0, w: 1.05 }, (b) => {
  const thr = rise(-1.1, 1.1)
  revolve(b, capped(-1.1, 1.04, R, 0.03), {
    thr, nu: 260, nv: 360, w: 1.1,
    // points around the crown rim, deepest between them
    post: (r, y, phi) => (y > 0.86 ? r * (1 + 0.14 * Math.abs(Math.cos(4 * phi)) ** 3 * sm(0.86, 0.98)(y)) : r),
  })
  ball(b, [0, 1.12, 0], 0.1, thr)
})
export { scene_ as scene }

function sm(a: number, c: number) { return (x: number) => { const t = Math.min(Math.max((x - a) / (c - a), 0), 1); return t * t * (3 - 2 * t) } }
