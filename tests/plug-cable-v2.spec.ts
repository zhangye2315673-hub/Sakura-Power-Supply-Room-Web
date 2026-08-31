import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import {
  CABLE_FILLET_MIN_RADIUS,
  CABLE_FILLET_RADIUS,
  CABLE_RADIAL_SEGMENTS,
  createRoundedCableGeometry,
  createRoundedCablePath,
} from '../src/render/CableGeometry';
import { PLUG_CABLE_SOCKET_OVERLAP, PlugCableModel } from '../src/render/PlugCableModel';
import {
  PLUG_HEAD_ENVELOPE,
  PLUG_STYLE_IDS,
  createPlugHead,
} from '../src/render/PlugParts';
import { LAMP_BEAM_FAR_TO_NEAR_RATIO } from '../src/appliances/performance/LampPerformance';
import type { ArrowDefinition } from '../src/puzzle/types';

function expectFiniteGeometry(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position');
  expect(position.count).toBeGreaterThan(0);
  let finite = true;
  for (let index = 0; index < position.count; index += 1) {
    finite &&= Number.isFinite(position.getX(index));
    finite &&= Number.isFinite(position.getY(index));
    finite &&= Number.isFinite(position.getZ(index));
  }
  expect(finite).toBe(true);
  expect(geometry.boundingBox).not.toBeNull();
  expect(geometry.boundingSphere).not.toBeNull();
}

test('rounded cable uses a bounded exact tangent quarter turn', () => {
  const result = createRoundedCablePath([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 1, 0),
  ]);
  expect(result.fillets).toHaveLength(1);
  const fillet = result.fillets[0];
  expect(fillet.applied).toBe(true);
  expect(fillet.radius).toBeCloseTo(CABLE_FILLET_RADIUS, 10);
  expect(fillet.tangentStart.toArray()).toEqual([0.87, 0, 0]);
  expect(fillet.tangentEnd.toArray()).toEqual([1, 0.13, 0]);
  expect(fillet.center?.toArray()).toEqual([0.87, 0.13, 0]);

  const firstLine = result.curve.curves[0];
  const arc = result.curve.curves[1];
  const finalLine = result.curve.curves[2];
  expect(firstLine.getTangent(1).dot(arc.getTangent(0))).toBeCloseTo(1, 8);
  expect(arc.getTangent(1).dot(finalLine.getTangent(0))).toBeCloseTo(1, 8);
  for (let sample = 0; sample <= 100; sample += 1) {
    const point = result.curve.getPoint(sample / 100);
    expect(point.x).toBeGreaterThanOrEqual(-1e-8);
    expect(point.x).toBeLessThanOrEqual(1 + 1e-8);
    expect(point.y).toBeGreaterThanOrEqual(-1e-8);
    expect(point.y).toBeLessThanOrEqual(1 + 1e-8);
  }
});

test('rounded cable clamps short legs and falls back below the minimum radius', () => {
  const result = createRoundedCablePath([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, 0, 0),
    new THREE.Vector3(0.08, 0.08, 0),
  ]);
  expect(result.fillets[0].radius).toBeLessThan(CABLE_FILLET_MIN_RADIUS);
  expect(result.fillets[0].applied).toBe(false);
  expect(result.curve.curves).toHaveLength(2);
});

test('cable tube is eight-sided, capped, finite, and repeatable', () => {
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0.5, 0),
    new THREE.Vector3(1.5, 0.5, 0),
  ];
  const first = createRoundedCableGeometry(points);
  const second = createRoundedCableGeometry(points);
  expect(CABLE_RADIAL_SEGMENTS).toBe(8);
  expect(first.fillets.filter((fillet) => fillet.applied)).toHaveLength(2);
  expectFiniteGeometry(first.geometry);
  expectFiniteGeometry(second.geometry);
  expect(first.geometry.getAttribute('position').count).toBe(second.geometry.getAttribute('position').count);
  expect(first.geometry.userData.cableFillets).toEqual(second.geometry.userData.cableFillets);
  first.geometry.dispose();
  second.geometry.dispose();
});

