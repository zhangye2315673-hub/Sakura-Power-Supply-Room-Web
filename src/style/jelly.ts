import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type JellyOptions = {
  color: THREE.ColorRepresentation;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  thickness?: number;
};

/** Pigmented gel: transmission carries the background, opacity remains available
 * to the existing mechanical animation's appear/fade/reset timeline. */
export function jelly(options: JellyOptions): THREE.MeshPhysicalMaterial {
  const pigment = new THREE.Color(options.color);
  const material = new THREE.MeshPhysicalMaterial({
    color: pigment,
    metalness: 0,
    roughness: 0.19,
    ior: 1.36,
    transmission: 0.88,
    thickness: options.thickness ?? 0.55,
    attenuationColor: pigment.clone().lerp(new THREE.Color(0xffffff), 0.3),
    attenuationDistance: 0.8,
    clearcoat: 1,
    clearcoatRoughness: 0.13,
    specularIntensity: 0.85,
    envMapIntensity: 0.8,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? true,
    opacity: options.opacity ?? 0.86,
    depthWrite: !(options.transparent ?? false),
  });
  material.name = 'sakura-jelly';
  material.userData.jelly = true;
  return material;
}

/** One small PMREM per renderer; broad studio cards give wet edges even on
 * small devices. The environment is lighting only, never a background swap. */
export function installJellyEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene): () => void {
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.06, 0.1, 100);
  room.dispose();
  pmrem.dispose();
  const previous = scene.environment;
  scene.environment = target.texture;
  renderer.transmissionResolutionScale = 0.5;
  return () => {
    if (scene.environment === target.texture) scene.environment = previous;
    target.dispose();
  };
}

/** Cable gel shares pigment across the body and plug, with a quiet surface
 * reflection so dense crossings retain their color and transmitted depth. */
export function cableJelly(options: JellyOptions): THREE.MeshPhysicalMaterial {
  const material = jelly(options);
  material.roughness = 0.24;
  material.clearcoat = 0.04;
  material.clearcoatRoughness = 0.35;
  material.specularIntensity = 0.12;
  material.envMapIntensity = 0.10;
  material.transmission = 0.12;
  // Short colored absorption length keeps transmitted light pigmented.
  material.attenuationColor.copy(material.color);
  material.attenuationDistance = Math.max(0.025, (options.thickness ?? 0.12) * 0.7);
  // Blend the already rendered rear cables too: the transmission buffer alone
  // only includes opaque geometry, so increasing transmission cannot reveal them.
  material.transparent = true;
  material.opacity = (options.opacity ?? 1) * 0.97;
  material.depthWrite = true;
  const compile = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    compile(shader, renderer);
    // Keep authored hue, but give the cable its own pigment and light response.
    // Physical diffuse lighting was washing out the pastel palette even without specular.
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float cablePigmentFloor = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
      diffuseColor.rgb = clamp(mix(vec3(cablePigmentFloor), diffuseColor.rgb, 1.4) * 0.72, 0.0, 1.0);
    `).replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
      // Dim the diffuse body without changing its pigment or transmission.
      // Bright yellow has high luminance in both red and green channels;
      // compress those bright pigments further while preserving their hue.
      float cableLuminance = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float cableBrightness = mix(0.78, 0.58, smoothstep(0.22, 0.6, cableLuminance));
      reflectedLight.directDiffuse *= 0.62 * cableBrightness;
      reflectedLight.indirectDiffuse *= 0.72 * cableBrightness;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float gelEdge = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.6);
      diffuseColor.a *= mix(0.98, 1.0, gelEdge);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey = () => 'cable-gel-pigmented-v5';
  material.userData.cableJelly = true;
  return material;
}
