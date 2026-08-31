import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addHullOutline } from '../style/outline';
import {
  PLUG_HEAD_MAX_LENGTH,
  PLUG_HEAD_MAX_RADIUS,
  PLUG_HEAD_PIN_RADIUS,
} from '../puzzle/types';
import { PAL } from '../style/palette';
import { cel } from '../style/toon';
import {
  REFRIGERATOR_FREEZE_COLOR,
  REFRIGERATOR_ICE_COLOR,
  REFRIGERATOR_ICE_OPACITY,
} from './CableGeometry';

export type PlugStyleId =
  | 'round-two-pin'
  | 'usb-c'
  | 'flat-two-blade'
  | 'three-pin'
  | 'grounded-round'
  | 'dc-barrel'
  | 'magnetic-pogo';

export const PLUG_STYLE_IDS: readonly PlugStyleId[] = [
  'round-two-pin',
  'usb-c',
  'flat-two-blade',
  'three-pin',
  'grounded-round',
  'dc-barrel',
  'magnetic-pogo',
];

export const PLUG_STYLE_LABELS: Readonly<Record<PlugStyleId, string>> = {
  'round-two-pin': '圆形双针',
  'usb-c': 'Type-C',
  'flat-two-blade': '扁平双片',
  'three-pin': '三针插头',
  'grounded-round': '圆形接地',
  'dc-barrel': 'DC圆孔',
  'magnetic-pogo': '磁吸触点',
};

// Fixed visual envelope measured from the cable endpoint along local +Y.
// Every style is deliberately authored inside this envelope so puzzle spacing
// and collision checks continue to use the original cable centreline data.
export const PLUG_HEAD_SCALE = 1;
const PLUG_BODY_RADIUS = PLUG_HEAD_MAX_RADIUS;
const PLUG_BODY_BOTTOM = 0.14;
const PLUG_BODY_TOP = 0.46;
const PLUG_PIN_RADIUS = PLUG_HEAD_PIN_RADIUS;
const PLUG_PIN_BOTTOM = 0.47;
const PLUG_PIN_TOP = PLUG_HEAD_MAX_LENGTH;
export const PLUG_HEAD_ENVELOPE = Object.freeze({
  anchorY: 0,
  maxRadius: PLUG_BODY_RADIUS,
  maxLength: PLUG_PIN_TOP,
  bodyRange: [PLUG_BODY_BOTTOM, PLUG_BODY_TOP] as const,
  pinRange: [PLUG_PIN_BOTTOM, PLUG_PIN_TOP] as const,
});

export type PlugHead = {
  root: THREE.Group;
  shell: THREE.Mesh;
  frozenShell: THREE.Group;
  pickMeshes: THREE.Mesh[];
  styleId: PlugStyleId;
  setCableJointThickness: (scale?: number) => void;
  readonly cableJointThicknessScale: number;
  setHovered: (hovered: boolean, nightProgress?: number) => void;
  setRecycleSelectionState: (state: 'none' | 'hover' | 'selected', pulse?: number) => void;
  setSkillTint: (color: THREE.ColorRepresentation | null, strength?: number, emissionScale?: number) => void;
  setSkillGlow: (strength?: number) => void;
  setOverheated: (amount?: number, turnsRemaining?: number, elapsed?: number, reveal?: number, cableLength?: number) => void;
  readonly overheatVisualState: Readonly<{ amount: number; reveal: number; materialCount: number; pathScale: number }>;
  setFrozenGeometryEnabled: (enabled: boolean) => void;
  setFrozen: (amount?: number) => void;
  setBlockedFlash: (amount: number) => void;
  reset: () => void;
  dispose: () => void;
};

type RadialGeometryState = {
  geometry: THREE.BufferGeometry;
  basePositions: Float32Array;
};

function captureRadialGeometry(geometry: THREE.BufferGeometry): RadialGeometryState {
  const position = geometry.getAttribute('position');
  return {
    geometry,
    basePositions: Float32Array.from(position.array as ArrayLike<number>),
  };
}

function applyRadialGeometryScale(
  state: RadialGeometryState,
  scale: number,
  weightAtY: (y: number) => number,
): void {
  const position = state.geometry.getAttribute('position') as THREE.BufferAttribute;
  const scaleDelta = scale - 1;
  for (let index = 0; index < position.count; index += 1) {
    const offset = index * 3;
    const x = state.basePositions[offset];
    const y = state.basePositions[offset + 1];
    const z = state.basePositions[offset + 2];
    const radialScale = 1 + scaleDelta * THREE.MathUtils.clamp(weightAtY(y), 0, 1);
    position.setXYZ(index, x * radialScale, y, z * radialScale);
  }
  position.needsUpdate = true;
  state.geometry.computeVertexNormals();
  state.geometry.computeBoundingBox();
  state.geometry.computeBoundingSphere();
}

