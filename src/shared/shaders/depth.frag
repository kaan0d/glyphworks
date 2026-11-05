varying float vThr;
void main() {
  // only revealed parts occlude: unrevealed surface must not hide glyphs behind it
  if (revealTime(vThr) > uTime) discard;
  gl_FragColor = vec4(0.0);
}
