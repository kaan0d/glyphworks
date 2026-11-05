attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec4 aSeed; // thr, rand, phase, brightness multiplier
attribute vec2 aMisc; // seam proximity, upper half

uniform vec2 uRes;
uniform float uGlyphH;
uniform float uGlyphCount;
uniform float uRose;
uniform vec3 uKey;
uniform vec3 uRim;
uniform float uBright;
uniform vec3 uTrail[16];
uniform float uPush;
uniform float uPushR;

varying vec2 vUv;
varying vec3 vColor;
varying float vGlyph;

vec3 rosePalette(float l) {
  vec3 shadow = vec3(0.42, 0.12, 0.2);
  vec3 mid = vec3(0.92, 0.5, 0.6);
  vec3 pale = vec3(1.0, 0.8, 0.84);
  vec3 c = mix(shadow, mid, smoothstep(0.0, 0.55, l));
  c = mix(c, pale, smoothstep(0.45, 0.95, l));
  return mix(c, vec3(1.0), smoothstep(1.0, 1.4, l));
}
vec3 silverPalette(float l) {
  vec3 c = mix(vec3(0.55, 0.58, 0.66), vec3(0.86, 0.89, 0.95), smoothstep(0.0, 0.8, l));
  return mix(c, vec3(1.0), smoothstep(0.9, 1.4, l));
}

void main() {
  vec4 off = vec4(2.0, 2.0, 2.0, 1.0);
  float age = (uTime - revealTime(aSeed.x)) / 0.6;
  if (age <= 0.0) { gl_Position = off; return; }

  float e = clamp(age, 0.0, 1.0);
  float ease = 1.0 - pow(1.0 - e, 3.0);
  vec3 p = aPos + aNormal * (1.0 - ease) * 0.06; // subtle gathering onto the surface
  vec3 w = toWorld(p);
  vec3 n = normalize(toWorldN(aNormal));

  // mouse warp: the pointer leaves a fading trail; glyphs inside it wobble like a distorted lens, no radial push
  float f = 0.0;
  for (int i = 0; i < 16; i++) {
    f = max(f, smoothstep(uPushR, 0.0, length(w.xy - uTrail[i].xy)) * uTrail[i].z);
  }
  f *= uPush;
  vec2 wob = vec2(sin(w.y * 22.0 + uTime * 3.0 + aSeed.z * 6.283), cos(w.x * 22.0 + uTime * 2.6 + aSeed.y * 6.283));
  w.xy += wob * f * 0.05;
  w.z += (aSeed.y - 0.5) * f * 0.08;
  vec3 V = normalize(cameraPosition - w);

  // key + moving rim light, wrapped diffuse for a soft balloon falloff
  float dk = max((dot(n, uKey) + 0.2) / 1.2, 0.0);
  float dr = max((dot(n, uRim) + 0.2) / 1.2, 0.0);
  float sk = pow(max(dot(n, normalize(uKey + V)), 0.0), 80.0);
  float sr = pow(max(dot(n, normalize(uRim + V)), 0.0), 50.0);
  vec3 R = reflect(-V, n);
  float env = smoothstep(-0.6, 1.0, R.y) * 0.22 + pow(max(dot(R, uKey), 0.0), 10.0) * 0.35;
  float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.4;
  float lum = 0.08 + 0.5 * dk + 0.42 * dr + env + fres + 1.5 * (sk + 0.8 * sr);
  lum *= aSeed.w * (1.0 + 0.2 * aMisc.x);

  float jit = (aSeed.y - 0.5) * 0.1;
  vGlyph = floor(clamp((lum + jit) * 0.78, 0.0, 0.999) * uGlyphCount);

  float flash = 1.0 + 2.0 * (1.0 - e) * (1.0 - e);
  float inten = clamp(lum, 0.0, 1.5);
  float a = 0.4 * (0.15 + 0.85 * smoothstep(0.1, 1.0, inten)) * flash * ease;
  vColor = mix(silverPalette(inten), rosePalette(inten), uRose) * a * uBright;

  vec3 toCam = normalize(cameraPosition - w);
  vec4 clip = projectionMatrix * viewMatrix * vec4(w + toCam * 0.02, 1.0);
  // snap glyph centre to the pixel grid: crisp, no sub-pixel shimmer
  vec2 px = (clip.xy / clip.w * 0.5 + 0.5) * uRes;
  px = floor(px) + 0.5;
  vec2 ndc = (px / uRes - 0.5) * 2.0;
  float dist = length(cameraPosition - w);
  float h = uGlyphH * pow(7.2 / dist, 0.5);
  vec2 size = vec2(h * 0.6, h);
  ndc += position.xy * size / uRes;
  gl_Position = vec4(ndc * clip.w, clip.z, clip.w);
  vUv = position.xy * 0.5 + 0.5;
}
