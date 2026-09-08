import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ARROW_RADIUS } from '../puzzle/types';
import { cableJelly } from '../style/jelly';

export const CABLE_RADIUS = ARROW_RADIUS;
export const CABLE_RADIAL_SEGMENTS = 8;
export const CABLE_FILLET_RADIUS = 0.13;
export const CABLE_FILLET_LEG_LIMIT = 0.28;
export const CABLE_FILLET_MIN_RADIUS = 0.025;
export const CABLE_FILLET_ARC_SEGMENTS = 4;
export const REFRIGERATOR_FREEZE_COLOR = 0x6fc2d0;
export const REFRIGERATOR_ICE_COLOR = 0x7dced8;
export const REFRIGERATOR_ICE_OPACITY = 0.86;
export const REFRIGERATOR_SPIKE_OPACITY = 0.96;
export const COFFEE_STAIN_COLOR = 0x4f2b23;

const EPSILON = 1e-6;
const zAxis = new THREE.Vector3(0, 0, 1);

export type CableFilletDiagnostic = {
  cornerIndex: number;
  applied: boolean;
  radius: number;
  incomingLength: number;
  outgoingLength: number;
  tangentStart: THREE.Vector3;
  tangentEnd: THREE.Vector3;
  center: THREE.Vector3 | null;
};

export type RoundedCablePath = {
  curve: THREE.CurvePath<THREE.Vector3>;
  fillets: CableFilletDiagnostic[];
  sourcePoints: THREE.Vector3[];
};

export type RoundedCableGeometry = RoundedCablePath & {
  geometry: THREE.BufferGeometry;
};