test('every plug publishes stable named parts and sockets inside the rotated envelope', () => {
  const requiredNodes = [
    'root',
    'plug-assembly',
    'strain-relief',
    'rear-neck',
    'outer-shell',
    'front-shoulder',
    'interface-faceplate',
    'terminal-assembly',
    'status-indicator',
  ];
  const requiredSockets = ['cable-socket', 'terminal-socket', 'indicator-socket'];

  for (const styleId of PLUG_STYLE_IDS) {
    const head = createPlugHead(0xe86b82, 1, false, styleId);
    const runtime = head.root.userData.sculptRuntime as {
      nodes: Record<string, THREE.Object3D>;
      sockets: Record<string, THREE.Object3D>;
      colliders: unknown[];
      destructionGroups: string[][];
    };
    expect(Object.keys(runtime.nodes).sort()).toEqual([...requiredNodes].sort());
    expect(Object.keys(runtime.sockets).sort()).toEqual([...requiredSockets].sort());
    expect(runtime.colliders).toHaveLength(1);
    expect(runtime.destructionGroups).toHaveLength(4);
    Object.values(runtime.nodes).forEach((node) => expect(node.name.length).toBeGreaterThan(0));
    Object.values(runtime.sockets).forEach((socket) => expect(socket.userData.socket).toBe(true));

    for (let step = 0; step < 16; step += 1) {
      head.root.rotation.y = (step / 16) * Math.PI * 2;
      head.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(head.root, true);
      expect(bounds.min.x).toBeGreaterThanOrEqual(-PLUG_HEAD_ENVELOPE.maxRadius - 1e-4);
      expect(bounds.max.x).toBeLessThanOrEqual(PLUG_HEAD_ENVELOPE.maxRadius + 1e-4);
      expect(bounds.min.z).toBeGreaterThanOrEqual(-PLUG_HEAD_ENVELOPE.maxRadius - 1e-4);
      expect(bounds.max.z).toBeLessThanOrEqual(PLUG_HEAD_ENVELOPE.maxRadius + 1e-4);
      expect(bounds.min.y).toBeGreaterThanOrEqual(-1e-4);
      expect(bounds.max.y).toBeLessThanOrEqual(PLUG_HEAD_ENVELOPE.maxLength + 1e-4);
    }
    head.dispose();
  }
});

test('plug terminals batch same-material contacts without losing picking or frozen geometry', () => {
  const expectedMeshCounts: Readonly<Record<(typeof PLUG_STYLE_IDS)[number], number>> = {
    'round-two-pin': 1,
    'usb-c': 2,
    'flat-two-blade': 1,
    'three-pin': 1,
    'grounded-round': 1,
    'dc-barrel': 2,
    'magnetic-pogo': 2,
  };

  for (const styleId of PLUG_STYLE_IDS) {
    const head = createPlugHead(0xe86b82, 1, false, styleId);
    const terminal = head.root.getObjectByName('plug-terminal-assembly') as THREE.Group;
    const terminalMeshes = terminal.children.filter(
      (child): child is THREE.Mesh => child instanceof THREE.Mesh,
    );

    expect(terminalMeshes).toHaveLength(expectedMeshCounts[styleId]);
    expect(new Set(terminalMeshes.map((mesh) => mesh.material)).size).toBe(terminalMeshes.length);
    expect(terminalMeshes.every((mesh) => head.pickMeshes.includes(mesh))).toBe(true);
    expect(terminalMeshes.every((mesh) => mesh.userData.partId === 'terminal-assembly')).toBe(true);
    expect(terminalMeshes.every((mesh) => mesh.userData.plugStyleId === styleId)).toBe(true);

    head.setFrozenGeometryEnabled(true);
    head.setFrozen(1);
    const frozenTerminal = head.frozenShell.getObjectByName('ice-terminal-assembly') as THREE.Group;
    const frozenTerminalMeshes = frozenTerminal.children.filter(
      (child): child is THREE.Mesh => child instanceof THREE.Mesh,
    );
    expect(frozenTerminalMeshes).toHaveLength(expectedMeshCounts[styleId]);
    expect(frozenTerminalMeshes.every((mesh) => mesh.userData.iceShell === true)).toBe(true);
    expect(frozenTerminalMeshes.every((mesh) => (
      mesh.children.some((child) => child.userData.iceShellOutline === true)
    ))).toBe(true);
    head.dispose();
  }
});

test('plug faceplate batches the fixed status recess without removing its semantic node', () => {
  const head = createPlugHead(0xe86b82, 1, false, 'round-two-pin');
  const face = head.root.getObjectByName('plug-interface-faceplate') as THREE.Mesh;
  const recess = head.root.getObjectByName('plug-status-recess') as THREE.Mesh;
  expect(recess).toBeDefined();
  expect(recess.visible).toBe(false);
  expect(face.geometry.getAttribute('position').count).toBeGreaterThan(30);
  expect((face.material as THREE.MeshToonMaterial).userData.materialRole).toBe('interface-cavity');
  head.setFrozenGeometryEnabled(true);
  const frozenFace = head.frozenShell.getObjectByName('ice-plug-interface-faceplate') as THREE.Mesh;
  expect(frozenFace).toBeDefined();
  expect(frozenFace.geometry.getAttribute('position').count).toBeLessThan(face.geometry.getAttribute('position').count);
  head.dispose();
});

