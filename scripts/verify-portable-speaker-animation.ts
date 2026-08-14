import * as THREE from 'three';
import { createPortableSpeakerModel } from '../src/appliances/models/portableSpeaker';
import { createApplianceMechanicalAnimation } from '../src/appliances/performance/ApplianceMechanics';
import type { PortableSpeakerPerformanceDiagnostics } from '../src/appliances/performance/PortableSpeakerPerformance';

const build = createPortableSpeakerModel({ id: 'portable-speaker', accent: 0xe8a7b7 });
const animation = createApplianceMechanicalAnimation('portable-speaker', build.root);
animation.stop();

function snapshot(): string {
  const nodes: unknown[] = [];
  build.root.traverse((node) => {
    nodes.push({
      name: node.name,
      position: node.position.toArray(),
      quaternion: node.quaternion.toArray(),
      scale: node.scale.toArray(),
      visible: node.visible,
    });
  });
  const materials = [...build.materials].map((material) => {
    const toon = material as THREE.MeshToonMaterial;
    return {
      color: toon.color?.getHex() ?? null,
      emissive: toon.emissive?.getHex() ?? null,
      emissiveIntensity: toon.emissiveIntensity ?? null,
      opacity: toon.opacity,
    };
  });
  return JSON.stringify({ nodes, materials });
}

function diagnostics(): PortableSpeakerPerformanceDiagnostics {
  const value = build.root.userData.portableSpeakerPerformance as
    PortableSpeakerPerformanceDiagnostics | undefined;
  if (!value) throw new Error('portable-speaker performance diagnostics missing');
  return value;
}

const whole = build.root.getObjectByName('portable-speaker-whole-machine-pivot');
const cabinet = build.root.getObjectByName('portable-speaker-cabinet-pivot');
const handle = build.root.getObjectByName('portable-speaker-handle-pivot');
const indicator = build.root.getObjectByName('portable-speaker-status-indicator');
const driver = build.root.getObjectByName('portable-speaker-driver-pulse-pivot');
if (!whole || !cabinet || !handle || !indicator || !driver) throw new Error('portable-speaker rig is incomplete');

const hasAncestor = (object: THREE.Object3D, ancestor: THREE.Object3D): boolean => {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
};

const flatEffects: string[] = [];
let waveCount = 0;
build.root.traverse((object) => {
  if (!object.name.startsWith('portable-speaker-bass-wave-ring-')) return;
  waveCount += 1;
  if (!(object instanceof THREE.Mesh) || object.geometry.type !== 'TubeGeometry') {
    flatEffects.push(`${object.name}:${object instanceof THREE.Mesh ? object.geometry.type : object.type}`);
  }
});

const idle = snapshot();
const removedFaceArtifacts = [
  'portable-speaker-driver-basket-rim',
  'portable-speaker-driver-compliant-surround',
  'portable-speaker-driver-diaphragm-cone',
  'portable-speaker-driver-dust-cap',
  'portable-speaker-powered-diaphragm-glow',
].filter((name) => build.root.getObjectByName(name));
const idleVisibleWaveCount = Array.from({ length: waveCount }, (_, index) => (
  build.root.getObjectByName(`portable-speaker-bass-wave-ring-${index + 1}`)?.visible ? 1 : 0
)).reduce((sum, value) => sum + value, 0);
animation.update(4.42, 1);
const compression = {
  scale: whole.scale.toArray(),
  driverTravel: diagnostics().driverTravel,
  phase: diagnostics().phase,
};
animation.update(4.56, 1);
const expansion = {
  scale: whole.scale.toArray(),
  driverTravel: diagnostics().driverTravel,
  waves: diagnostics().activeWaveCount,
};
animation.update(5.0, 1);
const airborne = {
  lift: diagnostics().finalLift,
  phase: diagnostics().phase,
};
const powered = snapshot();
animation.stop();
const reset = snapshot();

const result = {
  hierarchy: {
    cabinetInsideWholeBassRoot: hasAncestor(cabinet, whole),
    handleInsideWholeBassRoot: hasAncestor(handle, whole),
    indicatorInsideWholeBassRoot: hasAncestor(indicator, whole),
  },
  removedFaceArtifactCount: removedFaceArtifacts.length,
  idleVisibleWaveCount,
  waveCount,
  flatEffects,
  compression,
  expansion,
  airborne,
  poweredStateDiffers: powered !== idle,
  exactReset: reset === idle,
  animationSignalAfterStop: animation.signal(),
  diagnosticsClearedAfterStop: build.root.userData.portableSpeakerPerformance === undefined,
};

console.log(JSON.stringify(result, null, 2));
const passed = Object.values(result.hierarchy).every(Boolean)
  && result.removedFaceArtifactCount === 0
  && result.idleVisibleWaveCount === 0
  && result.waveCount === 8
  && result.flatEffects.length === 0
  && result.compression.scale.every((value) => value < 1)
  && result.expansion.scale.every((value) => value > 1)
  && result.expansion.driverTravel > 0.12
  && result.expansion.waves >= 1
  && result.airborne.lift > 0.12
  && result.airborne.phase === 'airborne'
  && result.poweredStateDiffers
  && result.exactReset
  && result.animationSignalAfterStop === 0
  && result.diagnosticsClearedAfterStop;
if (!passed) process.exit(1);
