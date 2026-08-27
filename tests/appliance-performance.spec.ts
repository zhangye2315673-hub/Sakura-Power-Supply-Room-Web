import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createApplianceModel } from '../src/appliances/models';
import { createKettleModel } from '../src/appliances/models/kettle';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import {
  AppliancePerformanceSystem,
  type AppliancePerformanceTarget,
} from '../src/systems/AppliancePerformanceSystem';
import { PetalField } from '../src/systems/PetalField';
import { APPLIANCE_CATALOG } from '../src/systems/ApplianceCatalog';

const LEGACY_EFFECT_NAMES = new RegExp([
  'lamp-(?:flashlight-beam|ground-(?:warm-)?light)',
  'fan-(?:rotor-)?afterimage',
  'radio-spatial-sound-wave',
  'humidifier-(?:mist-particle|storm-cloud|cloud-(?:lightning|rain))',
  'toaster-toast-single',
  'refrigerator-cold-mist-\\d',
  'washer-squeezed-foam',
  'coffee-maker-(?:side-tank-bubble|steam-particle|beer-foam|rim-foam|overflowing-foam|coffee-stream)',
  'kettle-(?:water-bubble|steam-particle)',
  'rice-cooker-(?:rice-grain|steam-particle)',
  'bubble-machine-powered-bubble',
  'popcorn-machine-dispensed-popcorn',
  'smart-bin-(?:paper-waste|crumpled-paper-waste|bottle-waste|mint-bottle|carton-waste|small-carton)',
  'record-player-(?:sound-wave|music-note)',
  'stand-mixer-(?:liquid-vortex|splash-effects|airborne-liquid|liquid-splat)',
  'printer-(?:printed-paper|printed-output|sakura-burst)',
  'induction-cooktop-(?:hotpot-boil-bubble|powered-steam-puff)',
  'blender-powered-ingredient',
  'dehumidifier-airborne-moisture',
  'portable-speaker-sound-wave-\\d',
  'hair-dryer-warm-airflow',
].join('|'));

const HIDDEN_STATUS_MARKER = /(?:^|[-_])(status-indicator|status-dot|status-lamp|status-light|status-lens|power-led|power-status-indicator)(?:[-_]|$)/i;

test('power and status marker meshes stay hidden across appliance models', () => {
  const visibleMarkers: string[] = [];
  APPLIANCE_CATALOG.forEach((definition) => {
    const model = createApplianceModel(definition.id, {
      id: definition.id,
      accent: 0xe8aec4,
      referencePath: definition.referencePath,
    });
    model.root.traverse((object) => {
      if (object instanceof THREE.Mesh && object.visible && HIDDEN_STATUS_MARKER.test(object.name)) {
        visibleMarkers.push(`${definition.id}:${object.name}`);
      }
    });
  });
  expect(visibleMarkers).toEqual([]);
});

function rigPose(root: THREE.Group): string {
  const values: Array<[string, number[], boolean]> = [];
  root.traverse((object) => {
    if (object.userData.isOutline || object.name === 'status-indicator') return;
    values.push([
      object.name || object.type,
      [
        object.position.x, object.position.y, object.position.z,
        object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w,
        object.scale.x, object.scale.y, object.scale.z,
      ].map((value) => Number(value.toFixed(7))),
      object.visible,
    ]);
  });
  return JSON.stringify(values);
}

function instanceMatrices(mesh: THREE.InstancedMesh): string {
  const matrix = new THREE.Matrix4();
  const values: number[][] = [];
  for (let index = 0; index < mesh.count; index += 1) {
    mesh.getMatrixAt(index, matrix);
    values.push(matrix.elements.map((value) => Number(value.toFixed(7))));
  }
  return JSON.stringify(values);
}

test('gumball machine enlarges only the transparent globe, not its pink rings', () => {
  const model = createApplianceModel('gumball-machine', { id: 'gumball-machine', accent: 0xe8aec4 });
  const globe = model.root.getObjectByName('gumball-machine-transparent-globe-shell') as THREE.Mesh;
  const topRing = model.root.getObjectByName('gumball-machine-wide-top-lid-rim') as THREE.Mesh;
  const lowerRing = model.root.getObjectByName('gumball-machine-globe-seat-ring') as THREE.Mesh;
  globe.geometry.computeBoundingBox();
  topRing.geometry.computeBoundingBox();
  lowerRing.geometry.computeBoundingBox();
  const globeWidth = globe.geometry.boundingBox!.getSize(new THREE.Vector3()).x * globe.scale.x;
  const topRingWidth = topRing.geometry.boundingBox!.getSize(new THREE.Vector3()).x * topRing.scale.x;
  const lowerRingWidth = lowerRing.geometry.boundingBox!.getSize(new THREE.Vector3()).x * lowerRing.scale.x;

  expect(globeWidth).toBeGreaterThan(topRingWidth * 1.3);
  expect(globeWidth).toBeGreaterThan(lowerRingWidth * 1.3);
  expect(topRingWidth).toBeCloseTo(lowerRingWidth, 5);
});