function tagPart<T extends THREE.Object3D>(object: T, partId: string, styleId: PlugStyleId): T {
  object.userData.partId = partId;
  object.userData.plugStyleId = styleId;
  return object;
}

function tagMaterial<T extends THREE.Material>(material: T, name: string, role: string): T {
  material.name = name;
  material.userData.materialRole = role;
  material.userData.toonBands = name.includes('cavity') ? 2 : 3;
  return material;
}

type PlugOverheatUniforms = {
  amount: { value: number };
  turns: { value: number };
  time: { value: number };
  reveal: { value: number };
  pathScale: { value: number };
};

function installPlugOverheatShader(
  material: THREE.MeshToonMaterial,
  uniforms: PlugOverheatUniforms,
): void {
  const previousOnBeforeCompile = material.onBeforeCompile.bind(material);
  const previousProgramCacheKey = material.customProgramCacheKey.bind(material);
  material.userData.plugOverheatUniforms = uniforms;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile(shader, renderer);
    shader.uniforms.uPlugOverheatAmount = uniforms.amount;
    shader.uniforms.uPlugOverheatTurns = uniforms.turns;
    shader.uniforms.uPlugOverheatTime = uniforms.time;
    shader.uniforms.uPlugOverheatReveal = uniforms.reveal;
    shader.uniforms.uPlugOverheatPathScale = uniforms.pathScale;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vPlugOverheatProgress;
varying vec3 vPlugOverheatViewNormal;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vPlugOverheatProgress = clamp(transformed.y / ${PLUG_HEAD_MAX_LENGTH.toFixed(6)}, 0.0, 1.0);
vPlugOverheatViewNormal = normalize(normalMatrix * objectNormal);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uPlugOverheatAmount;
uniform float uPlugOverheatTurns;
uniform float uPlugOverheatTime;
uniform float uPlugOverheatReveal;
uniform float uPlugOverheatPathScale;
varying float vPlugOverheatProgress;
varying vec3 vPlugOverheatViewNormal;`,
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `vec4 diffuseColor = vec4( diffuse, opacity );
vec3 plugHeatEmission = vec3(0.0);
if (uPlugOverheatAmount > 0.001) {
  float plugHeatUrgency = 1.0 - step(1.5, uPlugOverheatTurns);
  float plugHeatSpeed = mix(0.72, 0.92, plugHeatUrgency);
  float plugHeatPath = 1.0 + vPlugOverheatProgress * uPlugOverheatPathScale;
  float plugHeatPhase = fract(plugHeatPath * 2.65 - uPlugOverheatTime * plugHeatSpeed);
  float plugHeatBandA = 1.0 - smoothstep(0.055, 0.16, abs(plugHeatPhase - 0.18));
  float plugHeatBandB = 1.0 - smoothstep(0.045, 0.135, abs(plugHeatPhase - 0.62));
  float plugHeatBand = max(plugHeatBandA, plugHeatBandB);
  float plugHeatCoreA = 1.0 - smoothstep(0.018, 0.052, abs(plugHeatPhase - 0.18));
  float plugHeatCoreB = 1.0 - smoothstep(0.016, 0.046, abs(plugHeatPhase - 0.62));
  float plugHeatCore = max(plugHeatCoreA, plugHeatCoreB);
  float plugHeatRim = pow(clamp(1.0 - abs(vPlugOverheatViewNormal.z), 0.0, 1.0), 2.2);
  float plugHeatBreath = 0.82 + sin(uPlugOverheatTime * mix(3.4, 5.1, plugHeatUrgency)) * 0.18;
  float plugHeatReveal = smoothstep(0.0, 0.12, uPlugOverheatReveal);
  float plugHeatCoverage = uPlugOverheatAmount * plugHeatReveal * clamp(
    0.1 + plugHeatBand * 0.9 + plugHeatRim * 0.12,
    0.0,
    1.0
  );
  vec3 plugHeatColor = mix(vec3(1.0, 0.42, 0.055), vec3(1.0, 0.08, 0.025), plugHeatUrgency);
  vec3 plugHeatCoreColor = mix(vec3(1.0, 0.91, 0.48), vec3(1.0, 0.48, 0.16), plugHeatUrgency);
  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    plugHeatColor,
    plugHeatCoverage * (0.38 + plugHeatBreath * 0.22)
  );
  plugHeatEmission = plugHeatColor * uPlugOverheatAmount * plugHeatReveal * plugHeatBreath
    * (plugHeatBand * 0.82 + plugHeatRim * 0.08);
  plugHeatEmission += plugHeatCoreColor * uPlugOverheatAmount * plugHeatReveal
    * plugHeatCore * 0.82;
}`,
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
      `vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