export function createCableToonMaterial(
  color: THREE.ColorRepresentation,
): THREE.MeshPhysicalMaterial {
  const material = cableJelly({ color, thickness: CABLE_RADIUS * 2, transparent: false, opacity: 1 });
  material.name = 'sakura-cable-jelly';
  material.userData.materialRole = 'cable-rubber';
  material.userData.radialSegments = CABLE_RADIAL_SEGMENTS;
  const visualInflation = { value: 0 };
  const freezeAmount = { value: 0 };
  const freezeProgress = { value: 0 };
  const freezeSeed = { value: 0 };
  const overheatAmount = { value: 0 };
  const overheatTurns = { value: 2 };
  const overheatTime = { value: 0 };
  const overheatReveal = { value: 0 };
  const coffeeAmount = { value: 0 };
  const coffeeReveal = { value: 0 };
  const coffeeSeed = { value: 0 };
  const coffeeTime = { value: 0 };
  const coffeeDirection = { value: 0 };
  const coffeeColor = { value: new THREE.Color(COFFEE_STAIN_COLOR) };
  const skillSweepProgress = { value: 0 };
  const skillSweepStrength = { value: 0 };
  const skillSweepColor = { value: new THREE.Color(0x9b7bc8) };
  const skillRecolorProgress = { value: 0 };
  const skillRecolorColor = { value: new THREE.Color(0xf18a55) };
  const previousOnBeforeCompile = material.onBeforeCompile.bind(material);
  const previousProgramCacheKey = material.customProgramCacheKey.bind(material);
  material.userData.visualInflation = visualInflation;
  material.userData.freezeAmount = freezeAmount;
  material.userData.freezeProgress = freezeProgress;
  material.userData.freezeSeed = freezeSeed;
  material.userData.overheatAmount = overheatAmount;
  material.userData.overheatTurns = overheatTurns;
  material.userData.overheatTime = overheatTime;
  material.userData.overheatReveal = overheatReveal;
  material.userData.coffeeAmount = coffeeAmount;
  material.userData.coffeeReveal = coffeeReveal;
  material.userData.coffeeSeed = coffeeSeed;
  material.userData.coffeeTime = coffeeTime;
  material.userData.coffeeDirection = coffeeDirection;
  material.userData.coffeeColor = coffeeColor;
  material.userData.skillSweepProgress = skillSweepProgress;
  material.userData.skillSweepStrength = skillSweepStrength;
  material.userData.skillSweepColor = skillSweepColor;
  material.userData.skillRecolorProgress = skillRecolorProgress;
  material.userData.skillRecolorColor = skillRecolorColor;
  material.userData.progressiveFreeze = true;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile(shader, renderer);
    shader.uniforms.uCableVisualInflation = visualInflation;
    shader.uniforms.uCableFreezeAmount = freezeAmount;
    shader.uniforms.uCableFreezeProgress = freezeProgress;
    shader.uniforms.uCableFreezeSeed = freezeSeed;
    shader.uniforms.uCableOverheatAmount = overheatAmount;
    shader.uniforms.uCableOverheatTurns = overheatTurns;
    shader.uniforms.uCableOverheatTime = overheatTime;
    shader.uniforms.uCableOverheatReveal = overheatReveal;
    shader.uniforms.uCableCoffeeAmount = coffeeAmount;
    shader.uniforms.uCableCoffeeReveal = coffeeReveal;
    shader.uniforms.uCableCoffeeSeed = coffeeSeed;
    shader.uniforms.uCableCoffeeTime = coffeeTime;
    shader.uniforms.uCableCoffeeDirection = coffeeDirection;
    shader.uniforms.uCableCoffeeColor = coffeeColor;
    shader.uniforms.uCableSkillSweepProgress = skillSweepProgress;
    shader.uniforms.uCableSkillSweepStrength = skillSweepStrength;
    shader.uniforms.uCableSkillSweepColor = skillSweepColor;
    shader.uniforms.uCableSkillRecolorProgress = skillRecolorProgress;
    shader.uniforms.uCableSkillRecolorColor = skillRecolorColor;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uCableVisualInflation;
attribute float aCableProgress;
varying float vCableFreezeProgress;
varying vec3 vCableViewNormal;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vCableFreezeProgress = aCableProgress;
vCableViewNormal = normalize(normalMatrix * objectNormal);
transformed += objectNormal * uCableVisualInflation;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uCableFreezeAmount;
uniform float uCableFreezeProgress;
uniform float uCableFreezeSeed;
uniform float uCableOverheatAmount;
uniform float uCableOverheatTurns;
uniform float uCableOverheatTime;
uniform float uCableOverheatReveal;
uniform float uCableCoffeeAmount;
uniform float uCableCoffeeReveal;
uniform float uCableCoffeeSeed;
uniform float uCableCoffeeTime;
uniform float uCableCoffeeDirection;
uniform vec3 uCableCoffeeColor;
uniform float uCableSkillSweepProgress;
uniform float uCableSkillSweepStrength;
uniform vec3 uCableSkillSweepColor;
uniform float uCableSkillRecolorProgress;
uniform vec3 uCableSkillRecolorColor;
varying float vCableFreezeProgress;
varying vec3 vCableViewNormal;`,
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `vec4 diffuseColor = vec4( diffuse, opacity );
float cableFreezeDistance = 1.0 - vCableFreezeProgress;
float cableFreezeFront = 1.0 - smoothstep(
  uCableFreezeProgress - 0.075,
  uCableFreezeProgress + 0.025,
  cableFreezeDistance
);
if (uCableFreezeProgress > 0.985) cableFreezeFront = 1.0;
float cableFreezeCoverage = clamp(cableFreezeFront * uCableFreezeAmount, 0.0, 1.0);
vec3 cableFrozenColor = vec3(0.49, 0.81, 0.85);
diffuseColor.rgb = mix(diffuseColor.rgb, cableFrozenColor, cableFreezeCoverage * 0.9);

if (uCableSkillRecolorProgress > 0.001) {
  float cableRecolorDistanceFromCenter = abs(vCableFreezeProgress - 0.5) * 2.0;
  float cableRecolorCoverage = 1.0 - smoothstep(
    uCableSkillRecolorProgress - 0.085,
    uCableSkillRecolorProgress + 0.025,
    cableRecolorDistanceFromCenter
  );
  if (uCableSkillRecolorProgress > 0.995) cableRecolorCoverage = 1.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, uCableSkillRecolorColor, cableRecolorCoverage);
}

