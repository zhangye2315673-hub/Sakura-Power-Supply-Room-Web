import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createRecordPlayerModel } from '../src/appliances/models/recordPlayer';
import {
  createRecordPlayerPerformance,
  RECORD_PLAYER_EFFECT_OWNER,
  RECORD_PLAYER_TIMELINE,
  RECORD_PLAYER_TIMELINE_OWNER,
} from '../src/appliances/performance/RecordPlayerPerformance';

function createModel() {
  return createRecordPlayerModel({ id: 'record-player', accent: 0xe8aec4 });
}

function transformSnapshot(root: THREE.Group): string {
  const names = [
    root.name,
    'record-player-body-pivot',
    'record-player-lid-hinge-pivot',
    'record-player-platter-spin-pivot',
    'record-player-tonearm-pivot',
    'record-player-tonearm-cue-pivot',
    'record-player-control-knob-pivot',
  ];
  return JSON.stringify(names.map((name) => {
    const object = name === root.name ? root : root.getObjectByName(name)!;
    return [
      name,
      ...object.position.toArray(),
      ...object.quaternion.toArray(),
      ...object.scale.toArray(),
    ].map((value) => typeof value === 'number' ? Number(value.toFixed(8)) : value);
  }));
}

test('record player is authored open and exposes separate sweep and cue pivots', () => {
  const model = createModel();
  const lid = model.root.getObjectByName('record-player-lid-hinge-pivot')!;
  const sweep = model.root.getObjectByName('record-player-tonearm-pivot')!;
  const cue = model.root.getObjectByName('record-player-tonearm-cue-pivot')!;

  expect(lid.rotation.x).toBeLessThan(-0.1);
  expect(cue.parent).toBe(sweep);
  expect(model.root.userData.recordPlayerPerformanceRig).toMatchObject({
    initialLidPose: 'open',
    timelineOwner: RECORD_PLAYER_TIMELINE_OWNER,
    effectOwner: RECORD_PLAYER_EFFECT_OWNER,
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  });
  expect(model.root.userData.externalPerformanceCue).toMatchObject({
    legacyGenericNotes: 'removed',
    sharedSpectacleEffects: 'must-be-disabled-during-integration',
  });

  const legacyNames: string[] = [];
  model.root.traverse((object) => {
    if (/^record-player-(?:sound-wave|music-note)/.test(object.name)) legacyNames.push(object.name);
  });
  expect(legacyNames).toEqual([]);
});

test('record player powers on through the right knob, indicator, slow platter start and edge cue', () => {
  const model = createModel();
  const performance = createRecordPlayerPerformance(model.root);
  const knob = model.root.getObjectByName('record-player-control-knob-pivot')!;
  const tonearm = model.root.getObjectByName('record-player-tonearm-pivot')!;
  const cue = model.root.getObjectByName('record-player-tonearm-cue-pivot')!;
  const knobRest = knob.rotation.y;
  const tonearmRest = tonearm.rotation.y;
  const cueRest = cue.position.y;

  performance.apply(0.12, 1);
  const earlySpeed = performance.diagnostics.platterSpeed;
  performance.apply(RECORD_PLAYER_TIMELINE.knobOnEnd, 1);
  expect(knob.rotation.y - knobRest).toBeGreaterThan(2.1);
  expect(performance.diagnostics.indicatorStrength).toBeGreaterThan(0.95);
  expect(performance.diagnostics.platterSpeed).toBeGreaterThan(earlySpeed);
  expect(performance.diagnostics.platterSpeed).toBeLessThan(6.35);

  performance.apply(RECORD_PLAYER_TIMELINE.cueLiftEnd, 1);
  expect(cue.position.y - cueRest).toBeGreaterThan(0.13);
  expect(performance.diagnostics.stylusState).toBe('moving-to-edge');

  performance.apply(RECORD_PLAYER_TIMELINE.cueSweepEnd, 1);
  expect(tonearm.rotation.y - tonearmRest).toBeLessThan(-0.32);
  expect(cue.position.y - cueRest).toBeGreaterThan(0.12);

  performance.apply(RECORD_PLAYER_TIMELINE.stylusLowerEnd, 1);
  expect(performance.diagnostics.stylusState).toBe('playing-edge');
  expect(performance.diagnostics.tonearmSweep).toBeCloseTo(-0.34, 5);
  expect(performance.diagnostics.tonearmLift).toBeCloseTo(-0.11, 5);
  expect(cue.position.y - cueRest).toBeCloseTo(-0.11, 5);
});

