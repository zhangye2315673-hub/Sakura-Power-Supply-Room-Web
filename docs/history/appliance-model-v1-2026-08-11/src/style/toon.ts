import * as THREE from 'three';

const RAMPS: Record<string, number[]> = {
  2: [96, 255],
  3: [92, 178, 255],
  4: [80, 142, 202, 255],
  soft: [180, 255],
};

const rampCache = new Map<string, THREE.DataTexture>();

export function gradientMap(bands: 2 | 3 | 4 | 'soft' = 3): THREE.DataTexture {
  const key = String(bands);
  const cached = rampCache.get(key);
  if (cached) return cached;

  const stops = RAMPS[key] ?? RAMPS['3'];
  const data = new Uint8Array(stops.length * 4);
  stops.forEach((stop, index) => {
    data[index * 4] = stop;
    data[index * 4 + 1] = stop;
    data[index * 4 + 2] = stop;
    data[index * 4 + 3] = 255;
  });

  const texture = new THREE.DataTexture(data, stops.length, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  rampCache.set(key, texture);
  return texture;
}

const chunkName = 'lights_toon_pars_fragment';
const sourceLine =
  'vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;';
const sourceChunk = THREE.ShaderChunk[chunkName];
const patchedChunk = sourceChunk?.includes(sourceLine)
  ? `uniform vec3 uShadowTint;\n${sourceChunk.replace(
      sourceLine,
      `vec3 celBand = getGradientIrradiance( geometryNormal, directLight.direction );
       vec3 irradiance = celBand * mix( uShadowTint, vec3( 1.0 ), celBand ) * directLight.color;`,
    )}`
  : null;

export type CelOptions = {
  color: THREE.ColorRepresentation;
  bands?: 2 | 3 | 4 | 'soft';
  tint?: THREE.ColorRepresentation;
  flatShading?: boolean;
  transparent?: boolean;
  opacity?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
};

export function cel(options: CelOptions): THREE.MeshToonMaterial {
  const tint = options.tint ?? 0x6c5f8c;
  const material = new THREE.MeshToonMaterial({
    color: options.color,
    gradientMap: gradientMap(options.bands ?? 3),
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 1,
  });
  (material as THREE.MeshToonMaterial & { flatShading: boolean }).flatShading =
    options.flatShading ?? true;

  if (patchedChunk) {
    const uniform = { value: new THREE.Color(tint) };
    material.userData.shadowTint = uniform;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uShadowTint = uniform;
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <${chunkName}>`,
        patchedChunk,
      );
    };
    material.customProgramCacheKey = () => `sakura-cel-${new THREE.Color(tint).getHexString()}`;
  }

  return material;
}

export function flat(
  color: THREE.ColorRepresentation,
  options: Partial<THREE.MeshBasicMaterialParameters> = {},
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, ...options });
}