vec3 cableCoffeeEmission = vec3(0.0);
if (uCableCoffeeAmount > 0.001) {
  float cableCoffeeAlong = mix(
    vCableFreezeProgress,
    1.0 - vCableFreezeProgress,
    step(0.5, uCableCoffeeDirection)
  );
  float cableCoffeeWave = sin(cableCoffeeAlong * 23.0 + uCableCoffeeSeed * 17.0) * 0.032;
  cableCoffeeWave += sin(cableCoffeeAlong * 51.0 - uCableCoffeeTime * 0.68 + uCableCoffeeSeed * 31.0) * 0.018;
  cableCoffeeWave += sin(cableCoffeeAlong * 91.0 + uCableCoffeeSeed * 47.0) * 0.008;
  float cableCoffeeSignedFront = uCableCoffeeReveal * 1.12 - cableCoffeeAlong + cableCoffeeWave;
  float cableCoffeeHalo = smoothstep(-0.16, 0.075, cableCoffeeSignedFront);
  float cableCoffeeCore = smoothstep(-0.045, 0.065, cableCoffeeSignedFront);
  float cableCoffeeEdgeCoverage = cableCoffeeHalo * (1.0 - cableCoffeeCore) * uCableCoffeeAmount;
  float cableCoffeeCoverage = cableCoffeeCore * uCableCoffeeAmount;
  vec3 cableCoffeeWetEdge = clamp(uCableCoffeeColor * 1.34 + vec3(0.018, 0.009, 0.006), 0.0, 1.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, cableCoffeeWetEdge, cableCoffeeEdgeCoverage * 0.58);
  diffuseColor.rgb = mix(diffuseColor.rgb, uCableCoffeeColor, cableCoffeeCoverage);
  cableCoffeeEmission = uCableCoffeeColor * cableCoffeeCoverage * 0.22;
}

vec3 cableSkillSweepEmission = vec3(0.0);
if (uCableSkillSweepStrength > 0.001) {
  float sweepDistance = abs(vCableFreezeProgress - uCableSkillSweepProgress);
  float sweepHalo = 1.0 - smoothstep(0.035, 0.18, sweepDistance);
  float sweepCore = 1.0 - smoothstep(0.008, 0.058, sweepDistance);
  float sweepRim = pow(clamp(1.0 - abs(vCableViewNormal.z), 0.0, 1.0), 1.8);
  float sweepCoverage = clamp(
    sweepHalo * 0.42 + sweepCore * 0.62 + sweepRim * 0.08,
    0.0,
    1.0
  ) * uCableSkillSweepStrength;
  diffuseColor.rgb = mix(diffuseColor.rgb, uCableSkillSweepColor, sweepCoverage * 0.76);
  cableSkillSweepEmission = uCableSkillSweepColor * uCableSkillSweepStrength
    * (sweepCore * 0.78 + sweepHalo * 0.2 + sweepRim * 0.06);
}

