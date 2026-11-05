attribute float aThr;
attribute float aGhost;
varying float vThr;
varying float vGhost;
void main() {
  vThr = aThr;
  vGhost = aGhost;
  vec3 w = toWorld(position);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
