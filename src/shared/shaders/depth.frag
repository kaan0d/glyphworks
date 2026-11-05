varying float vThr;
varying float vGhost;
void main() {
  // only revealed parts occlude: unrevealed surface must not hide glyphs behind it; ghost glass never occludes
  if (vGhost > 0.5 || revealTime(vThr) > uTime) discard;
  gl_FragColor = vec4(0.0);
}
