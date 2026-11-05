attribute vec3 aCenter;
attribute vec3 aU;
attribute vec3 aV;
attribute vec4 aP; // theta0, angular speed, brightness, size px

uniform float uSize; // device px per size unit
uniform float uIntensity;
uniform float uSpin; // slow global precession of orbit planes
uniform float uFade; // global fade-in start time
varying float vA;

void main() {
  float th = aP.x + aP.y * uTime;
  vec3 p = aCenter + aU * cos(th) + aV * sin(th);
  float cs = cos(uSpin * uTime), sn = sin(uSpin * uTime);
  p = vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z);
  float tw = 0.65 + 0.35 * sin(uTime * (1.2 + aP.z * 3.0) + aP.x * 40.0);
  vA = aP.z * tw * uIntensity * smoothstep(0.0, 2.5, uTime - uFade);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  gl_PointSize = max(aP.w * uSize, 1.0);
}