vec3 cableHeatEmission = vec3(0.0);
if (uCableOverheatAmount > 0.001) {
  float cableHeatDistanceFromPlug = 1.0 - vCableFreezeProgress;
  float cableHeatReveal = 1.0 - smoothstep(
    uCableOverheatReveal - 0.08,
    uCableOverheatReveal + 0.035,
    cableHeatDistanceFromPlug
  );
  float cableHeatUrgency = 1.0 - step(1.5, uCableOverheatTurns);
  float cableHeatSpeed = mix(0.72, 0.92, cableHeatUrgency);
  float cableHeatPhase = fract(vCableFreezeProgress * 2.65 - uCableOverheatTime * cableHeatSpeed);
  float cableHeatBandA = 1.0 - smoothstep(0.055, 0.16, abs(cableHeatPhase - 0.18));
  float cableHeatBandB = 1.0 - smoothstep(0.045, 0.135, abs(cableHeatPhase - 0.62));
  float cableHeatBand = max(cableHeatBandA, cableHeatBandB);
  float cableHeatCoreA = 1.0 - smoothstep(0.018, 0.052, abs(cableHeatPhase - 0.18));
  float cableHeatCoreB = 1.0 - smoothstep(0.016, 0.046, abs(cableHeatPhase - 0.62));
  float cableHeatCore = max(cableHeatCoreA, cableHeatCoreB);
  float cableHeatRim = pow(clamp(1.0 - abs(vCableViewNormal.z), 0.0, 1.0), 2.2);
  float cableHeatBreath = 0.82 + sin(uCableOverheatTime * mix(3.4, 5.1, cableHeatUrgency)) * 0.18;
  float cableHeatCoverage = uCableOverheatAmount * cableHeatReveal * clamp(
    0.1 + cableHeatBand * 0.9 + cableHeatRim * 0.12,
    0.0,
    1.0
  );
  vec3 cableHeatColor = mix(vec3(1.0, 0.42, 0.055), vec3(1.0, 0.08, 0.025), cableHeatUrgency);
  vec3 cableHeatCoreColor = mix(vec3(1.0, 0.91, 0.48), vec3(1.0, 0.48, 0.16), cableHeatUrgency);
  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    cableHeatColor,
    cableHeatCoverage * (0.38 + cableHeatBreath * 0.22)
  );
  cableHeatEmission = cableHeatColor * uCableOverheatAmount * cableHeatReveal * cableHeatBreath
    * (cableHeatBand * 0.82 + cableHeatRim * 0.08);
  cableHeatEmission += cableHeatCoreColor * uCableOverheatAmount * cableHeatReveal
    * cableHeatCore * 0.82;
}`,
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      'outgoingLight += cableHeatEmission + cableCoffeeEmission + cableSkillSweepEmission;\n#include <opaque_fragment>',
    );
  };
  material.customProgramCacheKey = () => `${previousProgramCacheKey()}-cable-base-v12-skill-recolor`;
  return material;
}

export function setCableSkillSweep(
  material: THREE.MeshPhysicalMaterial,
  progress: number,
  strength: number,
  color: THREE.ColorRepresentation,
): void {
  const progressUniform = material.userData.skillSweepProgress as { value: number } | undefined;
  const strengthUniform = material.userData.skillSweepStrength as { value: number } | undefined;
  const colorUniform = material.userData.skillSweepColor as { value: THREE.Color } | undefined;
  if (progressUniform) progressUniform.value = progress;
  if (strengthUniform) strengthUniform.value = THREE.MathUtils.clamp(strength, 0, 1);
  if (colorUniform) colorUniform.value.set(color);
}

export function setCableSkillRecolor(
  material: THREE.MeshPhysicalMaterial,
  progress: number,
  color: THREE.ColorRepresentation,
): void {
  const progressUniform = material.userData.skillRecolorProgress as { value: number } | undefined;
  const colorUniform = material.userData.skillRecolorColor as { value: THREE.Color } | undefined;
  if (progressUniform) progressUniform.value = THREE.MathUtils.clamp(progress, 0, 1);
  if (colorUniform) colorUniform.value.set(color);
}

export function setCableCoffeeStain(
  material: THREE.MeshPhysicalMaterial,
  amount: number,
  reveal: number,
  seed: number,
  elapsed: number,
  direction: number,
): void {
  const amountUniform = material.userData.coffeeAmount as { value: number } | undefined;
  const revealUniform = material.userData.coffeeReveal as { value: number } | undefined;
  const seedUniform = material.userData.coffeeSeed as { value: number } | undefined;
  const timeUniform = material.userData.coffeeTime as { value: number } | undefined;
  const directionUniform = material.userData.coffeeDirection as { value: number } | undefined;
  if (amountUniform) amountUniform.value = THREE.MathUtils.clamp(amount, 0, 1);
  if (revealUniform) revealUniform.value = THREE.MathUtils.clamp(reveal, 0, 1);
  if (seedUniform) seedUniform.value = seed;
  if (timeUniform) timeUniform.value = elapsed;
  if (directionUniform) directionUniform.value = direction >= 0.5 ? 1 : 0;
}

export function setCableOverheat(
  material: THREE.MeshPhysicalMaterial,
  amount: number,
  turnsRemaining: number,
  elapsed: number,
  reveal = 1,
): void {
  const heatAmount = material.userData.overheatAmount as { value: number } | undefined;
  const heatTurns = material.userData.overheatTurns as { value: number } | undefined;
  const heatTime = material.userData.overheatTime as { value: number } | undefined;
  const heatReveal = material.userData.overheatReveal as { value: number } | undefined;
  if (heatAmount) heatAmount.value = THREE.MathUtils.clamp(amount, 0, 1);
  if (heatTurns) heatTurns.value = Math.max(1, turnsRemaining);
  if (heatTime) heatTime.value = Math.max(0, elapsed);
  if (heatReveal) heatReveal.value = THREE.MathUtils.clamp(reveal, 0, 1);
}

export type CableIceShellMaterial = THREE.MeshPhysicalMaterial & {
  userData: {
    iceAmount?: { value: number };
    iceProgress?: { value: number };
    [key: string]: unknown;
  };
};

export function createCableIceShellMaterial(): CableIceShellMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    name: 'sakura-cable-ice-shell',
    color: REFRIGERATOR_ICE_COLOR,
    emissive: 0x214f5f,
    emissiveIntensity: 0.02,
    roughness: 0.66,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.34,
    transmission: 0,
    ior: 1.31,
    thickness: CABLE_RADIUS * 0.82,
    attenuationColor: new THREE.Color(0x5fb8c7),
    attenuationDistance: 1.25,
    specularIntensity: 0.78,
    specularColor: new THREE.Color(0xc8f1f3),
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    alphaTest: 0.012,
    flatShading: false,
  }) as CableIceShellMaterial;
  const amount = { value: 0 };
  const progress = { value: 0 };
  material.userData.materialRole = 'cable-ice-shell';
  material.userData.iceAmount = amount;
  material.userData.iceProgress = progress;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uIceAmount = amount;
    shader.uniforms.uIceProgress = progress;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
attribute float aCableProgress;
varying float vIceCableProgress;
varying vec3 vIceViewNormal;`,
    ).replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
