varying vec2 vUv;
varying float vInt;
varying float vRot;
varying float vRose;

void main() {
  float c = cos(vRot), s = sin(vRot);
  vec2 p = vec2(c * vUv.x - s * vUv.y, s * vUv.x + c * vUv.y);
  float ax = abs(p.x), ay = abs(p.y);
  float r2 = dot(p, p);
  float core = exp(-r2 * 700.0);
  float vert = exp(-ax * 90.0) * exp(-ay * 3.2);
  float hor = exp(-ay * 90.0) * exp(-ax * 5.5) * 0.65;
  vec2 q = vec2(p.x + p.y, p.x - p.y) * 0.7071;
  float diag = (exp(-abs(q.x) * 120.0) * exp(-abs(q.y) * 9.0) + exp(-abs(q.y) * 120.0) * exp(-abs(q.x) * 9.0)) * 0.18;
  float halo = exp(-r2 * 28.0) * 0.22;
  float edge = smoothstep(1.0, 0.8, max(ax, ay));
  float k = (core * 1.6 + vert + hor + diag + halo) * edge * vInt;
  vec3 col = mix(vec3(0.92, 0.95, 1.0), vec3(1.0, 0.86, 0.9), vRose);
  gl_FragColor = vec4(col * k, 1.0);
  gl_FragColor = linearToOutputTexel(gl_FragColor);
}