test('plug interface cavity and electrical contacts keep fixed colors during skill tint', () => {
  for (const styleId of PLUG_STYLE_IDS) {
    const head = createPlugHead(0xe86b82, 1, false, styleId);
    const materials = new Map<string, THREE.MeshToonMaterial>();
    head.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      objectMaterials.forEach((material) => {
        const role = material.userData.materialRole as string | undefined;
        if (role && material instanceof THREE.MeshToonMaterial) materials.set(role, material);
      });
    });
    const shell = materials.get('outer-shell')!;
    const cavity = materials.get('interface-cavity')!;
    const terminal = materials.get('terminal-metal')!;
    const initialCavityColor = cavity.color.getHex();
    const initialTerminalColor = terminal.color.getHex();

    head.setSkillTint(0x4b79c9, 1, 0);

    expect(shell.color.getHex()).toBe(0x4b79c9);
    expect(cavity.color.getHex()).toBe(initialCavityColor);
    expect(terminal.color.getHex()).toBe(initialTerminalColor);
    expect(cavity.emissive.getHex()).toBe(0x000000);
    expect(terminal.emissive.getHex()).toBe(0x000000);
    head.dispose();
  }
});

test('static and double-ended cables survive repeated extraction rebuilds without NaN', () => {
  const base: ArrowDefinition = {
    id: 'plug-cable-v2-rebuild',
    path: [[5, 5, 5], [6, 5, 5], [6, 6, 5], [7, 6, 5]],
    exitDirection: '+X',
    color: 0xe86b82,
    lengthClass: 'medium',
  };

  for (const doubleEnded of [false, true]) {
    const model = new PlugCableModel({ ...base, id: `${base.id}-${doubleEnded}`, doubleEnded }, 'usb-c');
    for (const distance of [0, 0.01, 0.18, 0.64, 1.4, 2.8, 0]) {
      model.setMotionDistance(distance, distance > 1 ? 'tail' : 'head');
      const cable = model.root.getObjectByName(`${base.id}-${doubleEnded}-cable`) as THREE.Mesh;
      expect(cable).toBeTruthy();
      expectFiniteGeometry(cable.geometry);
    }
    const selectableParts = new Set(model.pickMeshes.map((mesh) => mesh.name));
    expect(selectableParts).toContain('plug-cable-joint-pick');
    expect(selectableParts).toContain('plug-strain-relief');
    expect(selectableParts).toContain('plug-rear-neck');
    expect(selectableParts).toContain('plug-outer-shell');
    expect(selectableParts).toContain('plug-front-shoulder');
    expect(model.pickMeshes.every((mesh) => mesh.userData.arrowId === model.definition.id)).toBe(true);
    if (doubleEnded) {
      expect(model.pickMeshes.some((mesh) => mesh.userData.cableEnd === 'head')).toBe(true);
      expect(model.pickMeshes.some((mesh) => mesh.userData.cableEnd === 'tail')).toBe(true);
    } else {
      expect(model.pickMeshes.some((mesh) => mesh.name.endsWith('-cable'))).toBe(true);
    }
    model.dispose();
    expect(model.pickMeshes).toHaveLength(0);
  }
});

test('cable geometry overlaps plug sockets instead of ending at a visible butt joint', () => {
  const definition: ArrowDefinition = {
    id: 'plug-cable-socket-overlap',
    path: [[5, 5, 5], [6, 5, 5]],
    exitDirection: '+X',
    color: 0xe86b82,
    lengthClass: 'short',
    doubleEnded: true,
  };
  const model = new PlugCableModel(definition, 'round-two-pin');
  const cable = model.root.getObjectByName(`${definition.id}-cable`) as THREE.Mesh;
  cable.geometry.computeBoundingBox();
  const bounds = cable.geometry.boundingBox!;
  const first = model.root.worldToLocal(model.getHeadWorldPosition(new THREE.Vector3(), 'tail'));
  const last = model.root.worldToLocal(model.getHeadWorldPosition(new THREE.Vector3(), 'head'));

  expect(bounds.min.x).toBeLessThan(first.x - PLUG_CABLE_SOCKET_OVERLAP * 0.9);
  expect(bounds.max.x).toBeGreaterThan(last.x + PLUG_CABLE_SOCKET_OVERLAP * 0.9);
  model.dispose();
});

