import { FrontSide, MeshPhysicalMaterial } from "three";

/** Matte pink sidewall: diffuse shading only, no lacquer or specular glare. */
export function createHeartSideMaterial() {
  const material = new MeshPhysicalMaterial({
    color: "#DEADB9",
    metalness: 0,
    roughness: 1,
    clearcoat: 0,
    specularIntensity: 0,
    sheen: 0,
    side: FrontSide,
  });
  // Fine, low-contrast grain stays attached to the model while it rotates.
  // It affects only the side material, never the photographic front/back caps.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHeartMattePosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHeartMattePosition = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHeartMattePosition;")
      .replace("#include <color_fragment>", `#include <color_fragment>
        vec3 matteCell = floor(vHeartMattePosition * 1.25);
        float matteGrain = fract(sin(dot(matteCell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        diffuseColor.rgb *= mix(0.975, 1.015, matteGrain);
      `);
  };
  material.customProgramCacheKey = () => "marrow-heart-matte-grain-v1";
  return material;
}
