/** Diamond ring, world units. Proportions follow a solitaire seen face-on: thick band, wide stone narrowing to the band. */
export const RING = {
  bandCy: -0.32, // band centre
  bandR: 0.69, // centreline radius (outer 0.80, hole 0.58)
  bandA: 0.11, // half thickness (radial)
  bandB: 0.15, // half width (front-back)
  squareness: 0.45, // cross-section exponent: 1 = ellipse, smaller = squarer
  facets: 16, // sides of the stone
  tableR: 0.3,
  tableY: 1.1,
  girdleR: 0.37,
  girdleY: 1.02,
  culetR: 0.1, // pavilion ends in a small flat bottom resting on the band
  culetY: 0.5,
  prongs: 4,
  prongBaseY: 0.46,
  prongRadius: 0.024,
}
