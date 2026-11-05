// shared prefix: rigid object rotation (rot_y)
uniform mat3 uRot;
uniform float uTime;
uniform float uT0;
uniform float uT1;

vec3 toWorld(vec3 p) {
  return uRot * p;
}
vec3 toWorldN(vec3 n) {
  return uRot * n;
}
// reveal time of a point with threshold thr in [0,1]
float revealTime(float thr) { return uT0 + thr * (uT1 - uT0) * 0.9; }
