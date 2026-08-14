import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
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
  pickMeshes: THREE.Mesh[];
  styleId: PlugStyleId;
  setHovered: (hovered: boolean, nightProgress?: number) => void;
  setSkillTint: (color: THREE.ColorRepresentation | null, strength?: number) => void;
  setBlockedFlash: (amount: number) => void;
  reset: () => void;
  dispose: () => void;
};

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

function terminalMesh(
  styleId: PlugStyleId,
  pinMaterial: THREE.Material,
  darkMaterial: THREE.Material,
): THREE.Group {
  const terminal = new THREE.Group();
  terminal.name = 'plug-terminal-assembly';
  terminal.userData.partId = 'terminal-assembly';
  terminal.userData.plugStyleId = styleId;

  const add = (geometry: THREE.BufferGeometry, material = pinMaterial, name = 'contact') => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${styleId}-${name}`;
    mesh.castShadow = true;
    mesh.userData.partId = 'terminal-assembly';
    mesh.userData.plugStyleId = styleId;
    terminal.add(mesh);
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
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.012, 12), darkMaterial);
    socket.name = 'dc-barrel-hole';
    socket.position.y = 0.623;
    socket.userData.partId = 'terminal-assembly';
    terminal.add(socket);
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
    cel({ color: 0xa7a0ad, bands: 3, tint: 0x554c64, flatShading: true }),
    'plug-metal-toon',
    'terminal-metal',
  );
  const darkMaterial = tagMaterial(
    cel({ color: 0x554d63, bands: 2, tint: 0x443c52, flatShading: true }),
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
  let skillTintColor: THREE.Color | null = null;
  let skillTintStrength = 0;
  let isHovered = false;
  const hoverLight = new THREE.Color(PAL.blossomLight);

  const tinted = (base: THREE.Color): THREE.Color => {
    const result = base.clone();
    if (skillTintColor) result.lerp(skillTintColor, skillTintStrength);
    return result;
  };

  const refreshColor = (): void => {
    shellMaterial.color.copy(tinted(shellColor));
    faceMaterial.color.copy(tinted(faceColor));
    sleeveMaterial.color.copy(tinted(sleeveColor));
    if (isHovered) {
      shellMaterial.color.lerp(hoverLight, 0.2);
    }
    indicatorMaterial.emissive.copy(skillTintColor ?? lineColor);
    shellMaterial.emissive.set(0x000000);
    shellMaterial.emissiveIntensity = 1;
    faceMaterial.emissive.set(0x000000);
    faceMaterial.emissiveIntensity = 1;
    sleeveMaterial.emissive.set(0x000000);
    sleeveMaterial.emissiveIntensity = 1;
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

  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(faceRadius * 0.94, faceRadius, 0.026, 12).translate(0, 0.477, 0),
    darkMaterial,
  );
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
  addHullOutline(sleeve, 0.00245);

  const rearNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.162 * radialScale, 0.145, 0.052, 12).translate(0, 0.158, 0),
    sleeveMaterial,
  );
  rearNeck.name = 'plug-rear-neck';
  rearNeck.castShadow = true;
  tagPart(rearNeck, 'rear-neck', styleId);

  const indicatorFacetRadius = bodyRadius * Math.cos(Math.PI / 12);
  const indicatorRecess = new THREE.Mesh(new THREE.CircleGeometry(0.023, 10), darkMaterial);
  indicatorRecess.name = 'plug-status-recess';
  indicatorRecess.rotation.y = Math.PI * 0.5;
  indicatorRecess.position.set(indicatorFacetRadius + 0.0003, 0.34, 0);
  tagPart(indicatorRecess, 'status-indicator', styleId);

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
  tagPart(indicator, 'status-indicator', styleId);
  const indicatorGroup = tagPart(new THREE.Group(), 'status-indicator', styleId);
  indicatorGroup.name = 'plug-status-indicator-node';
  indicatorGroup.add(indicatorRecess, indicator);

  const terminal = terminalMesh(styleId, pinMaterial, darkMaterial);
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
    isHovered = false;
    refreshColor();
    shellMaterial.emissive.set(0x000000);
    shellMaterial.emissiveIntensity = 1;
    indicatorMaterial.color.set(energized ? PAL.blossomLight : 0x625a70);
    indicatorMaterial.emissive.copy(lineColor);
    indicatorMaterial.emissiveIntensity = energized ? 1 : 0.16;
  };

  return {
    root,
    shell,
    pickMeshes,
    styleId,
    setHovered(hovered, nightProgress = 0) {
      // Keep hover feedback layered on top of any active skill tint.
      isHovered = hovered;
      void nightProgress;
      refreshColor();
      indicatorMaterial.color.set(hovered ? PAL.blossomLight : energized ? PAL.blossomLight : 0x625a70);
      indicatorMaterial.emissiveIntensity = hovered ? 0.92 : energized ? 1 : 0.16;
      hoverFocus.visible = hovered;
      const focusColor = new THREE.Color(PAL.blossomLight);
      hoverInnerMaterial.color.copy(focusColor);
      hoverOuterMaterial.color.copy(focusColor);
      hoverInnerMaterial.opacity = hovered ? 0.72 : 0;
      hoverOuterMaterial.opacity = hovered ? 0.32 : 0;
      const focusPulse = hovered ? 1 + Math.sin(performance.now() * 0.006) * 0.035 : 1;
      hoverFocus.scale.setScalar(focusPulse);
    },
    setSkillTint(color, strength = 0.42) {
      skillTintColor = color === null ? null : new THREE.Color(color);
      skillTintStrength = color === null ? 0 : Math.max(0, Math.min(1, strength));
      refreshColor();
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
