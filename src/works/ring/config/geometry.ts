/** Diamond ring, world units. Proportions follow a solitaire seen face-on: thick band, wide stone narrowing to the band. */
export const RING = {
  bandCy: -0.185, // band centre
  bandR: 0.668, // centreline radius (outer 0.80, hole 0.54)
  bandA: 0.132, // half thickness (radial)
  bandB: 0.15, // half width (front-back)
  squareness: 0.45, // cross-section exponent: 1 = ellipse, smaller = squarer
  facets: 16, // sides of the stone
  tableR: 0.19,
  tableY: 0.96,
  girdleR: 0.22,
  girdleY: 0.9,
  culetR: 0.07, // pavilion ends in a small flat bottom resting on the band
  culetY: 0.63,
  prongs: 4,
  prongBaseY: 0.6,
  prongRadius: 0.016,
}
