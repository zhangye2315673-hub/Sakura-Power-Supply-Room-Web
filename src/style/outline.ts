import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SOFT_CAGE_FUNCTION_GLSL, SOFT_CAGE_UNIFORM_GLSL } from '../systems/softDeformShader';
import { isSharedResource, markSharedResource } from '../render/sharedResources';
import { PAL } from './palette';

const vertexShader = /* glsl */ `
  uniform float uThickness;
  uniform float uVariation;
  uniform float uVariationPhase;
  uniform float uVisualInflation;
  uniform float uRevealEnabled;
  uniform float uRevealProgress;
  uniform float uRootFadeEnabled;
  uniform float uRootFadeStart;
  uniform float uRootFadeEnd;
  uniform vec2 uResolution;
  attribute float aCableProgress;
  varying float vOutlineCableProgress;
  varying float vOutlineLocalY;
  varying float vOutlineFacing;
  ${SOFT_CAGE_UNIFORM_GLSL}
  ${SOFT_CAGE_FUNCTION_GLSL}

  void main() {
    vOutlineCableProgress = aCableProgress;
    vOutlineLocalY = position.y;
    vec4 world = modelMatrix * vec4(position, 1.0);
    world.xyz += normalize(mat3(modelMatrix) * normal) * uVisualInflation;
    world.xyz = softApplyCage(world.xyz);

    vec4 mv = viewMatrix * world;
    vec3 n = normalize(normalMatrix * normal);
    vOutlineFacing = abs(dot(n, normalize(-mv.xyz)));
    vec4 clip = projectionMatrix * mv;
    vec3 clipN = normalize((projectionMatrix * vec4(n, 0.0)).xyz);
    vec2 aspect = vec2(uResolution.y / uResolution.x, 1.0);
    float stableThickness = uThickness;
    if (uVariation > 0.0001) {
      float lowFrequencyVariation =
        sin(dot(position, vec3(1.37, 0.83, 1.11)) + uVariationPhase) * 0.62 +
        sin(dot(position, vec3(0.41, 1.19, 0.67)) + uVariationPhase * 1.73) * 0.38;
      stableThickness *= 1.0 + lowFrequencyVariation * uVariation;
    }
    float deformOutlineScale = mix(1.0, 0.62, uSoftPullRatio);
    clip.xy += clipN.xy * aspect * stableThickness * deformOutlineScale * clip.w * 0.5;
    gl_Position = clip;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uRevealEnabled;
  uniform float uRevealProgress;
  uniform float uRootFadeEnabled;
  uniform float uRootFadeStart;
  uniform float uRootFadeEnd;
  uniform float uSilhouetteOnly;
  varying float vOutlineCableProgress;
  varying float vOutlineLocalY;
  varying float vOutlineFacing;
  void main() {
    if (uSilhouetteOnly > 0.5 && vOutlineFacing > 0.3) discard;
    if (uRevealEnabled > 0.5) {
      float revealDistance = 1.0 - vOutlineCableProgress;
      float reveal = 1.0 - smoothstep(
        uRevealProgress - 0.075,
        uRevealProgress + 0.025,
        revealDistance
      );
      if (uRevealProgress > 0.985) reveal = 1.0;
      if (reveal < 0.012) discard;
    }
    float rootFade = uRootFadeEnabled > 0.5
      ? smoothstep(uRootFadeStart, uRootFadeEnd, vOutlineLocalY)
      : 1.0;
    if (rootFade < 0.012) discard;
    gl_FragColor = vec4(uColor, uOpacity * rootFade);
  }
`;

const resolution = new THREE.Vector2(1920, 1080);
const materials = new Set<THREE.ShaderMaterial>();
const geometryCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

export function setOutlineResolution(width: number, height: number): void {
  resolution.set(width, height);
  materials.forEach((material) => {
    material.uniforms.uResolution.value.set(width, height);
  });
}

function smoothGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const cached = geometryCache.get(geometry);
  if (cached) return cached;

  let result: THREE.BufferGeometry;
  try {
    result = mergeVertices(geometry.clone(), 1e-4);
    result.computeVertexNormals();
  } catch {
    result = geometry.clone();
  }

  for (const name of Object.keys(result.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'aCableProgress') result.deleteAttribute(name);
  }
  if (isSharedResource(geometry)) markSharedResource(result);
  geometryCache.set(geometry, result);
  return result;
}

