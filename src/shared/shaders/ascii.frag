uniform sampler2D uAtlas;
uniform float uGlyphCount;
varying vec2 vUv;
varying vec3 vColor;
varying float vGlyph;

void main() {
  vec2 uv = vec2((vGlyph + vUv.x) / uGlyphCount, vUv.y);
  float a = texture2D(uAtlas, uv).r;
  a = clamp((a - 0.12) * 1.7, 0.0, 1.0);
  gl_FragColor = vec4(vColor * a, 1.0);
  gl_FragColor = linearToOutputTexel(gl_FragColor);
}
