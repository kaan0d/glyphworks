attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec4 aSp; // period, phase, size, reveal threshold

uniform vec2 uRes;
uniform float uSparkPx;
uniform float uSparkle;
uniform vec3 uKey;
uniform vec3 uRim;

varying vec2 vUv;
varying float vInt;
varying float vRot;
varying float vRose;
uniform float uRose;

void main() {
  vec4 off = vec4(2.0, 2.0, 2.0, 1.0);
  float period = aSp.x;
  float lifeLen = 0.5 + aSp.z * 0.9;
  float local = mod(uTime + aSp.y * period, period);
  float life = local / lifeLen;
  float up = smoothstep(0.0, 1.2, uTime - revealTime(aSp.w) - 0.5); // glints wake up after the build
  if (life > 1.0 || up <= 0.0) { gl_Position = off; return; }

  float peak = 0.12;
  float env = life < peak ? life / peak : pow(1.0 - (life - peak) / (1.0 - peak), 2.2);

  vec3 w = toWorld(aPos);
  vec3 n = normalize(toWorldN(aNormal));
  vec3 V = normalize(cameraPosition - w);
  float d = max(dot(n, normalize(uKey + V)), dot(n, normalize(uRim + V)));
  float lo = mix(0.55, 0.86, aSp.z);
  float vis = smoothstep(lo, lo + 0.1, d) * smoothstep(0.0, 0.2, dot(n, V));
  float strong = step(0.9, aSp.z);
  float inten = env * vis * up * uSparkle;
  if (inten < 0.01) { gl_Position = off; return; }
  vInt = inten * (0.55 + 0.45 * aSp.z + 0.5 * strong);
  vRot = (aSp.y - 0.5) * 0.4;
  vRose = uRose;

  vec4 clip = projectionMatrix * viewMatrix * vec4(w + normalize(cameraPosition - w) * 0.03, 1.0);
  float dist = length(cameraPosition - w);
  float h = uSparkPx * (0.3 + 1.1 * aSp.z) * (1.0 + 0.8 * strong) * (0.45 + 0.55 * env) * pow(7.2 / dist, 0.5);
  vec2 ndc = clip.xy / clip.w + position.xy * h / uRes * 2.0;
  gl_Position = vec4(ndc * clip.w, clip.z, clip.w);
  vUv = position.xy;
}