test('record player owns dense volumetric waves, notes, light points, rhythm particles and stars', () => {
  const model = createModel();
  const performance = createRecordPlayerPerformance(model.root);
  const effects = model.root.getObjectByName('record-player-performance-effects')!;
  const counts = { waves: 0, notes: 0, lights: 0, rhythms: 0, stars: 0 };

  effects.traverse((object) => {
    expect(object instanceof THREE.Sprite).toBe(false);
    expect(object instanceof THREE.Line).toBe(false);
    if (!(object instanceof THREE.Mesh)) return;
    expect(object.geometry.type).not.toBe('PlaneGeometry');
    if (object.name.startsWith('record-player-performance-wave-ring-')) {
      counts.waves += 1;
      expect(object.geometry.type).toBe('TubeGeometry');
      expect(object.geometry.userData.hasThickness).toBe(true);
    }
    if (object.name.startsWith('record-player-performance-note-')) {
      counts.notes += 1;
      expect(object.geometry.type).toBe('ExtrudeGeometry');
      expect(object.geometry.userData.hasThickness).toBe(true);
    }
    if (object.name.startsWith('record-player-performance-light-point-')) counts.lights += 1;
    if (object.name.startsWith('record-player-performance-rhythm-particle-')) counts.rhythms += 1;
    if (object.name.startsWith('record-player-performance-soft-star-')) counts.stars += 1;
  });

  expect(counts).toEqual({ waves: 12, notes: 18, lights: 24, rhythms: 20, stars: 12 });
  expect(effects.userData).toMatchObject({
    effectOwner: RECORD_PLAYER_EFFECT_OWNER,
    timelineOwner: RECORD_PLAYER_TIMELINE_OWNER,
    sharedSpectacleEffects: 'disabled',
  });

  performance.apply(2.05, 1);
  const groove = { ...performance.diagnostics };
  expect(groove.activeWaveRings).toBeGreaterThanOrEqual(4);
  expect(groove.activeNotes).toBeGreaterThanOrEqual(8);
  expect(groove.activeLightPoints).toBeGreaterThanOrEqual(10);
  expect(groove.activeRhythmParticles).toBeGreaterThanOrEqual(7);
  expect(groove.activeSoftStars).toBeGreaterThanOrEqual(5);
  expect(groove.totalActiveEffects).toBeGreaterThanOrEqual(35);

  performance.apply(RECORD_PLAYER_TIMELINE.climaxPeak, 1);
  const climax = performance.diagnostics;
  expect(climax.phase).toBe('climax');
  expect(climax.climaxStrength).toBeGreaterThan(0.99);
  expect(climax.totalActiveEffects).toBeGreaterThan(groove.totalActiveEffects + 20);
  expect(climax.activeWaveRings).toBeGreaterThan(groove.activeWaveRings);
  expect(climax.activeNotes).toBeGreaterThan(groove.activeNotes);
  expect(climax.effectEnergy).toBeGreaterThan(groove.effectEnergy);
});

test('record player climax moves the whole machine and resonates the open lid, then fades and returns', () => {
  const model = createModel();
  const performance = createRecordPlayerPerformance(model.root);
  const idle = transformSnapshot(model.root);
  const lid = model.root.getObjectByName('record-player-lid-hinge-pivot')!;
  const lidRest = lid.rotation.x;

  const climaxBeatPeak = RECORD_PLAYER_TIMELINE.performanceStart + 4.25 / 2.15;
  performance.apply(climaxBeatPeak, 1);
  expect(transformSnapshot(model.root)).not.toBe(idle);
  expect(Math.abs(lid.rotation.x - lidRest)).toBeGreaterThan(0.005);
  expect(performance.diagnostics.beatRebound).toBeGreaterThan(0.05);
  const climaxEnergy = performance.diagnostics.effectEnergy;
  const climaxCount = performance.diagnostics.totalActiveEffects;

  performance.apply(4.34, 1);
  expect(performance.diagnostics.phase).toBe('returning');
  expect(performance.diagnostics.effectEnergy).toBeLessThan(climaxEnergy * 0.55);
  expect(performance.diagnostics.totalActiveEffects).toBeLessThan(climaxCount);
  expect(performance.diagnostics.platterSpeed).toBeLessThan(6.35 * 0.8);
  expect(performance.diagnostics.tonearmLift).toBeGreaterThan(0.1);

  performance.apply(RECORD_PLAYER_TIMELINE.resetPoseAt, 1);
  expect(performance.diagnostics.phase).toBe('idle-reset');
  expect(performance.diagnostics.platterSpeed).toBeCloseTo(0, 8);
  expect(performance.diagnostics.tonearmSweep).toBeCloseTo(0, 8);
  expect(performance.diagnostics.tonearmLift).toBeCloseTo(0, 8);
  expect(performance.diagnostics.knobTurn).toBeCloseTo(0, 8);
  expect(performance.diagnostics.totalActiveEffects).toBe(0);

  performance.reset();
  expect(transformSnapshot(model.root)).toBe(idle);
  expect(performance.diagnostics.phase).toBe('idle');
  expect(performance.signal()).toBe(0);
});
