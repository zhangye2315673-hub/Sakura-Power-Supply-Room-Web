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
  const initial = [shell, shoulder, sleeve].map((mesh) => (mesh.material as THREE.MeshToonMaterial).color.clone());
  model.setSkillTint(0x4f2b23, 0.78);
  const tinted = [shell, shoulder, sleeve].map((mesh) => (mesh.material as THREE.MeshToonMaterial).color.clone());
  expect(tinted.some((color, index) => !color.equals(initial[index]))).toBe(true);
  expect(tinted.every((color) => color.r < initial[0].r || color.g < initial[0].g)).toBe(true);
  model.setSkillTint(null);
  expect((shell.material as THREE.MeshToonMaterial).color.equals(initial[0])).toBe(true);
  expect((shoulder.material as THREE.MeshToonMaterial).color.equals(initial[1])).toBe(true);
  expect((sleeve.material as THREE.MeshToonMaterial).color.equals(initial[2])).toBe(true);
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
