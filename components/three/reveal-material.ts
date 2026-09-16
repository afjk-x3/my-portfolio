import { Vector3, type Material } from "three";

/** Number of blobs in the cursor trail. Must match the GLSL array size. */
export const REVEAL_BLOBS = 10;

/**
 * Shared uniform for every revealed material. Each entry is
 * `(x, y, radius)` in drawing-buffer pixels, with y measured from the bottom
 * like `gl_FragCoord`. Mutating the vectors in place updates every material.
 */
export function createRevealUniform() {
  return {
    value: Array.from({ length: REVEAL_BLOBS }, () => new Vector3(0, 0, 0)),
  };
}

export type RevealUniform = ReturnType<typeof createRevealUniform>;

/**
 * Patches a built-in three.js material so it only draws inside a metaball
 * field around the cursor trail. Summing r²/d² per blob and discarding below 1
 * merges nearby blobs into one gooey shape with a crisp edge, and needs no
 * transparency sorting because hidden fragments are discarded outright.
 */
export function applyReveal<T extends Material>(material: T, uniform: RevealUniform): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = uniform;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uReveal[${REVEAL_BLOBS}];`,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
float revealField = 0.0;
for (int i = 0; i < ${REVEAL_BLOBS}; i++) {
  vec2 toBlob = gl_FragCoord.xy - uReveal[i].xy;
  revealField += (uReveal[i].z * uReveal[i].z) / (dot(toBlob, toBlob) + 1.0);
}
if (revealField < 1.0) discard;`,
      );
  };
  // Distinguishes the patched program from the stock one in three's cache.
  material.customProgramCacheKey = () => `reveal-${REVEAL_BLOBS}`;
  return material;
}