test('portable speaker grille dots ripple out of phase and exactly reset', () => {
  const model = createApplianceModel('portable-speaker', { id: 'portable-speaker', accent: 0xe8aec4 });
  const animation = createApplianceMechanicalAnimation('portable-speaker', model.root);
  const grille = model.root.getObjectByName('portable-speaker-grille-perforations') as THREE.InstancedMesh;
  const idle = instanceMatrices(grille);
  animation.update(3.22, 1);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const zValues: number[] = [];
  for (let index = 0; index < grille.count; index += 11) {
    grille.getMatrixAt(index, matrix);
    position.setFromMatrixPosition(matrix);
    zValues.push(position.z);
  }
  expect(Math.max(...zValues) - Math.min(...zValues)).toBeGreaterThan(0.04);
  expect(model.root.userData.portableSpeakerPerformance.grilleMaxOffset).toBeGreaterThan(0.05);

  animation.stop();
  expect(instanceMatrices(grille)).toBe(idle);
});

test('kettle has exactly one visible steam owner at the same powered timestamp', () => {
  const model = createKettleModel({ id: 'kettle', accent: 0xe8aec4 });
  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(4, 3, 8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  const elapsed = 1.6;
  const target: AppliancePerformanceTarget = {
    root: model.root,
    state: 'active',
    kind: 'kettle',
    facingSide: 1,
    getActiveElapsed: () => elapsed,
  };
  performances.update(1 / 60, elapsed, camera, [target], petals);

  let visibleVolumetricPuffs = 0;
  let legacyModelSteam = 0;
  model.root.traverse((object) => {
    if (object.visible && /^kettle-volumetric-steam-puff-\d+-pivot$/.test(object.name)) visibleVolumetricPuffs += 1;
    if (object.name.startsWith('kettle-steam-particle-')) legacyModelSteam += 1;
  });
  const performanceState = performances.getStateSummary();
  const genericPoolSteam = performanceState.activeByKind.steam ?? 0;
  const activeSteamOwners = Number(visibleVolumetricPuffs > 0) + Number(genericPoolSteam > 0);

  expect(legacyModelSteam, 'legacy model steam nodes must be physically removed').toBe(0);
  expect(visibleVolumetricPuffs, 'the unified mechanical timeline must drive socket-bound 3D puffs').toBeGreaterThan(0);
  expect(genericPoolSteam, 'the generic sphere pool must not overlap kettle puffs').toBe(0);
  expect(activeSteamOwners, 'model steam and unified steam must never run together').toBe(1);
  expect(performanceState.sessions).toBe(1);
  expect(performanceState.timelineOwners).toBe(1);
  expect(performanceState.elapsedByKind.kettle).toBeCloseTo(elapsed, 6);

  performances.stop(target);
  expect(performances.getStateSummary().sessions).toBe(0);
  expect(model.root.userData.appliancePerformanceSignal).toBe(0);
  performances.dispose();
  petals.dispose();
});

test('all 29 models use the migrated mechanics and contain no legacy effect nodes', () => {
  expect(APPLIANCE_CATALOG).toHaveLength(29);
  const performances = new AppliancePerformanceSystem();
  const petals = new PetalField(1);
  const camera = new THREE.PerspectiveCamera(31, 16 / 9, 0.1, 80);
  camera.position.set(4, 3, 8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  for (const [index, definition] of APPLIANCE_CATALOG.entries()) {
    const model = createApplianceModel(definition.id, {
      id: definition.id,
      accent: 0xe8aec4 + index,
      referencePath: definition.referencePath,
    });
    const legacyNames: string[] = [];
    model.root.traverse((object) => {
      if (LEGACY_EFFECT_NAMES.test(object.name)) legacyNames.push(object.name);
    });
    expect(legacyNames, `${definition.id} still owns legacy effects`).toEqual([]);

    const idle = rigPose(model.root);
    const target: AppliancePerformanceTarget = {
      root: model.root,
      state: 'active',
      kind: definition.id,
      facingSide: 1,
      getActiveElapsed: () => 4.2,
    };
    performances.update(1 / 60, 4.2, camera, [target], petals);
    const powered = rigPose(model.root);
    expect(powered, `${definition.id} must have a mechanical performance pose`).not.toBe(idle);
    const state = performances.getStateSummary();
    expect(state.sessions, `${definition.id} must have exactly one performance session`).toBe(1);
    expect(state.timelineOwners, `${definition.id} must have exactly one timeline owner`).toBe(1);
    expect(state.elapsedByKind[definition.id]).toBeCloseTo(4.2, 6);
    expect(state.signalsByKind[definition.id], `${definition.id} must expose its unified timeline signal`).toBeGreaterThan(0);
    performances.stop(target);
    expect(rigPose(model.root), `${definition.id} stop() must restore its exact rig pose`).toBe(idle);
    expect(performances.getStateSummary().sessions).toBe(0);
  }

  performances.dispose();
  petals.dispose();
});
