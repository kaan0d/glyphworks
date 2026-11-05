attribute float aThr;
varying float vThr;
void main() {
  vThr = aThr;
  vec3 w = toWorld(position);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
