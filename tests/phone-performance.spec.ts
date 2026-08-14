import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createPhoneModel } from '../src/appliances/models/phone';
import {
  applyPhonePerformance,
  resetPhonePerformance,
  type PhonePerformanceDiagnostics,
} from '../src/appliances/performance/PhonePerformance';

const LEGACY_PHONE_UI = /^phone-(?:charging|battery|notification-breathing)/;

function build() {
  return createPhoneModel({ id: 'phone', accent: 0xe8a7b7 });
}

function diagnostics(root: THREE.Group): PhonePerformanceDiagnostics {
  return root.userData.phonePerformance as PhonePerformanceDiagnostics;
}

test('phone replaces charging UI and generic ribbons with a readable volumetric call rig', () => {
  const model = build();
  const legacy: string[] = [];
  const forbiddenFlatGeometry: string[] = [];
  const forbiddenThemes: string[] = [];
  model.root.traverse((object) => {
    if (LEGACY_PHONE_UI.test(object.name)) legacy.push(object.name);
    if (/star|lightning|electric-bolt/i.test(object.name)) forbiddenThemes.push(object.name);
    if (object instanceof THREE.Sprite || object instanceof THREE.Line) forbiddenFlatGeometry.push(object.name);
    if (object instanceof THREE.Mesh && object.geometry.type === 'PlaneGeometry') forbiddenFlatGeometry.push(object.name);
  });

  expect(legacy).toEqual([]);
  expect(forbiddenFlatGeometry).toEqual([]);
  expect(forbiddenThemes).toEqual([]);
  expect(model.root.getObjectByName('phone-incoming-avatar-pivot')).toBeTruthy();
  expect(model.root.getObjectByName('phone-contact-name-MOMO')).toBeTruthy();
  expect(model.root.getObjectByName('phone-incoming-label-CALLING')).toBeTruthy();
  expect(model.root.getObjectByName('phone-call-answer-button')?.userData.controlAction).toBe('answer-call');
  expect(model.root.getObjectByName('phone-call-hangup-button')?.userData.controlAction).toBe('hangup-call');

  const waves = [1, 2, 3].map((index) => model.root.getObjectByName(`phone-stereo-wave-ring-${index}`) as THREE.Mesh);
  const vibrationArcs = ['left-1', 'left-2', 'right-1', 'right-2']
    .map((suffix) => model.root.getObjectByName(`phone-vibration-pulse-${suffix}`) as THREE.Mesh);
  const signalArcs = ['left-1', 'left-2', 'left-3', 'right-1', 'right-2', 'right-3']
    .map((suffix) => model.root.getObjectByName(`phone-call-signal-arc-${suffix}`) as THREE.Mesh);
  expect(waves.every((mesh) => mesh.geometry.type === 'TorusGeometry')).toBe(true);
  expect(vibrationArcs.every((mesh) => mesh.geometry.type === 'TubeGeometry')).toBe(true);
  expect(signalArcs.every((mesh) => mesh.geometry.type === 'TubeGeometry')).toBe(true);
  expect(model.root.userData.phoneEffectContract).toMatchObject({
    modelOwner: 'phone-model-rig',
    timelineOwner: 'AppliancePerformanceSystem',
    sharedSpectacleEffects: 'disabled',
    usesPlaneGeometry: false,
    usesSprite: false,
  });
});

test('incoming-call timeline wakes suddenly, flashes the prompt and escalates volumetric reminders', () => {
  const model = build();

  applyPhonePerformance(model.root, 0, 1);
  expect(diagnostics(model.root).phase).toBe('screen-wake');
  expect(diagnostics(model.root).screenLit).toBe(false);
  expect(model.root.getObjectByName('phone-incoming-call-ui-pivot')?.visible).toBe(false);

  applyPhonePerformance(model.root, 0.18, 1);
  expect(diagnostics(model.root).screenLit).toBe(true);
  expect(model.root.getObjectByName('phone-incoming-call-ui-pivot')?.visible).toBe(true);

  const darkPromptModel = build();
  const brightPromptModel = build();
  applyPhonePerformance(darkPromptModel.root, 2, 1);
  applyPhonePerformance(brightPromptModel.root, 2.2, 1);
  expect(diagnostics(darkPromptModel.root).promptVisible).toBe(false);
  expect(diagnostics(brightPromptModel.root).promptVisible).toBe(true);

  const urgent = build();
  applyPhonePerformance(urgent.root, 3.42, 1);
  const state = diagnostics(urgent.root);
  expect(state.phase).toBe('urgent-reminder');
  expect(state.avatarPulse).toBeGreaterThan(1.03);
  expect(state.answerPulse).toBeGreaterThan(1.05);
  expect(state.visibleStereoWaveRings).toBeGreaterThanOrEqual(2);
  expect(state.visibleVibrationPulses).toBeGreaterThan(0);
  expect(state.visibleCallSignalArcs).toBeGreaterThan(0);
  expect(state.visibleSoftLightPoints).toBeGreaterThan(0);
  expect(state.visibleInformationParticles).toBeGreaterThan(0);
  expect(state.sharedSpectacleEffects).toBe('disabled');
  expect(state.forbiddenThemes).toEqual(['combat-star', 'electric-bolt', 'ultimate-attack']);

  resetPhonePerformance(urgent.root);
  expect(urgent.root.userData.phonePerformance).toBeUndefined();
  expect(urgent.root.getObjectByName('phone-incoming-call-ui-pivot')?.visible).toBe(false);
  const visibleFeedback: string[] = [];
  urgent.root.getObjectByName('phone-call-feedback-rig')?.traverse((object) => {
    if (object.userData.performanceEffect && object.visible) visibleFeedback.push(object.name);
  });
  expect(visibleFeedback).toEqual([]);
});

test('phone retains its authored lift, high-frequency shake and roll rhythm for game and gallery', () => {
  const game = build();
  const gallery = build();
  const time = 3.42;
  applyPhonePerformance(game.root, time, 1);
  applyPhonePerformance(gallery.root, time, 1);

  const gameState = diagnostics(game.root);
  const galleryState = diagnostics(gallery.root);
  expect(gameState).toEqual(galleryState);
  expect(gameState.bodyLift).toBeGreaterThan(0.8);
  expect(Math.abs(gameState.bodyShakeX)).toBeLessThanOrEqual(0.055);
  expect(Math.abs(gameState.bodyRoll)).toBeLessThanOrEqual(0.045);
  expect(gameState.timelineOwner).toBe('AppliancePerformanceSystem');

  const gameHandset = game.root.getObjectByName('phone-handset-pivot')!;
  const galleryHandset = gallery.root.getObjectByName('phone-handset-pivot')!;
  expect(gameHandset.position.toArray()).toEqual(galleryHandset.position.toArray());
  expect(gameHandset.quaternion.toArray()).toEqual(galleryHandset.quaternion.toArray());
});
