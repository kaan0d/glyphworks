/** Diamond ring, world units. Proportions follow a solitaire seen face-on: slim band, wide stone narrowing to the band. */
export const RING = {
  bandCy: -0.185, // band centre
  bandR: 0.71, // centreline radius (outer 0.80, hole 0.62)
  bandA: 0.09, // half thickness (radial)
  bandB: 0.11, // half width (front-back)
  squareness: 0.45, // cross-section exponent: 1 = ellipse, smaller = squarer
  facets: 16, // sides of the stone
  tableR: 0.2185,
  tableY: 1.01,
  girdleR: 0.253,
  girdleY: 0.94,
  culetR: 0.0805, // pavilion ends in a small flat bottom resting on the band
  culetY: 0.63,
  prongs: 4,
  prongBaseY: 0.6,
  prongRadius: 0.018,
}