vIceCableProgress = aCableProgress;
vIceViewNormal = normalize(normalMatrix * objectNormal);`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
varying float vIceCableProgress;
varying vec3 vIceViewNormal;
uniform float uIceAmount;
uniform float uIceProgress;`,
    ).replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `vec4 diffuseColor = vec4( diffuse, opacity );
float iceDistance = 1.0 - vIceCableProgress;
float iceFront = 1.0 - smoothstep(
  uIceProgress - 0.075,
  uIceProgress + 0.025,
  iceDistance
);
if (uIceProgress > 0.985) iceFront = 1.0;
float iceCoverage = clamp(iceFront * uIceAmount, 0.0, 1.0);
if (iceCoverage < 0.012) discard;
float iceRim = pow(1.0 - clamp(abs(vIceViewNormal.z), 0.0, 1.0), 1.18);
// The original cable stays visible through the centre while the enlarged
// silhouette becomes denser. This makes the layer read as a clear ice casing
// around rubber instead of another flat cable colour.
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.84, 0.94, 0.91), iceRim * 0.12);
diffuseColor.a *= iceCoverage;`,
    );
  };
  material.customProgramCacheKey = () => 'sakura-cable-ice-shell-v3';
  return material;
}

export function setCableIceShell(
  material: CableIceShellMaterial,
  amount: number,
  progress: number,
): void {
  const nextAmount = THREE.MathUtils.clamp(amount, 0, 1);
  const nextProgress = THREE.MathUtils.clamp(progress, 0, 1);
  if (material.userData.iceAmount) material.userData.iceAmount.value = nextAmount;
  if (material.userData.iceProgress) material.userData.iceProgress.value = nextProgress;
  material.visible = nextAmount > 0.001;
}

function stableIceNoise(x: number, y: number, z: number, seed: number): number {
  const value = Math.sin(
    x * 17.17 + y * 31.73 + z * 11.41 + seed * 53.19,
  ) * 43758.5453;
  return value - Math.floor(value);
}

const ICE_FACET_COLORS = [
  new THREE.Color(0x6fc2d0),
  new THREE.Color(0x7dced8),
  new THREE.Color(0x9edfe2),
  new THREE.Color(0xb7e6e3),
  new THREE.Color(0xd6f0e8),
] as const;

