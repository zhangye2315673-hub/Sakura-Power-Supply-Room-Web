import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SOFT_CAGE_FUNCTION_GLSL, SOFT_CAGE_UNIFORM_GLSL } from '../systems/softDeformShader';
import { PAL } from './palette';

const vertexShader = /* glsl */ `
  uniform float uThickness;
  uniform vec2 uResolution;
  ${SOFT_CAGE_UNIFORM_GLSL}
  ${SOFT_CAGE_FUNCTION_GLSL}

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    world.xyz = softApplyCage(world.xyz);

    vec4 mv = viewMatrix * world;
    vec3 n = normalize(normalMatrix * normal);
    vec4 clip = projectionMatrix * mv;
    vec3 clipN = normalize((projectionMatrix * vec4(n, 0.0)).xyz);
    vec2 aspect = vec2(uResolution.y / uResolution.x, 1.0);
    float deformOutlineScale = mix(1.0, 0.62, uSoftPullRatio);
    clip.xy += clipN.xy * aspect * uThickness * deformOutlineScale * clip.w * 0.5;
    gl_Position = clip;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
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
    if (name !== 'position' && name !== 'normal') result.deleteAttribute(name);
  }
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

  const outline = new THREE.Mesh(smoothGeometry(mesh.geometry), material);
  outline.name = `${mesh.name || 'mesh'}-ink`;
  outline.userData.isOutline = true;
  outline.renderOrder = -1;
  mesh.add(outline);
  return outline;
}
