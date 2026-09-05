import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { DehumidifierDryShieldPresentation } from '../src/skill/DehumidifierDryShieldPresentation';
import { SoundWaveShieldPresentation } from '../src/skill/SoundWaveShieldPresentation';
import { SkillEffectActivationTimeline } from '../src/style/post';
import { APPLIANCE_SKILL_REGISTRY, SkillChallengeEngine } from '../src/skill/SkillChallengeEngine';
import { skillConnectionVisualPolicy } from '../src/skill/SkillConnectionVisualPolicy';

function target(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.4, 1.1),
    new THREE.MeshBasicMaterial(),
  );
}

function disposeTarget(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  (mesh.material as THREE.Material).dispose();
}

test('同一局再次连接除湿机时重新播放干燥护盾，而不是只保留旧 BUFF', () => {
  const mesh = target();
  const shield = new DehumidifierDryShieldPresentation();

  shield.sync(true, 3, [mesh]);
  shield.update(0.1, 0.1);
  shield.update(5.3, 5.3);
  expect(shield.diagnostics.phase).toBe('idle');

  shield.retrigger(3, [mesh]);
  expect(shield.diagnostics.phase).toBe('arming');
  expect(shield.diagnostics.visible).toBe(true);
  expect(shield.diagnostics.activationCount).toBe(2);

  shield.dispose();
  disposeTarget(mesh);
});

test('同一局再次连接唱片机时重新播放感召护盾，而不是等待自动提醒', () => {
  const mesh = target();
  const shield = new SoundWaveShieldPresentation();

  shield.sync(true, [mesh]);
  const start = performance.now() / 1000;
  shield.update(0.1, start + 0.1);
  shield.update(5.3, start + 5.3);
  expect(shield.diagnostics.phase).toBe('idle');

  shield.retrigger([mesh]);
  expect(shield.diagnostics.phase).toBe('arming');
  expect(shield.diagnostics.visible).toBe(true);
  expect(shield.diagnostics.activationCount).toBe(2);

  shield.dispose();
  disposeTarget(mesh);
});

test('全屏技能效果即使 mode 相同，每次连接也会建立新的视觉激活', () => {
  const timeline = new SkillEffectActivationTimeline();
  const effects = [
    'television-glitch',
    'blue-screen',
    'coffee-lock',
    'bathroom-steam',
    'microwave-heat',
    'printer-scan',
    'toaster-heat',
    'kettle-thaw-heat',
  ] as const;

  effects.forEach((effect, index) => {
    timeline.activate(effect, 'none', true, index * 10);
    timeline.activate(effect, effect, true, index * 10 + 5);
  });

  expect(timeline.activationCount).toBe(effects.length * 2);
  expect(timeline.age('television-glitch', 5.04)).toBeCloseTo(0.04, 6);
});

test('29 台家电都有每次连接必播的家电表演，专属屏效与护盾不依赖 resolution', () => {
  expect(APPLIANCE_SKILL_REGISTRY.size).toBe(29);
  for (const appliance of APPLIANCE_SKILL_REGISTRY.keys()) {
    expect(skillConnectionVisualPolicy(appliance).appliancePerformance).toBe(true);
  }
  const expectedScreenEffects = {
    humidifier: 'bathroom-steam',
    television: 'television-glitch',
    toaster: 'toaster-heat',
    kettle: 'kettle-thaw-heat',
    'coffee-maker': 'coffee-lock',
    printer: 'printer-scan',
    microwave: 'microwave-heat',
    'desktop-computer': 'blue-screen',
  } as const;
  const expectedShields = {
    'bubble-machine': 'bubble',
    'record-player': 'sound-wave',
    dehumidifier: 'dry-air',
  } as const;
  for (const [appliance, screenEffect] of Object.entries(expectedScreenEffects)) {
    expect(skillConnectionVisualPolicy(appliance as keyof typeof expectedScreenEffects).screenEffect)
      .toBe(screenEffect);
  }
  for (const [appliance, shield] of Object.entries(expectedShields)) {
    expect(skillConnectionVisualPolicy(appliance as keyof typeof expectedShields).shield).toBe(shield);
  }

  const engine = new SkillChallengeEngine(901);
  engine.primeForSkillTest([{
    type: 'set-status',
    slot: 'debuff',
    status: {
      id: 'rice-thick-cable',
      sourceAppliance: 'rice-cooker',
      iconId: 'debuff-rice-thick-cable',
      turnsRemaining: 3,
      targetCableIds: [],
      payload: {},
      createdBySkillEventIndex: 0,
    },
  }]);
  engine.beginManualPull('coffee', 'coffee-maker', false);
  engine.commitManualRemoval('coffee', true);
  const suppressed = engine.resolveConnected({
    remainingCables: [{ id: 'a', color: 1, available: true, fakePlug: false }],
    availableCableIds: ['a'],
    removalSequence: ['a'],
    routeColors: [1, 2],
    state: engine.state,
  }, false);
  expect(suppressed.resolution).toBeNull();
  expect(suppressed.debuffSuppressed).toBe(true);
  expect(skillConnectionVisualPolicy('coffee-maker').screenEffect).toBe('coffee-lock');
});