export function addHullOutline(
  mesh: THREE.Mesh,
  thickness = 0.0037,
  color: THREE.ColorRepresentation = PAL.ink,
): THREE.Mesh {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uVariation: { value: 0 },
      uVariationPhase: { value: 0 },
      uVisualInflation: { value: 0 },
      uRevealEnabled: { value: 0 },
      uRevealProgress: { value: 1 },
      uRootFadeEnabled: { value: 0 },
      uRootFadeStart: { value: 0 },
      uRootFadeEnd: { value: 0.2 },
      uSilhouetteOnly: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uResolution: { value: resolution.clone() },
      uSoftRootWorldToLocal: { value: new THREE.Matrix4() },
      uSoftRootLocalToWorld: { value: new THREE.Matrix4() },
      uSoftBoundsMin: { value: new THREE.Vector3(-0.5, -0.5, -0.5) },
      uSoftBoundsMax: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
      uSoftPullLocal: { value: new THREE.Vector3() },
      uSoftSurfaceNormalLocal: { value: new THREE.Vector3(0, 0, 1) },
      uSoftPullRatio: { value: 0 },
      uSoftWholeCoupling: { value: 0.78 },
      uSoftLocalGain: { value: 0.92 },
      uSoftIndentStrength: { value: 0.22 },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  materials.add(material);
  material.addEventListener('dispose', () => materials.delete(material));

  const outline = new THREE.Mesh(smoothGeometry(mesh.geometry), material);
  outline.name = `${mesh.name || 'mesh'}-ink`;
  outline.userData.isOutline = true;
  outline.renderOrder = -1;
  mesh.add(outline);
  return outline;
}

export function setHullOutlineStyle(
  outline: THREE.Mesh,
  options: {
    thickness: number;
    variation?: number;
    phase?: number;
    color?: THREE.ColorRepresentation;
  },
): void {
  if (!outline.userData.isOutline || !(outline.material instanceof THREE.ShaderMaterial)) return;
  const uniforms = outline.material.uniforms;
  if (uniforms.uThickness) uniforms.uThickness.value = options.thickness;
  if (uniforms.uVariation) uniforms.uVariation.value = THREE.MathUtils.clamp(options.variation ?? 0, 0, 0.35);
  if (uniforms.uVariationPhase) uniforms.uVariationPhase.value = options.phase ?? 0;
  if (options.color !== undefined && uniforms.uColor?.value instanceof THREE.Color) {
    uniforms.uColor.value.set(options.color);
  }
  outline.userData.outlineThickness = options.thickness;
  outline.userData.outlineVariation = options.variation ?? 0;
}

export function setHullOutlineVisualInflation(outline: THREE.Mesh | null, inflation: number): void {
  if (!outline?.userData.isOutline || !(outline.material instanceof THREE.ShaderMaterial)) return;
  const uniform = outline.material.uniforms.uVisualInflation;
  if (uniform) uniform.value = Math.max(0, inflation);
}

export function setHullOutlineSilhouetteOnly(
  outline: THREE.Mesh | null,
  enabled: boolean,
): void {
  if (!outline?.userData.isOutline || !(outline.material instanceof THREE.ShaderMaterial)) return;
  const uniform = outline.material.uniforms.uSilhouetteOnly;
  if (uniform) uniform.value = enabled ? 1 : 0;
  outline.userData.outlineSilhouetteOnly = enabled;
}

export function setHullOutlineReveal(outline: THREE.Mesh | null, progress: number | null): void {
  if (!outline?.userData.isOutline || !(outline.material instanceof THREE.ShaderMaterial)) return;
  const uniforms = outline.material.uniforms;
  if (uniforms.uRevealEnabled) uniforms.uRevealEnabled.value = progress === null ? 0 : 1;
  if (uniforms.uRevealProgress) {
    uniforms.uRevealProgress.value = progress === null ? 1 : THREE.MathUtils.clamp(progress, 0, 1);
  }
}

/**
 * Softens the lower part of an outline without fading the mesh itself. Ice
 * spikes use this to keep a bold outer silhouette while their buried root
 * visually merges into the surrounding ice shell.
 */
export function setHullOutlineRootFade(
  outline: THREE.Mesh | null,
  start: number | null,
  end = 0.24,
): void {
  if (!outline?.userData.isOutline || !(outline.material instanceof THREE.ShaderMaterial)) return;
  const uniforms = outline.material.uniforms;
  if (uniforms.uRootFadeEnabled) uniforms.uRootFadeEnabled.value = start === null ? 0 : 1;
  if (start === null) return;
  if (uniforms.uRootFadeStart) uniforms.uRootFadeStart.value = start;
  if (uniforms.uRootFadeEnd) uniforms.uRootFadeEnd.value = Math.max(start + 0.001, end);
}
