/** Heart balloon shape. Units: classic heart coordinates (width 32), normalised by /16 at build time. */
export const GEO = {
  notchFill: 0, // 0 = classic heart notch; raise for a pinched balloon-like notch
  notchSigma: 3.5,
  outerCenterY: -2.5,
  innerScale: 0.472, // hole size relative to outer contour
  innerCenterY: -2.0, // hole sits slightly higher than the outer centre
  innerNotchRaise: 0, // optional extra raise of the hole notch
  depthRatio: 0.46, // half front-to-back thickness / local band width
  profilePow: 0.72, // <1: pillow-like with steep sealed seams
  ribs: 140, // foil pleats along the inner half
  ribAmp: 0.05,
  gridT: 1400,
  gridS: 48,
}
