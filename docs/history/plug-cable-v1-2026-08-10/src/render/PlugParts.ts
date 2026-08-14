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
  styleId: PlugStyleId;
  setHovered: (hovered: boolean) => void;
  setBlockedFlash: (amount: number) => void;
  reset: () => void;
  dispose: () => void;
};

function nonIndexed(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geometry.index) return geometry;
  const result = geometry.toNonIndexed();
  geometry.dispose();
  return result;
}

function merge(parts: THREE.BufferGeometry[], label: string): THREE.BufferGeometry {
  const compatible = parts.map(nonIndexed);
  const geometry = mergeGeometries(compatible, false);
  compatible.forEach((part) => part.dispose());
  if (!geometry) throw new Error(`Unable to build ${label} geometry.`);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function terminalMesh(
  styleId: PlugStyleId,
  pinMaterial: THREE.Material,
  darkMaterial: THREE.Material,
): THREE.Group {
  const terminal = new THREE.Group();
  terminal.name = `plug-terminal-${styleId}`;

  const add = (geometry: THREE.BufferGeometry, material = pinMaterial, name = 'contact') => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${styleId}-${name}`;
    mesh.castShadow = true;
    terminal.add(mesh);
  };

  if (styleId === 'round-two-pin') {
    for (const x of [-0.075, 0.075]) {
      add(
        new THREE.CylinderGeometry(PLUG_PIN_RADIUS, PLUG_PIN_RADIUS, PLUG_PIN_TOP - PLUG_PIN_BOTTOM, 14)
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
      new THREE.CylinderGeometry(0.092, 0.1, 0.145, 16).translate(0, 0.545, 0),
      pinMaterial,
      'barrel',
    );
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.012, 16), darkMaterial);
    socket.name = 'dc-barrel-hole';
    socket.position.y = 0.623;
    terminal.add(socket);
  } else {
    add(
      new THREE.CylinderGeometry(0.155, 0.16, 0.07, 18).translate(0, 0.515, 0),
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
  const shellMaterial = cel({ color: shellColor, bands: 3, tint: 0x6c5f8c });
  const faceMaterial = cel({ color: faceColor, bands: 3, tint: 0x716581 });
  const sleeveMaterial = cel({ color: sleeveColor, bands: 3, tint: 0x61566f });
  const pinMaterial = cel({ color: 0xa7a0ad, bands: 3, tint: 0x554c64 });
  const darkMaterial = cel({ color: 0x554d63, bands: 2, tint: 0x443c52 });
  const indicatorMaterial = cel({
    color: energized ? PAL.blossomLight : 0x625a70,
    bands: 2,
    tint: 0x4d455c,
    emissive: lineColor,
    emissiveIntensity: energized ? 1 : 0.16,
  });

  const bodyRadius = styleId === 'three-pin' ? PLUG_BODY_RADIUS : styleId === 'usb-c' ? 0.168 : 0.174;
  const shellGeometry = merge(
    [
      new THREE.CylinderGeometry(bodyRadius, bodyRadius, PLUG_BODY_TOP - PLUG_BODY_BOTTOM, 20)
        .translate(0, (PLUG_BODY_TOP + PLUG_BODY_BOTTOM) * 0.5, 0),
      new THREE.SphereGeometry(bodyRadius, 20, 8)
        .scale(1, 0.31, 1)
        .translate(0, PLUG_BODY_TOP, 0),
      new THREE.SphereGeometry(bodyRadius, 20, 8)
        .scale(1, 0.27, 1)
        .translate(0, PLUG_BODY_BOTTOM, 0),
    ],
    `${styleId} plug shell`,
  );
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  shell.name = 'plug-shell';
  shell.castShadow = true;
  shell.receiveShadow = true;
  shell.userData.plugStyleId = styleId;
  addHullOutline(shell, 0.0033);

  const faceRadius = styleId === 'magnetic-pogo' ? 0.165 : bodyRadius * 0.9;
  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(faceRadius * 0.94, faceRadius, 0.042, 20).translate(0, 0.48, 0),
    faceMaterial,
  );
  face.name = 'plug-face';
  face.castShadow = true;

  const sleeve = new THREE.Mesh(
    merge(
      [
        new THREE.CylinderGeometry(0.145, 0.105, 0.14, 12).translate(0, 0.07, 0),
        new THREE.CylinderGeometry(0.15, 0.15, 0.03, 12).translate(0, 0.145, 0),
        new THREE.CylinderGeometry(0.11, 0.11, 0.022, 12).translate(0, 0.014, 0),
      ],
      `${styleId} plug sleeve`,
    ),
    sleeveMaterial,
  );
  sleeve.name = 'plug-strain-relief';
  sleeve.castShadow = true;

  const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), indicatorMaterial);
  indicator.name = 'plug-status-light';
  indicator.position.set(bodyRadius * 0.7, 0.34, bodyRadius * 0.63);

  root.add(sleeve, shell, face, terminalMesh(styleId, pinMaterial, darkMaterial), indicator);
  root.scale.setScalar(scale);

  const reset = () => {
    shellMaterial.color.copy(shellColor);
    shellMaterial.emissive.set(0x000000);
    shellMaterial.emissiveIntensity = 1;
    indicatorMaterial.color.set(energized ? PAL.blossomLight : 0x625a70);
    indicatorMaterial.emissive.copy(lineColor);
    indicatorMaterial.emissiveIntensity = energized ? 1 : 0.16;
  };

  return {
    root,
    shell,
    styleId,
    setHovered(hovered) {
      shellMaterial.color.copy(shellColor).lerp(new THREE.Color(PAL.blossomLight), hovered ? 0.2 : 0);
      indicatorMaterial.color.set(hovered ? PAL.blossomLight : energized ? PAL.blossomLight : 0x625a70);
      indicatorMaterial.emissiveIntensity = hovered ? 0.92 : energized ? 1 : 0.16;
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
