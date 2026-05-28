varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D uTexture;
uniform float uFoldProgress;
uniform float uShadowIntensity;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);

  // Ambient + directional light
  vec3 lightDir = normalize(vec3(1.0, 2.0, 1.0));
  float diff = max(dot(vNormal, lightDir), 0.0);
  float ambient = 0.6;
  float lighting = ambient + diff * 0.4;

  // Self-shadow on the fold
  float foldShadow = 1.0 - uFoldProgress * uShadowIntensity * (1.0 - vUv.x);

  vec3 color = texColor.rgb * lighting * foldShadow;

  // Page edge brightening
  float edgeBright = smoothstep(0.0, 0.02, vUv.x) * smoothstep(0.0, 0.02, 1.0 - vUv.x);
  color = mix(vec3(1.0), color, 0.95 + 0.05 * edgeBright);

  gl_FragColor = vec4(color, texColor.a);
}