outgoingLight += plugHeatEmission;`,
    );
  };
  material.customProgramCacheKey = () => `${previousProgramCacheKey()}-plug-overheat-flow-v1`;
}

function terminalMesh(
  styleId: PlugStyleId,
  pinMaterial: THREE.Material,
  darkMaterial: THREE.Material,
): THREE.Group {
  const terminal = new THREE.Group();
  terminal.name = 'plug-terminal-assembly';
  terminal.userData.partId = 'terminal-assembly';
  terminal.userData.plugStyleId = styleId;

  type TerminalPart = {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
    name: string;
    castShadow: boolean;
  };
  const parts: TerminalPart[] = [];
  const add = (
    geometry: THREE.BufferGeometry,
    material = pinMaterial,
    name = 'contact',
    castShadow = true,
  ) => {
    parts.push({ geometry, material, name, castShadow });
  };

  if (styleId === 'round-two-pin') {
    for (const x of [-0.075, 0.075]) {
      add(
        new THREE.CylinderGeometry(PLUG_PIN_RADIUS, PLUG_PIN_RADIUS, PLUG_PIN_TOP - PLUG_PIN_BOTTOM, 10)
          .translate(x, (PLUG_PIN_TOP + PLUG_PIN_BOTTOM) * 0.5, 0),
      );
    }
  } else if (styleId === 'usb-c') {
    add(
      new RoundedBoxGeometry(0.225, 0.115, 0.11, 2, 0.045).translate(0, 0.555, 0),
      pinMaterial,
      'type-c-shell',
    );
    add(
      new RoundedBoxGeometry(0.148, 0.04, 0.052, 2, 0.022).translate(0, 0.616, 0),
      darkMaterial,
      'type-c-slot',
    );
  } else if (styleId === 'flat-two-blade') {
    for (const x of [-0.068, 0.068]) {
      add(new THREE.BoxGeometry(0.045, 0.17, 0.092).translate(x, 0.555, 0), pinMaterial, 'blade');
    }
  } else if (styleId === 'three-pin') {
    for (const [x, z, length] of [
      [-0.078, -0.045, 0.145],
      [0.078, -0.045, 0.145],
      [0, 0.082, 0.17],
    ] as const) {
      add(
        new THREE.CylinderGeometry(0.031, 0.031, length, 12).translate(x, 0.47 + length * 0.5, z),
        pinMaterial,
        'pin',
      );
    }
  } else if (styleId === 'grounded-round') {
    for (const x of [-0.073, 0.073]) {
      add(
        new THREE.CylinderGeometry(0.033, 0.033, 0.15, 12).translate(x, 0.55, -0.028),
        pinMaterial,
        'main-pin',
      );
    }
    add(
      new THREE.CylinderGeometry(0.026, 0.026, 0.115, 12).translate(0, 0.5275, 0.09),
      pinMaterial,
      'earth-pin',
    );
  } else if (styleId === 'dc-barrel') {
    add(
      new THREE.CylinderGeometry(0.092, 0.1, 0.145, 12).translate(0, 0.545, 0),
      pinMaterial,
      'barrel',
    );
    add(
      new THREE.CylinderGeometry(0.047, 0.047, 0.012, 12).translate(0, 0.623, 0),
      darkMaterial,
      'hole',
      false,
    );
  } else {
    add(
      new THREE.CylinderGeometry(0.155, 0.16, 0.07, 12).translate(0, 0.515, 0),
      darkMaterial,
      'magnetic-face',
    );
    for (const x of [-0.075, 0, 0.075]) {
      add(
        new THREE.CylinderGeometry(0.031, 0.031, 0.052, 12).translate(x, 0.576, 0),
        pinMaterial,
        'pogo-contact',
      );
    }
  }

  const partsByMaterial = new Map<THREE.Material, TerminalPart[]>();
  parts.forEach((part) => {
    const materialParts = partsByMaterial.get(part.material);
    if (materialParts) materialParts.push(part);
    else partsByMaterial.set(part.material, [part]);
  });
  partsByMaterial.forEach((materialParts, material) => {
    let geometry: THREE.BufferGeometry;
    if (materialParts.length === 1) {
      geometry = materialParts[0].geometry;
    } else {
      const sourceGeometries = materialParts.map((part) => part.geometry);
      const mergedGeometry = mergeGeometries(sourceGeometries, false);
      sourceGeometries.forEach((source) => source.dispose());
      if (!mergedGeometry) throw new Error(`Unable to merge terminal geometry for ${styleId}`);
      geometry = mergedGeometry;
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = materialParts.length === 1
      ? `${styleId}-${materialParts[0].name}`
      : `${styleId}-${materialParts.map((part) => part.name).join('-')}-batch`;
    mesh.castShadow = materialParts.some((part) => part.castShadow);
    mesh.userData.partId = 'terminal-assembly';
    mesh.userData.plugStyleId = styleId;
    terminal.add(mesh);
  });

  return terminal;
}

export function createPlugHead(
  color: THREE.ColorRepresentation,
  scale = 1,
  energized = false,
  styleId: PlugStyleId = 'round-two-pin',
): PlugHead {
  const root = new THREE.Group();
  root.name = `plug-head-${styleId}`;
  root.userData.plugStyleId = styleId;

  const lineColor = new THREE.Color(color);
  const shellColor = lineColor.clone().lerp(new THREE.Color(PAL.paper), 0.09);
  const faceColor = lineColor.clone().lerp(new THREE.Color(PAL.paper), 0.17);
  const sleeveColor = lineColor.clone().multiplyScalar(0.87);
  const pinColor = new THREE.Color(0xa7a0ad);
  const darkColor = new THREE.Color(0x554d63);
  const inactiveIndicatorColor = new THREE.Color(0x625a70);
  const shellMaterial = tagMaterial(
    cel({ color: shellColor, bands: 3, tint: 0x6c5f8c, flatShading: true }),
    'plug-shell-toon',
    'outer-shell',
  );
  const faceMaterial = tagMaterial(
    cel({ color: faceColor, bands: 3, tint: 0x716581, flatShading: true }),
    'plug-face-toon',
    'front-shoulder',
  );
  const sleeveMaterial = tagMaterial(
    cel({ color: sleeveColor, bands: 3, tint: 0x61566f, flatShading: true }),
    'plug-rubber-toon',
    'strain-relief',
  );
  const pinMaterial = tagMaterial(
    cel({ color: pinColor, bands: 3, tint: 0x554c64, flatShading: true }),
    'plug-metal-toon',
    'terminal-metal',
  );
  const darkMaterial = tagMaterial(
    cel({ color: darkColor, bands: 2, tint: 0x443c52, flatShading: true }),
    'plug-cavity-toon',
    'interface-cavity',
  );
  const indicatorMaterial = tagMaterial(cel({
    color: energized ? PAL.blossomLight : 0x625a70,
    bands: 2,
    tint: 0x4d455c,
    emissive: lineColor,
    emissiveIntensity: energized ? 1 : 0.16,
  }), 'plug-indicator-toon', 'status-indicator');
  const overheatUniforms: PlugOverheatUniforms = {
    amount: { value: 0 },
    turns: { value: 2 },
    time: { value: 0 },
    reveal: { value: 0 },
    pathScale: { value: 0 },
  };
  const overheatMaterials = [shellMaterial, faceMaterial, sleeveMaterial, pinMaterial, darkMaterial];
  overheatMaterials.forEach((material) => installPlugOverheatShader(material, overheatUniforms));
  let skillTintColor: THREE.Color | null = null;
  let skillTintStrength = 0;
  let skillTintEmissionScale = 1;
  let skillGlowStrength = 0;
  let frozenAmount = 0;
  let isHovered = false;
  let recycleSelectionState: 'none' | 'hover' | 'selected' = 'none';
  let recycleSelectionPulse = 0;
  const hoverLight = new THREE.Color(PAL.blossomLight);
  const recycleHoverColor = new THREE.Color(0x5ff2cf);
  const recycleSelectedColor = new THREE.Color(0xffdf72);

  const recycleSelectionColor = (): THREE.Color | null => {
    if (recycleSelectionState === 'hover') return recycleHoverColor;
    if (recycleSelectionState === 'selected') return recycleSelectedColor;
    return null;
  };

  const tinted = (base: THREE.Color, includeSkillTint = true): THREE.Color => {
    const result = base.clone();
    if (includeSkillTint && skillTintColor) result.lerp(skillTintColor, skillTintStrength);
    if (frozenAmount > 0) {
      const terminal = base === pinColor || base === darkColor;
      result.lerp(
        new THREE.Color(REFRIGERATOR_FREEZE_COLOR),
        frozenAmount * (terminal ? 0.84 : 0.9),
      );
    }
    const selectionColor = recycleSelectionColor();
    if (selectionColor) {
      result.lerp(selectionColor, recycleSelectionState === 'selected' ? 0.56 : 0.38);
    }
    return result;
  };

  const refreshColor = (): void => {
    shellMaterial.color.copy(tinted(shellColor));
    faceMaterial.color.copy(tinted(faceColor));
    sleeveMaterial.color.copy(tinted(sleeveColor));
    pinMaterial.color.copy(tinted(pinColor, false));
    darkMaterial.color.copy(tinted(darkColor, false));
    const selectionColor = recycleSelectionColor();
    if (isHovered && !selectionColor) {
      shellMaterial.color.lerp(hoverLight, 0.2);
    }
    const indicatorBase = isHovered || energized
      ? new THREE.Color(PAL.blossomLight)
      : inactiveIndicatorColor;
    indicatorMaterial.color.copy(tinted(indicatorBase));

    const coloredMaterials: readonly [THREE.MeshToonMaterial, THREE.Color, boolean][] = [
      [shellMaterial, shellColor, true],
      [faceMaterial, faceColor, true],
      [sleeveMaterial, sleeveColor, true],
      [pinMaterial, pinColor, false],
      [darkMaterial, darkColor, false],
    ];
    for (const [material, base, includeSkillTint] of coloredMaterials) {
      if (selectionColor) {
        material.emissive.copy(selectionColor);
        material.emissiveIntensity = recycleSelectionState === 'selected'
          ? 0.32 + recycleSelectionPulse * 0.18
          : 0.14 + recycleSelectionPulse * 0.08;
      } else if (skillGlowStrength > 0) {
        material.emissive.copy(base);
        material.emissiveIntensity = 0.5 + skillGlowStrength * 0.72;
      } else if (skillTintColor && includeSkillTint) {
        material.emissive.copy(skillTintColor);
        material.emissiveIntensity = 0.22 * skillTintEmissionScale;
      } else if (frozenAmount > 0) {
        material.emissive.set(0x86bdd1);
        material.emissiveIntensity = frozenAmount * 0.045;
      } else {
        material.emissive.set(0x000000);
        material.emissiveIntensity = 1;
      }
    }
    indicatorMaterial.emissive.copy(
      selectionColor
        ?? (skillGlowStrength > 0 ? lineColor : skillTintColor)
        ?? (frozenAmount > 0 ? new THREE.Color(0xbceeff) : lineColor),
    );
    indicatorMaterial.emissiveIntensity = selectionColor
      ? 0.46 + recycleSelectionPulse * 0.22
      : skillGlowStrength > 0
      ? 0.78 + skillGlowStrength * 0.72
      : skillTintColor
        ? 0.42 * skillTintEmissionScale
        : frozenAmount > 0
          ? 0.3 + frozenAmount * 0.36
        : isHovered
          ? 0.92
          : energized
            ? 1
            : 0.16;
  };

  const assembly = tagPart(new THREE.Group(), 'plug-assembly', styleId);
  assembly.name = 'plug-assembly';

  const bodyRadius = styleId === 'three-pin' ? PLUG_BODY_RADIUS : styleId === 'usb-c' ? 0.168 : 0.174;
  const radialScale = bodyRadius / PLUG_BODY_RADIUS;
  const shellGeometry = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.16 * radialScale, 0.164),
      new THREE.Vector2(0.176 * radialScale, 0.188),
      new THREE.Vector2(PLUG_BODY_RADIUS * radialScale, 0.216),
      new THREE.Vector2(PLUG_BODY_RADIUS * radialScale, 0.398),
      new THREE.Vector2(0.176 * radialScale, 0.422),
      new THREE.Vector2(0.164 * radialScale, 0.44),
    ],
    12,
  );
  shellGeometry.computeVertexNormals();
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  shell.name = 'plug-outer-shell';
  shell.castShadow = true;
  shell.receiveShadow = true;
  tagPart(shell, 'outer-shell', styleId);
  addHullOutline(shell, 0.0033);

  const faceRadius = styleId === 'magnetic-pogo' ? 0.165 : bodyRadius * 0.9;
  const frontShoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(faceRadius, bodyRadius * 0.95, 0.04, 12).translate(0, 0.452, 0),
    faceMaterial,
  );
  frontShoulder.name = 'plug-front-shoulder';
  frontShoulder.castShadow = true;
  tagPart(frontShoulder, 'front-shoulder', styleId);
  addHullOutline(frontShoulder, 0.0023);

  const faceBaseGeometry: THREE.BufferGeometry = new THREE.CylinderGeometry(
    faceRadius * 0.94,
    faceRadius,
    0.026,
    12,
  ).translate(0, 0.477, 0);
  const face = new THREE.Mesh(faceBaseGeometry, darkMaterial);
  face.name = 'plug-interface-faceplate';
  face.castShadow = true;
  tagPart(face, 'interface-faceplate', styleId);

  const sleeve = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.105, 0.004),
        new THREE.Vector2(0.108, 0.026),
        new THREE.Vector2(0.114, 0.037),
        new THREE.Vector2(0.11, 0.048),
        new THREE.Vector2(0.121, 0.06),
        new THREE.Vector2(0.117, 0.073),
        new THREE.Vector2(0.129, 0.087),
        new THREE.Vector2(0.124, 0.101),
        new THREE.Vector2(0.137, 0.119),
        new THREE.Vector2(0.145, 0.14),
        new THREE.Vector2(0.15, 0.16),
      ],
      12,
    ),
    sleeveMaterial,
  );
  sleeve.name = 'plug-strain-relief';
  sleeve.castShadow = true;
  tagPart(sleeve, 'strain-relief', styleId);
  const sleeveOutline = addHullOutline(sleeve, 0.00245);

  const rearNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.162 * radialScale, 0.145, 0.052, 12).translate(0, 0.158, 0),
    sleeveMaterial,
  );
  rearNeck.name = 'plug-rear-neck';
  rearNeck.castShadow = true;
  tagPart(rearNeck, 'rear-neck', styleId);
  const sleeveGeometryState = captureRadialGeometry(sleeve.geometry);
  const sleeveOutlineGeometryState = captureRadialGeometry(sleeveOutline.geometry);
  const rearNeckGeometryState = captureRadialGeometry(rearNeck.geometry);
  let cableJointThicknessScale = 1;
  const setCableJointThickness = (nextScale = 1) => {
    cableJointThicknessScale = THREE.MathUtils.clamp(nextScale, 1, 2.4);
    const sleeveWeight = (y: number) => (
      0.18 + 0.82 * (1 - THREE.MathUtils.smoothstep(y, 0.004, 0.16))
    );
    const rearNeckWeight = (y: number) => (
      0.18 * (1 - THREE.MathUtils.smoothstep(y, 0.132, 0.184))
    );
    applyRadialGeometryScale(sleeveGeometryState, cableJointThicknessScale, sleeveWeight);
    applyRadialGeometryScale(sleeveOutlineGeometryState, cableJointThicknessScale, sleeveWeight);
    applyRadialGeometryScale(rearNeckGeometryState, cableJointThicknessScale, rearNeckWeight);
  };

  const indicatorFacetRadius = bodyRadius * Math.cos(Math.PI / 12);
  const indicatorRecess = new THREE.Mesh(new THREE.CircleGeometry(0.023, 10), darkMaterial);
  indicatorRecess.name = 'plug-status-recess';
  indicatorRecess.rotation.y = Math.PI * 0.5;
  indicatorRecess.position.set(indicatorFacetRadius + 0.0003, 0.34, 0);
  tagPart(indicatorRecess, 'status-indicator', styleId);

  const faceIceGeometry = faceBaseGeometry.clone();
  indicatorRecess.updateMatrix();
  const recessGeometry = indicatorRecess.geometry.clone().applyMatrix4(indicatorRecess.matrix);
  const mergedFaceGeometry = mergeGeometries([face.geometry, recessGeometry], false);
  recessGeometry.dispose();
  face.geometry.dispose();
  if (!mergedFaceGeometry) throw new Error(`Unable to merge plug faceplate geometry for ${styleId}`);
  mergedFaceGeometry.computeBoundingBox();
  mergedFaceGeometry.computeBoundingSphere();
  face.geometry = mergedFaceGeometry;
  indicatorRecess.visible = false;

  const indicator = new THREE.Mesh(new THREE.CircleGeometry(0.015, 8), indicatorMaterial);
  indicator.name = 'plug-status-indicator';
  indicator.rotation.y = Math.PI * 0.5;
  indicator.position.set(indicatorFacetRadius + 0.0008, 0.34, 0);

  // This invisible capsule-like proxy closes the small interaction gap where
  // the visible cable enters the plug strain relief. It is intentionally
  // wider than the sculpted rubber neck, but remains inside the established
  // plug envelope and never contributes pixels or depth.
  const jointPickMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  });
  const jointPick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.172, PLUG_HEAD_ENVELOPE.maxRadius, 0.22, 10),
    jointPickMaterial,
  );
  jointPick.name = 'plug-cable-joint-pick';
  jointPick.position.y = 0.11;

  // A pair of thin faceted rings gives the selected end a precise SAKURA
  // focus mark. Day mode reads as a pale paper/yellow cue; night mode warms
  // into a small lantern-like rim without turning the plug solid white.
  const hoverFocus = new THREE.Group();
  hoverFocus.name = 'plug-hover-focus';
  hoverFocus.position.y = 0.555;
  hoverFocus.visible = false;
  const hoverInnerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe9a3,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const hoverOuterMaterial = hoverInnerMaterial.clone();
  const hoverInner = new THREE.Mesh(new THREE.TorusGeometry(bodyRadius * 0.78, 0.012, 4, 12), hoverInnerMaterial);
  const hoverOuter = new THREE.Mesh(new THREE.TorusGeometry(bodyRadius * 0.93, 0.007, 4, 12), hoverOuterMaterial);
  hoverInner.rotation.x = Math.PI * 0.5;
  hoverOuter.rotation.x = Math.PI * 0.5;
  hoverInner.renderOrder = 9;
  hoverOuter.renderOrder = 9;
  hoverFocus.add(hoverInner, hoverOuter);

  const refreshFocus = (): void => {
    const selectionColor = recycleSelectionColor();
    const visible = isHovered || selectionColor !== null;
    hoverFocus.visible = visible;
    if (!visible) {
      hoverInnerMaterial.opacity = 0;
      hoverOuterMaterial.opacity = 0;
      hoverFocus.scale.setScalar(1);
      return;
    }
    const focusColor = selectionColor ?? hoverLight;
    hoverInnerMaterial.color.copy(focusColor);
    hoverOuterMaterial.color.copy(focusColor);
    if (recycleSelectionState === 'selected') {
      hoverInnerMaterial.opacity = 0.66;
      hoverOuterMaterial.opacity = 0.34;
      hoverFocus.scale.setScalar(1.06 + recycleSelectionPulse * 0.05);
      return;
    }
    if (recycleSelectionState === 'hover') {
      hoverInnerMaterial.opacity = 0.54;
      hoverOuterMaterial.opacity = 0.24;
      hoverFocus.scale.setScalar(1.02 + recycleSelectionPulse * 0.025);
      return;
    }
    hoverInnerMaterial.opacity = 0.72;
    hoverOuterMaterial.opacity = 0.32;
    hoverFocus.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.035);
  };
  tagPart(indicator, 'status-indicator', styleId);
  const indicatorGroup = tagPart(new THREE.Group(), 'status-indicator', styleId);
  indicatorGroup.name = 'plug-status-indicator-node';
  indicatorGroup.add(indicatorRecess, indicator);

  const terminal = terminalMesh(styleId, pinMaterial, darkMaterial);
  const frozenShell = new THREE.Group();
  frozenShell.name = 'plug-frozen-shell';
  frozenShell.visible = false;
  frozenShell.userData.iceShell = true;
  frozenShell.scale.setScalar(1.095);
  let frozenGeometryEnabled = false;
  let frozenShellMaterial: THREE.MeshPhysicalMaterial | null = null;

  const ensureFrozenShellGeometry = () => {
    if (frozenShell.children.length > 0) return;
    frozenShellMaterial = new THREE.MeshPhysicalMaterial({
      name: 'sakura-plug-refrigerator-ice-shell',
      color: REFRIGERATOR_ICE_COLOR,
      emissive: 0x254f61,
      emissiveIntensity: 0.025,
      roughness: 0.58,
      metalness: 0,
      clearcoat: 0.42,
      clearcoatRoughness: 0.34,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    frozenShellMaterial.userData.materialRole = 'plug-refrigerator-ice-shell';

    [sleeve, rearNeck, shell, frontShoulder, face].forEach((source) => {
      const sourceGeometry = source === face ? faceIceGeometry : source.geometry;
      const icePart = new THREE.Mesh(sourceGeometry, frozenShellMaterial!);
      icePart.name = `ice-${source.name}`;
      icePart.position.copy(source.position);
      icePart.quaternion.copy(source.quaternion);
      icePart.scale.copy(source.scale);
      icePart.renderOrder = 5;
      icePart.userData.iceShell = true;
      const iceOutline = addHullOutline(icePart, 0.0054, PAL.ink);
      iceOutline.userData.iceShellOutline = true;
      frozenShell.add(icePart);
    });

    const terminalIce = terminal.clone(true);
    terminalIce.name = 'ice-terminal-assembly';
    const outlineNodes: THREE.Object3D[] = [];
    const terminalIceMeshes: THREE.Mesh[] = [];
    terminalIce.traverse((object) => {
      if (object.userData.isOutline === true) {
        outlineNodes.push(object);
        return;
      }
      if (!(object instanceof THREE.Mesh)) return;
      object.material = frozenShellMaterial!;
      object.renderOrder = 5;
      object.userData.iceShell = true;
      terminalIceMeshes.push(object);
    });
    outlineNodes.forEach((object) => object.removeFromParent());
    terminalIceMeshes.forEach((iceMesh) => {
      const iceOutline = addHullOutline(iceMesh, 0.0048, PAL.ink);
      iceOutline.userData.iceShellOutline = true;
    });
    frozenShell.add(terminalIce);
  };

  const refreshFrozenShell = () => {
    const visible = frozenGeometryEnabled && frozenAmount > 0.01;
    frozenShell.visible = visible;
    frozenShell.userData.amount = visible ? frozenAmount : 0;
    if (frozenShellMaterial) {
      frozenShellMaterial.opacity = visible ? REFRIGERATOR_ICE_OPACITY * frozenAmount : 0;
    }
  };
  const cableSocket = new THREE.Object3D();
  cableSocket.name = 'plug-cable-socket';
  cableSocket.userData.socket = true;
  const terminalSocket = new THREE.Object3D();
  terminalSocket.name = 'plug-terminal-socket';
  terminalSocket.position.y = PLUG_PIN_BOTTOM;
  terminalSocket.userData.socket = true;
  const indicatorSocket = new THREE.Object3D();
  indicatorSocket.name = 'plug-indicator-socket';
  indicatorSocket.position.copy(indicator.position);
  indicatorSocket.userData.socket = true;

  assembly.add(
    cableSocket,
    terminalSocket,
    indicatorSocket,
    sleeve,
    rearNeck,
    shell,
    frontShoulder,
    face,
    terminal,
    indicatorGroup,
    frozenShell,
    jointPick,
    hoverFocus,
  );
  root.add(assembly);
  root.userData.sculptRuntime = {
    nodes: {
      root,
      'plug-assembly': assembly,
      'strain-relief': sleeve,
      'rear-neck': rearNeck,
      'outer-shell': shell,
      'front-shoulder': frontShoulder,
      'interface-faceplate': face,
      'terminal-assembly': terminal,
      'status-indicator': indicatorGroup,
    },
    sockets: {
      'cable-socket': cableSocket,
      'terminal-socket': terminalSocket,
      'indicator-socket': indicatorSocket,
    },
    colliders: [
      {
        id: `${styleId}-plug-envelope`,
        type: 'capsule',
        node: root.name,
        radius: PLUG_HEAD_ENVELOPE.maxRadius,
        length: PLUG_HEAD_ENVELOPE.maxLength,
        trigger: true,
      },
    ],
    destructionGroups: [
      ['plug-strain-relief', 'plug-rear-neck'],
      ['plug-outer-shell', 'plug-front-shoulder', 'plug-interface-faceplate'],
      [terminal.name],
      ['plug-status-recess', 'plug-status-indicator'],
    ],
  };
  root.scale.setScalar(scale);
  const pickMeshes: THREE.Mesh[] = [];
  for (const object of [jointPick, sleeve, rearNeck, shell, frontShoulder, face]) pickMeshes.push(object);
  terminal.traverse((object) => {
    if (object instanceof THREE.Mesh) pickMeshes.push(object);
  });

  const reset = () => {
    skillTintColor = null;
    skillTintStrength = 0;
    skillTintEmissionScale = 1;
    skillGlowStrength = 0;
    overheatUniforms.amount.value = 0;
    overheatUniforms.turns.value = 2;
    overheatUniforms.time.value = 0;
    overheatUniforms.reveal.value = 0;
    overheatUniforms.pathScale.value = 0;
    frozenAmount = 0;
    isHovered = false;
    recycleSelectionState = 'none';
    recycleSelectionPulse = 0;
    refreshColor();
    refreshFrozenShell();
    refreshFocus();
  };

  return {
    root,
    shell,
    frozenShell,
    pickMeshes,
    styleId,
    setCableJointThickness,
    get cableJointThicknessScale() {
      return cableJointThicknessScale;
    },
    setHovered(hovered, nightProgress = 0) {
      // Keep hover feedback layered on top of any active skill tint.
      isHovered = hovered;
      void nightProgress;
      refreshColor();
      refreshFocus();
    },
    setRecycleSelectionState(state, pulse = 0) {
      recycleSelectionState = state;
      recycleSelectionPulse = Math.max(0, Math.min(1, pulse));
      refreshColor();
      refreshFocus();
    },
    setSkillTint(color, strength = 0.42, emissionScale = 1) {
      skillTintColor = color === null ? null : new THREE.Color(color);
      skillTintStrength = color === null ? 0 : Math.max(0, Math.min(1, strength));
      skillTintEmissionScale = color === null ? 1 : Math.max(0, Math.min(1, emissionScale));
      refreshColor();
    },
    setSkillGlow(strength = 0) {
      skillGlowStrength = Math.max(0, Math.min(1, strength));
      refreshColor();
    },
    setOverheated(amount = 0, turnsRemaining = 2, elapsed = 0, reveal = 1, cableLength = PLUG_HEAD_MAX_LENGTH) {
      overheatUniforms.amount.value = Math.max(0, Math.min(1, amount));
      overheatUniforms.turns.value = Math.max(1, turnsRemaining);
      overheatUniforms.time.value = Math.max(0, elapsed);
      overheatUniforms.reveal.value = Math.max(0, Math.min(1, reveal));
      overheatUniforms.pathScale.value = PLUG_HEAD_MAX_LENGTH / Math.max(PLUG_HEAD_MAX_LENGTH, cableLength);
    },
    get overheatVisualState() {
      return {
        amount: overheatUniforms.amount.value,
        reveal: overheatUniforms.reveal.value,
        materialCount: overheatMaterials.length,
        pathScale: overheatUniforms.pathScale.value,
      };
    },
    setFrozenGeometryEnabled(enabled) {
      frozenGeometryEnabled = enabled;
      if (enabled) ensureFrozenShellGeometry();
      refreshFrozenShell();
    },
    setFrozen(amount = 0) {
      frozenAmount = Math.max(0, Math.min(1, amount));
      refreshColor();
      refreshFrozenShell();
      const ink = new THREE.Color(PAL.ink);
      const frozenInk = new THREE.Color(0x405d70);
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || object.userData.isOutline !== true) return;
        if (!(object.material instanceof THREE.ShaderMaterial)) return;
        const color = object.material.uniforms.uColor?.value;
        if (color instanceof THREE.Color) color.copy(ink).lerp(frozenInk, frozenAmount * 0.58);
      });
    },
    setBlockedFlash(amount) {
      shellMaterial.emissive.set(PAL.redDeep);
      shellMaterial.emissiveIntensity = amount * 0.72;
    },
    reset,
    dispose() {
      root.removeFromParent();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const entries = Array.isArray(object.material) ? object.material : [object.material];
        entries.forEach((material) => materials.add(material));
      });
      geometries.add(faceIceGeometry);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}

export function measurePlugStyle(styleId: PlugStyleId): THREE.Box3 {
  const head = createPlugHead(0xffffff, 1, false, styleId);
  head.root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(head.root);
  head.dispose();
  return bounds;
}
