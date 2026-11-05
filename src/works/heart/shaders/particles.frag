varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float k = smoothstep(1.0, 0.2, d) * vA;
  gl_FragColor = vec4(vec3(0.85, 0.88, 0.95) * k, 1.0);
  gl_FragColor = linearToOutputTexel(gl_FragColor);
}