test('rice thickness deforms the real cable and plug joint geometry without adding a shell', () => {
  const definition: ArrowDefinition = {
    id: 'plug-cable-real-thickness',
    path: [[5, 5, 5], [7, 5, 5]],
    exitDirection: '+X',
    color: 0xe86b82,
    lengthClass: 'medium',
    doubleEnded: true,
  };
  const model = new PlugCableModel(definition, 'round-two-pin');
  const cableName = `${definition.id}-cable`;
  const initialCable = model.root.getObjectByName(cableName) as THREE.Mesh;
  const initialCablePositions = Float32Array.from(
    initialCable.geometry.getAttribute('position').array as ArrayLike<number>,
  );
  initialCable.geometry.computeBoundingBox();
  const initialCableDiameter = initialCable.geometry.boundingBox!.max.y
    - initialCable.geometry.boundingBox!.min.y;
  const sleeves: THREE.Mesh[] = [];
  model.root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.name === 'plug-strain-relief') sleeves.push(object);
  });
  expect(sleeves).toHaveLength(2);
  const lowerJointRadius = (mesh: THREE.Mesh) => {
    const position = mesh.geometry.getAttribute('position');
    let radius = 0;
    for (let index = 0; index < position.count; index += 1) {
      if (position.getY(index) > 0.04) continue;
      radius = Math.max(radius, Math.hypot(position.getX(index), position.getZ(index)));
    }
    return radius;
  };
  const initialJointRadius = lowerJointRadius(sleeves[0]);

  model.setVisualThickness(1.5);
  const thickCable = model.root.getObjectByName(cableName) as THREE.Mesh;
  thickCable.geometry.computeBoundingBox();
  const thickCableDiameter = thickCable.geometry.boundingBox!.max.y
    - thickCable.geometry.boundingBox!.min.y;
  const thickCablePositions = thickCable.geometry.getAttribute('position');
  expect(thickCableDiameter).toBeGreaterThan(initialCableDiameter * 1.45);
  expect(Array.from(thickCablePositions.array as ArrayLike<number>)).not.toEqual(
    Array.from(initialCablePositions),
  );
  expect(thickCable.geometry.userData.visualThicknessScale).toBeCloseTo(1.5, 8);
  expect((model.material.userData.visualInflation as { value: number }).value).toBe(0);
  expect(lowerJointRadius(sleeves[0])).toBeGreaterThan(initialJointRadius * 1.45);
  expect(lowerJointRadius(sleeves[1])).toBeGreaterThan(initialJointRadius * 1.45);
  expect(model.root.getObjectByName(`${definition.id}-rice-thickness-shell`)).toBeUndefined();
  expect(model.skillVisualState.geometryThicknessScale).toBeCloseTo(1.5, 8);
  expect(model.skillVisualState.plugJointThicknessScale).toBeCloseTo(1.5, 8);

  model.setMotionDistance(0.48);
  const rebuiltCable = model.root.getObjectByName(cableName) as THREE.Mesh;
  expect(rebuiltCable.geometry.userData.visualThicknessScale).toBeCloseTo(1.5, 8);

  model.setVisualThickness(1);
  const restoredCable = model.root.getObjectByName(cableName) as THREE.Mesh;
  restoredCable.geometry.computeBoundingBox();
  const restoredCableDiameter = restoredCable.geometry.boundingBox!.max.y
    - restoredCable.geometry.boundingBox!.min.y;
  expect(restoredCableDiameter).toBeCloseTo(initialCableDiameter, 6);
  expect(lowerJointRadius(sleeves[0])).toBeCloseTo(initialJointRadius, 6);
  expect(model.skillVisualState.geometryThicknessScale).toBe(1);
  expect(model.skillVisualState.plugJointThicknessScale).toBe(1);
  model.dispose();
});
test('hover, blocked flash, prepare and reset keep the existing public interaction contract', () => {
  const definition: ArrowDefinition = {
    id: 'plug-cable-v2-states',
    path: [[5, 5, 5], [6, 5, 5]],
    exitDirection: '+X',
    color: 0x55a9a7,
    lengthClass: 'short',
  };
  const model = new PlugCableModel(definition, 'magnetic-pogo');
  const baseColor = model.material.color.clone();
  model.setHovered(true);
  expect(model.material.color.equals(baseColor)).toBe(false);
  expect(model.material.emissive.getHex()).not.toBe(0);
  model.setBlockedFlash(1);
  expect(model.material.emissive.getHex()).not.toBe(0);
  model.setPrepare(1);
  const head = model.root.getObjectByName('plug-head-magnetic-pogo')!;
  expect(head.scale.x).toBeGreaterThan(1);
  model.resetMaterial();
  expect(model.material.color.equals(baseColor)).toBe(true);
  expect(model.material.emissive.getHex()).toBe(0);
  expect(head.scale.toArray()).toEqual([1, 1, 1]);
  model.dispose();
});