function addIceFacetColors(geometry: THREE.BufferGeometry, seed: number): void {
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const triangleColor = new THREE.Color();
  for (let index = 0; index < position.count; index += 3) {
    const end = Math.min(index + 3, position.count);
    let centerX = 0;
    let centerY = 0;
    let centerZ = 0;
    for (let vertex = index; vertex < end; vertex += 1) {
      centerX += position.getX(vertex);
      centerY += position.getY(vertex);
      centerZ += position.getZ(vertex);
    }
    const divisor = Math.max(1, end - index);
    const tone = stableIceNoise(
      Math.round(centerX / divisor * 17),
      Math.round(centerY / divisor * 17),
      Math.round(centerZ / divisor * 17),
      seed + index * 0.013,
    );
    triangleColor.copy(ICE_FACET_COLORS[Math.min(
      ICE_FACET_COLORS.length - 1,
      Math.floor(tone * ICE_FACET_COLORS.length),
    )]);
    for (let vertex = index; vertex < end; vertex += 1) {
      colors[vertex * 3] = triangleColor.r;
      colors[vertex * 3 + 1] = triangleColor.g;
      colors[vertex * 3 + 2] = triangleColor.b;
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/**
 * A calm, continuous frost casing. The old implementation deliberately
 * varied every ring and every triangle; that read as shattered glass once
 * the camera moved. This keeps the original silhouette and adds only a soft
 * low-poly inflation around it.
 */
export function createRoundedIceShellGeometry(
  source: THREE.BufferGeometry,
  baseOffset = 0.012,
): THREE.BufferGeometry {
  const geometry = source.clone();
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  for (let index = 0; index < position.count; index += 1) {
    position.setXYZ(
      index,
      position.getX(index) + normal.getX(index) * baseOffset,
      position.getY(index) + normal.getY(index) * baseOffset,
      position.getZ(index) + normal.getZ(index) * baseOffset,
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.iceShell = true;
  return geometry;
}

export function createFacetedIceShellGeometry(
  source: THREE.BufferGeometry,
  seed: number,
  baseOffset = 0.012,
  variation = 0.014,
): THREE.BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const broad = Math.round(stableIceNoise(
      Math.round(x * 14) / 14,
      Math.round(y * 14) / 14,
      Math.round(z * 14) / 14,
      seed,
    ) * 4) / 4;
    const shard = stableIceNoise(
      Math.round(x * 29) / 29,
      Math.round(y * 29) / 29,
      Math.round(z * 29) / 29,
      seed + 0.731,
    );
    const shardLift = Math.max(0, (shard - 0.73) / 0.27);
    const offset = baseOffset + broad * variation + shardLift * variation * 0.72;
    position.setXYZ(
      index,
      x + normal.getX(index) * offset,
      y + normal.getY(index) * offset,
      z + normal.getZ(index) * offset,
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  addIceFacetColors(geometry, seed);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.iceShell = true;
  return geometry;
}

export function createCableIceShellGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  seed: number,
): THREE.BufferGeometry {
  void seed;
  const length = Math.max(curve.getLength(), CABLE_RADIUS * 2);
  const segmentCount = Math.max(16, Math.ceil(length / 0.11));
  const radialSegments = 8;
  const tube = new THREE.TubeGeometry(
    curve,
    segmentCount,
    CABLE_RADIUS * 1.1,
    radialSegments,
    false,
  );
  const capRadius = CABLE_RADIUS * 1.1;
  const startCap = new THREE.SphereGeometry(capRadius, radialSegments, 6);
  const endCap = new THREE.SphereGeometry(capRadius, radialSegments, 6);
  const tubeVertexCount = tube.getAttribute('position').count;
  const startCapVertexCount = startCap.getAttribute('position').count;
  startCap.translate(curve.getPointAt(0).x, curve.getPointAt(0).y, curve.getPointAt(0).z);
  endCap.translate(curve.getPointAt(1).x, curve.getPointAt(1).y, curve.getPointAt(1).z);
  const geometry = mergeGeometries([tube, startCap, endCap], false);
  tube.dispose();
  startCap.dispose();
  endCap.dispose();
  if (!geometry) throw new Error('Unable to merge rounded cable ice shell geometry.');
  const totalVertexCount = geometry.getAttribute('position').count;
  const progress = new Float32Array(tubeVertexCount);
  for (let ring = 0; ring <= segmentCount; ring += 1) {
    const value = ring / segmentCount;
    for (let radial = 0; radial <= radialSegments; radial += 1) {
      progress[ring * (radialSegments + 1) + radial] = value;
    }
  }
  const fullProgress = new Float32Array(totalVertexCount);
  fullProgress.set(progress, 0);
  for (let index = tubeVertexCount; index < totalVertexCount; index += 1) {
    fullProgress[index] = index < tubeVertexCount + startCapVertexCount ? 0 : 1;
  }
  geometry.setAttribute('aCableProgress', new THREE.BufferAttribute(fullProgress, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.iceShell = true;
  return geometry;
}

/** Build one rounded low-poly ice mass with a seed-specific melt bulge. */
export function createIceAccretionGeometry(seed: number): THREE.BufferGeometry {
  const variant = Math.floor(stableIceNoise(seed, 8.7, 3.1, seed + 0.41) * 3);
  const geometry = new THREE.SphereGeometry(1, 8, 5);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const point = new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index));
    const direction = point.clone().normalize();
    let radius = 0.92 + stableIceNoise(index, variant + 1.7, 6.4, seed + 0.91) * 0.1;
    if (variant === 0 && direction.y > 0.2) radius += direction.y * 0.1;
    if (variant === 1 && direction.x < -0.12) radius += Math.abs(direction.x) * 0.08;
    if (variant === 2 && direction.z > 0.1) radius += direction.z * 0.1;
    if (direction.y < -0.48 && Math.abs(direction.x) < 0.55) radius += 0.06;
    point.multiplyScalar(radius);
    position.setXYZ(index, point.x, point.y, point.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.iceAccretion = true;
  return geometry;
}

export function setCableVisualInflation(
  material: THREE.MeshPhysicalMaterial,
  inflation: number,
): void {
  const uniform = material.userData.visualInflation as { value: number } | undefined;
  if (uniform) uniform.value = Math.max(0, inflation);
}

export function setCableFreeze(
  material: THREE.MeshPhysicalMaterial,
  amount: number,
  progress: number,
  seed: number,
): void {
  const amountUniform = material.userData.freezeAmount as { value: number } | undefined;
  const progressUniform = material.userData.freezeProgress as { value: number } | undefined;
  const seedUniform = material.userData.freezeSeed as { value: number } | undefined;
  if (amountUniform) amountUniform.value = THREE.MathUtils.clamp(amount, 0, 1);
  if (progressUniform) progressUniform.value = THREE.MathUtils.clamp(progress, 0, 1);
  if (seedUniform) seedUniform.value = seed;
}

class QuarterCircleCurve3 extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly center: THREE.Vector3,
    private readonly startRadius: THREE.Vector3,
    private readonly axis: THREE.Vector3,
  ) {
    super();
  }

  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    return target
      .copy(this.startRadius)
      .applyAxisAngle(this.axis, THREE.MathUtils.clamp(t, 0, 1) * Math.PI * 0.5)
      .add(this.center);
  }

  override getTangent(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const radial = this.startRadius
      .clone()
      .applyAxisAngle(this.axis, THREE.MathUtils.clamp(t, 0, 1) * Math.PI * 0.5);
    return target.crossVectors(this.axis, radial).normalize();
  }
}

function distinctPoints(points: readonly THREE.Vector3[]): THREE.Vector3[] {
  const result: THREE.Vector3[] = [];
  points.forEach((point) => {
    if (!result.length || result[result.length - 1].distanceToSquared(point) > EPSILON ** 2) {
      result.push(point.clone());
    }
  });
  return result;
}

function addLine(
  curve: THREE.CurvePath<THREE.Vector3>,
  start: THREE.Vector3,
  end: THREE.Vector3,
): void {
  if (start.distanceToSquared(end) <= EPSILON ** 2) return;
  curve.add(new THREE.LineCurve3(start.clone(), end.clone()));
}

export function createRoundedCablePath(
  points: readonly THREE.Vector3[],
  requestedRadius = CABLE_FILLET_RADIUS,
): RoundedCablePath {
  const sourcePoints = distinctPoints(points);
  if (sourcePoints.length < 2) throw new Error('A cable path needs at least two distinct points.');

  const curve = new THREE.CurvePath<THREE.Vector3>();
  const fillets: CableFilletDiagnostic[] = [];
  let cursor = sourcePoints[0].clone();

  for (let index = 1; index < sourcePoints.length - 1; index += 1) {
    const previous = sourcePoints[index - 1];
    const corner = sourcePoints[index];
    const next = sourcePoints[index + 1];
    const incomingVector = corner.clone().sub(previous);
    const outgoingVector = next.clone().sub(corner);
    const incomingLength = incomingVector.length();
    const outgoingLength = outgoingVector.length();
    const incoming = incomingVector.clone().normalize();
    const outgoing = outgoingVector.clone().normalize();
    const dot = incoming.dot(outgoing);
    const axis = incoming.clone().cross(outgoing);
    const isOrthogonal = Math.abs(dot) <= 1e-4 && axis.lengthSq() > 1e-8;
    const radius = isOrthogonal
      ? Math.min(requestedRadius, incomingLength * CABLE_FILLET_LEG_LIMIT, outgoingLength * CABLE_FILLET_LEG_LIMIT)
      : 0;

    if (!isOrthogonal || radius < CABLE_FILLET_MIN_RADIUS) {
      if (dot < 0.9999) {
        addLine(curve, cursor, corner);
        cursor = corner.clone();
      }
      fillets.push({
        cornerIndex: index,
        applied: false,
        radius,
        incomingLength,
        outgoingLength,
        tangentStart: corner.clone(),
        tangentEnd: corner.clone(),
        center: null,
      });
      continue;
    }

    axis.normalize();
    const tangentStart = corner.clone().addScaledVector(incoming, -radius);
    const tangentEnd = corner.clone().addScaledVector(outgoing, radius);
    const center = tangentStart.clone().addScaledVector(outgoing, radius);
    const startRadius = tangentStart.clone().sub(center);
    addLine(curve, cursor, tangentStart);
    curve.add(new QuarterCircleCurve3(center, startRadius, axis));
    cursor = tangentEnd;
    fillets.push({
      cornerIndex: index,
      applied: true,
      radius,
      incomingLength,
      outgoingLength,
      tangentStart,
      tangentEnd,
      center,
    });
  }

  addLine(curve, cursor, sourcePoints[sourcePoints.length - 1]);
  if (curve.curves.length === 0) {
    throw new Error('Cable path collapsed to zero length.');
  }
  return { curve, fillets, sourcePoints };
}

function capGeometry(
  point: THREE.Vector3,
  outwardNormal: THREE.Vector3,
  radius: number,
  radialSegments: number,
): THREE.BufferGeometry {
  const cap = new THREE.CircleGeometry(radius, radialSegments);
  cap.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(zAxis, outwardNormal.clone().normalize()));
  cap.translate(point.x, point.y, point.z);
  return cap;
}

function takeNonIndexed(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const result = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geometry.dispose();
  return result;
}

export function createCappedTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  radius = CABLE_RADIUS,
  radialSegments = CABLE_RADIAL_SEGMENTS,
  tubularSegments = Math.max(2, Math.ceil(curve.getLength() / 0.16)),
): THREE.BufferGeometry {
  const segmentCount = Math.max(2, tubularSegments);
  const tube = new THREE.TubeGeometry(curve, segmentCount, radius, radialSegments, false);
  const start = curve.getPoint(0);
  const end = curve.getPoint(1);
  const startTangent = curve.getTangent(0).normalize();
  const endTangent = curve.getTangent(1).normalize();
  const parts = [
    takeNonIndexed(tube),
    takeNonIndexed(capGeometry(start, startTangent.clone().negate(), radius, radialSegments)),
    takeNonIndexed(capGeometry(end, endTangent, radius, radialSegments)),
  ];
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error('Unable to merge capped cable tube geometry.');
  const uv = geometry.getAttribute('uv');
  const progress = new Float32Array(geometry.getAttribute('position').count);
  if (uv) {
    for (let index = 0; index < progress.length; index += 1) progress[index] = uv.getX(index);
  }
  geometry.setAttribute('aCableProgress', new THREE.BufferAttribute(progress, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createRoundedCableGeometry(
  points: readonly THREE.Vector3[],
  requestedRadius = CABLE_FILLET_RADIUS,
): RoundedCableGeometry {
  const path = createRoundedCablePath(points, requestedRadius);
  const lineSegments = Math.max(2, Math.ceil(path.curve.getLength() / 0.16));
  const arcSegments = path.fillets.filter((fillet) => fillet.applied).length * CABLE_FILLET_ARC_SEGMENTS;
  const geometry = createCappedTubeGeometry(
    path.curve,
    CABLE_RADIUS,
    CABLE_RADIAL_SEGMENTS,
    lineSegments + arcSegments,
  );
  geometry.userData.cableFillets = path.fillets.map((fillet) => ({
    cornerIndex: fillet.cornerIndex,
    applied: fillet.applied,
    radius: fillet.radius,
    tangentStart: fillet.tangentStart.toArray(),
    tangentEnd: fillet.tangentEnd.toArray(),
    center: fillet.center?.toArray() ?? null,
  }));
  return { ...path, geometry };
}
