varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform float uFoldProgress; // 0 = flat, 1 = fully folded
uniform float uFlipDirection; // -1 = left, 1 = right

void main() {
  vUv = uv;

  vec3 pos = position;

  // Bend the page along X axis based on fold progress
  float bendFactor = uFoldProgress * uFlipDirection;
  float xNorm = (pos.x + 0.5); // normalize 0..1

  // Cylindrical curl: rotate each strip around the fold axis
  float angle = bendFactor * xNorm * 3.14159;
  float radius = 0.3 + (1.0 - uFoldProgress) * 0.3;

  if (abs(bendFactor) > 0.01) {
    float sinA = sin(angle);
    float cosA = cos(angle);
    pos.x = radius * sinA;
    pos.z = radius * (1.0 - cosA);
  }

  vNormal = normalize(normalMatrix * normal);
  vPosition = pos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