test('skill tint updates the cable and every colored plug-head surface together', () => {
  const definition: ArrowDefinition = {
    id: 'plug-cable-skill-tint',
    path: [[5, 5, 5], [6, 5, 5]],
    exitDirection: '+X',
    color: 0x55a9a7,
    lengthClass: 'short',
  };
  const model = new PlugCableModel(definition, 'usb-c');
  const shell = model.root.getObjectByName('plug-outer-shell') as THREE.Mesh;
  const shoulder = model.root.getObjectByName('plug-front-shoulder') as THREE.Mesh;
  const sleeve = model.root.getObjectByName('plug-strain-relief') as THREE.Mesh;
  const rearNeck = model.root.getObjectByName('plug-rear-neck') as THREE.Mesh;
  const face = model.root.getObjectByName('plug-interface-faceplate') as THREE.Mesh;
  const indicator = model.root.getObjectByName('plug-status-indicator') as THREE.Mesh;
  const tailRing = model.root.getObjectByName('plug-cable-tail-ring') as THREE.Mesh;
  const tailCap = model.root.getObjectByName('plug-cable-tail-cap') as THREE.Mesh;
  const cable = model.root.getObjectByName(`${definition.id}-cable`) as THREE.Mesh;
  const terminalMeshes: THREE.Mesh[] = [];
  model.root.getObjectByName('plug-terminal-assembly')?.traverse((object) => {
    if (object instanceof THREE.Mesh) terminalMeshes.push(object);
  });
  const coloredParts = [
    cable, shell, shoulder, sleeve, rearNeck, face, indicator, tailRing, tailCap, ...terminalMeshes,
  ];
  const initial = coloredParts.map((mesh) => (mesh.material as THREE.MeshToonMaterial).color.clone());
  model.setSkillTint(0x4f2b23, 0.78);
  const tinted = coloredParts.map((mesh) => (mesh.material as THREE.MeshToonMaterial).color.clone());
  expect(tinted.some((color, index) => !color.equals(initial[index]))).toBe(true);
  expect(tinted.every((color, index) => !color.equals(initial[index]))).toBe(true);

  model.setHovered(true);
  model.setHovered(false);
  const afterHover = coloredParts.map((mesh) => (mesh.material as THREE.MeshToonMaterial).color.clone());
  expect(afterHover.every((color, index) => color.equals(tinted[index]))).toBe(true);

  model.setSkillTint(null);
  expect(coloredParts.every((mesh, index) => (
    mesh.material as THREE.MeshToonMaterial
  ).color.equals(initial[index]))).toBe(true);
  model.dispose();
});

test('lamp glow preserves line colors and lights the complete cable group with a fixed directional beam', () => {
  const definition: ArrowDefinition = {
    id: 'plug-cable-lamp-glow',
    path: [[5, 5, 5], [6, 5, 5]],
    exitDirection: '+X',
    color: 0x55a9a7,
    lengthClass: 'short',
  };
  const model = new PlugCableModel(definition, 'usb-c');
  const partNames = [
    `${definition.id}-cable`,
    'plug-strain-relief',
    'plug-rear-neck',
    'plug-outer-shell',
    'plug-front-shoulder',
    'plug-interface-faceplate',
    'plug-status-indicator',
    'plug-cable-tail-ring',
    'plug-cable-tail-cap',
  ];
  const visibleParts = partNames.map((name) => model.root.getObjectByName(name) as THREE.Mesh);
  model.root.getObjectByName('plug-terminal-assembly')?.traverse((object) => {
    if (object instanceof THREE.Mesh) visibleParts.push(object);
  });
  const materials = visibleParts.map((mesh) => mesh.material as THREE.MeshToonMaterial);
  const initialColors = materials.map((material) => material.color.clone());

  model.setSkillGlow(0.86);
  expect(materials.every((material, index) => material.color.equals(initialColors[index]))).toBe(true);
  expect(materials.every((material) => material.emissive.getHex() !== 0)).toBe(true);
  expect(materials.every((material) => material.emissiveIntensity >= 0.5)).toBe(true);

  model.setHovered(true);
  model.setHovered(false);
  expect(materials.every((material) => material.emissive.getHex() !== 0)).toBe(true);
  expect(model.skillVisualState.glowStrength).toBeCloseTo(0.86, 8);
  expect(model.skillVisualState.cableColor).toBe(definition.color);

  expect(model.root.getObjectByName('lamp-cable-guide')).toBeUndefined();
  model.setLampGuide('head');
  const guides: THREE.Group[] = [];
  model.root.traverse((object) => {
    if (object instanceof THREE.Group && object.name === 'lamp-cable-guide') guides.push(object);
  });
  expect(guides).toHaveLength(1);
  model.root.updateMatrixWorld(true);
  expect(guides[0].visible).toBe(true);
  expect(model.skillVisualState.lampGuideEnd).toBe('head');
  const beamDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(
    guides[0].getWorldQuaternion(new THREE.Quaternion()),
  );
  expect(beamDirection.dot(new THREE.Vector3(1, 0, 0))).toBeGreaterThan(0.999);
  const beam = guides[0].getObjectByName('lamp-cable-guide-beam') as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.ShaderMaterial
  >;
  expect(beam.material).toBeInstanceOf(THREE.ShaderMaterial);
  expect(beam.geometry).toBeInstanceOf(THREE.CylinderGeometry);
  const beamStartY = beam.position.y - beam.scale.y * 0.5;
  const apertureY = beamStartY + beam.scale.y * 0.08;
  const apertureRadius = beam.scale.x * (1 + (LAMP_BEAM_FAR_TO_NEAR_RATIO - 1) * 0.08);
  expect(beamStartY).toBeLessThan(PLUG_HEAD_ENVELOPE.bodyRange[1]);
  expect(apertureY).toBeCloseTo(PLUG_HEAD_ENVELOPE.bodyRange[1], 8);
  expect(apertureY).toBeLessThan(PLUG_HEAD_ENVELOPE.pinRange[0]);
  expect(apertureRadius).toBeCloseTo(PLUG_HEAD_ENVELOPE.maxRadius * 0.94, 8);
  const beamPosition = beam.position.clone();
  model.updateAvailableHints(0.4, 3.2);
  expect(beam.position.equals(beamPosition)).toBe(true);

  model.setLampGuide(null);
  model.setSkillGlow(0);
  expect(guides[0].visible).toBe(false);
  expect(materials.every((material, index) => material.color.equals(initialColors[index]))).toBe(true);
  model.dispose();
});

test('refrigerator freeze defaults to color until the ice presentation is enabled', () => {
  const definition: ArrowDefinition = {
    id: 'plug-cable-refrigerator-frost',
    path: [[4, 4, 4], [5, 4, 4], [5, 5, 4]],
    exitDirection: '+Y',
    color: 0xe98b47,
    lengthClass: 'short',
  };
  const model = new PlugCableModel(definition, 'three-pin');
  const visibleParts = [
    'plug-strain-relief',
    'plug-rear-neck',
    'plug-outer-shell',
    'plug-front-shoulder',
    'plug-interface-faceplate',
    'plug-cable-tail-ring',
    'plug-cable-tail-cap',
  ].map((name) => model.root.getObjectByName(name) as THREE.Mesh);
  const initial = visibleParts.map((mesh) => (mesh.material as THREE.MeshToonMaterial).color.clone());
  const cableIceShell = model.root.getObjectByName(`${definition.id}-cable-ice-shell`);
  const plugIceShell = model.root.getObjectByName('plug-frozen-shell') as THREE.Group;
  const tailIceShell = model.root.getObjectByName('plug-cable-tail-frozen-shell') as THREE.Group;
  expect(cableIceShell).toBeUndefined();
  expect(plugIceShell.visible).toBe(false);
  expect(tailIceShell.visible).toBe(false);

  model.setFrozen(1, 1);
  expect(model.skillVisualState.freezeAmount).toBe(1);
  expect(model.skillVisualState.freezeProgress).toBe(1);
  expect(model.skillVisualState.glowStrength).toBe(0);
  expect(visibleParts.every((mesh, index) => (
    !(mesh.material as THREE.MeshToonMaterial).color.equals(initial[index])
  ))).toBe(true);
  expect((model.material.userData.freezeAmount as { value: number }).value).toBe(1);
  expect((model.material.userData.freezeProgress as { value: number }).value).toBe(1);
  expect(model.material.customProgramCacheKey()).toContain('cable-base-v5-progressive-freeze');
  expect(cableIceShell).toBeUndefined();
  expect(plugIceShell.visible).toBe(false);
  expect(tailIceShell.visible).toBe(false);
  expect(model.skillVisualState.iceShellVisible).toBe(false);
  expect(model.skillVisualState.plugIceShellCount).toBe(0);
  expect(model.skillVisualState.iceShellOpacity).toBe(0);

  const frozen = visibleParts.map((mesh) => (mesh.material as THREE.MeshToonMaterial).color.clone());
  model.setHovered(true);
  model.setHovered(false);
  expect(visibleParts.every((mesh, index) => (
    (mesh.material as THREE.MeshToonMaterial).color.equals(frozen[index])
  ))).toBe(true);

  model.setFrozen(0, 0);
  expect(visibleParts.every((mesh, index) => (
    (mesh.material as THREE.MeshToonMaterial).color.equals(initial[index])
  ))).toBe(true);
  expect(cableIceShell).toBeUndefined();
  expect(plugIceShell.visible).toBe(false);
  expect(tailIceShell.visible).toBe(false);
  model.dispose();
});

test('refrigerator ice presentation adds a translucent casing with mostly flat irregular ice spikes', () => {
  const definition: ArrowDefinition = {
    id: 'plug-cable-refrigerator-ice',
    path: [[3, 3, 3], [5, 3, 3], [5, 5, 3], [5, 5, 4]],
    exitDirection: '+Z',
    color: 0xe98b47,
    lengthClass: 'medium',
  };
  const model = new PlugCableModel(definition, 'three-pin');
  model.setRefrigeratorIceGeometryEnabled(true);

  const cableIceShell = model.root.getObjectByName(`${definition.id}-cable-ice-shell`) as THREE.Mesh;
  const plugIceShell = model.root.getObjectByName('plug-frozen-shell') as THREE.Group;
  const spikes = model.root.getObjectByName(`${definition.id}-ice-spikes`) as THREE.Group;
  expect(cableIceShell).toBeDefined();
  expect(cableIceShell.getObjectByName(`${definition.id}-cable-ice-shell-ink`)).toBeDefined();
  expect(cableIceShell.visible).toBe(false);
  expect(plugIceShell.children.length).toBeGreaterThan(5);
  expect(plugIceShell.visible).toBe(false);
  expect(spikes.children.length).toBeGreaterThanOrEqual(7);
  expect(spikes.children.every((spike) => spike.children.some(({ userData }) => userData.isOutline === true))).toBe(true);
  const cableOutline = model.root.getObjectByName(`${definition.id}-cable-ink`) as THREE.Mesh<
    THREE.BufferGeometry,
    THREE.ShaderMaterial
  >;
  const cableOutlineThickness = cableOutline.material.uniforms.uThickness.value as number;
  expect(spikes.children.every((spike) => {
    const outline = spike.children.find(({ userData }) => userData.isOutline === true) as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    >;
    return (outline.material.uniforms.uThickness.value as number) >= cableOutlineThickness * 2;
  })).toBe(true);

  const flatSpikes = spikes.children.filter(({ userData }) => userData.iceSpikeShape === 'flat-blade');
  const pointedSpikes = spikes.children.filter(({ userData }) => userData.iceSpikeShape === 'pointed');
  expect(flatSpikes.length).toBeGreaterThan(pointedSpikes.length);
  const scaleSignatures = new Set(spikes.children.map(({ userData }) => {
    const scale = userData.baseScale as THREE.Vector3;
    return `${scale.x.toFixed(4)}:${scale.y.toFixed(4)}:${scale.z.toFixed(4)}`;
  }));
  expect(scaleSignatures.size).toBeGreaterThan(spikes.children.length * 0.8);
  const pathPositions = spikes.children.map(({ userData }) => userData.pathT as number);
  expect(pathPositions.every(Number.isFinite)).toBe(true);
  expect(pathPositions.filter((t) => t < 1 / 3).length).toBeGreaterThanOrEqual(2);
  expect(pathPositions.filter((t) => t >= 1 / 3 && t < 2 / 3).length).toBeGreaterThanOrEqual(2);
  expect(pathPositions.filter((t) => t >= 2 / 3).length).toBeGreaterThanOrEqual(2);
  expect(spikes.children.every(({ userData }) => (userData.surfaceRadiusFactor as number) <= 1.02)).toBe(true);

  const tailCap = model.root.getObjectByName('plug-cable-tail-cap') as THREE.Mesh;
  const initialTailColor = (tailCap.material as THREE.MeshToonMaterial).color.clone();
  model.setFrozen(1, 0.34);
  expect(plugIceShell.visible).toBe(true);
  expect(spikes.children.filter((spike) => spike.visible).length).toBeGreaterThan(0);
  expect(spikes.children.filter((spike) => spike.visible).length).toBeLessThan(spikes.children.length);
  expect((tailCap.material as THREE.MeshToonMaterial).color.equals(initialTailColor)).toBe(true);
  expect(model.material.userData.progressiveFreeze).toBe(true);

  model.setFrozen(1, 1);
  expect(cableIceShell.visible).toBe(true);
  const cableIceMaterial = cableIceShell.material as THREE.MeshPhysicalMaterial;
  const plugIcePart = plugIceShell.children.find((child) => child instanceof THREE.Mesh) as THREE.Mesh;
  const plugIceMaterial = plugIcePart.material as THREE.MeshPhysicalMaterial;
  const spikeIceMaterial = (spikes.children[0] as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
  expect(cableIceMaterial.opacity).toBeCloseTo(0.86, 5);
  expect(cableIceMaterial.roughness).toBeGreaterThanOrEqual(0.5);
  expect(plugIceMaterial.opacity).toBeCloseTo(0.86, 5);
  expect(plugIceMaterial.color.getHex()).toBe(cableIceMaterial.color.getHex());
  expect(spikeIceMaterial.color.getHex()).toBe(cableIceMaterial.color.getHex());
  expect(spikeIceMaterial.opacity).toBeCloseTo(0.96, 5);
  expect(spikes.children.every((spike) => {
    const outline = spike.children.find(({ userData }) => userData.isOutline === true) as THREE.Mesh<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    >;
    return outline.userData.iceSpikeRootFade === true
      && outline.material.uniforms.uRootFadeEnabled.value === 1
      && outline.material.uniforms.uRootFadeStart.value < outline.material.uniforms.uRootFadeEnd.value;
  })).toBe(true);
  expect(plugIceShell.visible).toBe(true);
  expect(spikes.visible).toBe(true);
  expect(spikes.children.every((spike) => spike.visible)).toBe(true);
  expect(model.skillVisualState.iceShellVisible).toBe(true);
  expect(model.skillVisualState.plugIceShellCount).toBe(1);

  model.setFrozen(0, 0);
  expect(cableIceShell.visible).toBe(false);
  expect(plugIceShell.visible).toBe(false);
  expect(spikes.visible).toBe(false);
  model.dispose();
});

test('showcase debug mode exposes exploded parts and raycast selection only by query', async ({ page }) => {
  await page.goto('/?showcase=plugs&parts=1&explode=0.72');
  await page.waitForFunction(() => window.__PLUG_SHOWCASE_DIAGNOSTICS__?.styleCount === 7);
  const diagnostics = await page.evaluate(() => window.__PLUG_SHOWCASE_DIAGNOSTICS__!);
  expect(diagnostics.debugEnabled).toBe(true);
  expect(diagnostics.explodeAmount).toBeCloseTo(0.72, 10);
  expect(diagnostics.selectableParts).toEqual([
    'front-shoulder',
    'interface-faceplate',
    'outer-shell',
    'rear-neck',
    'status-indicator',
    'strain-relief',
    'terminal-assembly',
  ]);

  const canvas = await page.locator('#game-canvas').boundingBox();
  expect(canvas).not.toBeNull();
  for (const yRatio of [0.42, 0.5, 0.58]) {
    await page.mouse.click(canvas!.x + canvas!.width * 0.13, canvas!.y + canvas!.height * yRatio);
    if (await page.evaluate(() => Boolean(document.body.dataset.selectedPlugPart))) break;
  }
  await expect.poll(() => page.evaluate(() => document.body.dataset.selectedPlugPart ?? null)).not.toBeNull();
  await expect(page.locator('.showcase-debug-status')).toContainText('SELECTED');
});

test('assembled seven-style board stays inside the v2 render budget', async ({ page }) => {
  await page.goto('/?showcase=plugs');
  await page.waitForFunction(() => (window.__PLUG_SHOWCASE_DIAGNOSTICS__?.drawCalls ?? 0) > 0);
  await expect(page.locator('.showcase-debug-status')).toHaveCount(0);
  const diagnostics = await page.evaluate(() => window.__PLUG_SHOWCASE_DIAGNOSTICS__!);
  expect(diagnostics.styleCount).toBe(7);
  expect(diagnostics.drawCalls).toBeLessThanOrEqual(120);
  expect(diagnostics.triangles).toBeLessThanOrEqual(12_000);
  expect(diagnostics.textures).toBeLessThanOrEqual(2);

  const averageFrameMs = await page.evaluate(() => new Promise<number>((resolve) => {
    const samples: number[] = [];
    let previous = performance.now();
    const sample = (now: number) => {
      samples.push(now - previous);
      previous = now;
      if (samples.length < 61) requestAnimationFrame(sample);
      else resolve(samples.slice(1).reduce((sum, value) => sum + value, 0) / 60);
    };
    requestAnimationFrame(sample);
  }));
  expect(averageFrameMs).toBeLessThanOrEqual(20);
});
