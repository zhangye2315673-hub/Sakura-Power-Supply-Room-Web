import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import { availableCableEnds, makeRuntime } from '../src/puzzle/collision';
import {
  FAN_SKILL_TEST,
  HUMIDIFIER_SKILL_TEST,
  LAMP_SKILL_TEST,
  KETTLE_SKILL_TEST,
  MICROWAVE_SKILL_TEST,
  COFFEE_MAKER_SKILL_TEST,
  RICE_COOKER_SKILL_TEST,
  PHONE_SKILL_TEST,
  ROBOT_VACUUM_SKILL_TEST,
  BUBBLE_MACHINE_SKILL_TEST,
  GUMBALL_MACHINE_SKILL_TEST,
  POPCORN_MACHINE_SKILL_TEST,
  ALARM_CLOCK_SKILL_TEST,
  SMART_BIN_SKILL_TEST,
  RECORD_PLAYER_SKILL_TEST,
  STAND_MIXER_SKILL_TEST,
  PRINTER_SKILL_TEST,
  INDUCTION_COOKTOP_SKILL_TEST,
  BLENDER_SKILL_TEST,
  DEHUMIDIFIER_SKILL_TEST,
  PORTABLE_SPEAKER_SKILL_TEST,
  RADIO_SKILL_TEST,
  REFRIGERATOR_SKILL_TEST,
  TELEVISION_SKILL_TEST,
  TOASTER_SKILL_TEST,
  WASHER_SKILL_TEST,
  buildSkillTestPuzzle,
} from '../src/skill/SkillTestMode';
import { SoundWaveShieldPresentation } from '../src/skill/SoundWaveShieldPresentation';
import { DehumidifierDryShieldPresentation } from '../src/skill/DehumidifierDryShieldPresentation';
import {
  PORTABLE_SPEAKER_SPACING_MULTIPLIER,
  PORTABLE_SPEAKER_SPACING_RELEASE_DURATION,
  PortableSpeakerSpacingPresentation,
  portableSpeakerSpacingMultiplierAt,
} from '../src/skill/PortableSpeakerSpacingPresentation';
import { PetalField } from '../src/systems/PetalField';
import { PAL } from '../src/style/palette';

const ARTIFACT_DIR = path.resolve('artifacts/fan-skill-test');

test('lamp skill test fixture keeps one readable dependency among four short cables', () => {
  const puzzle = buildSkillTestPuzzle(LAMP_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([LAMP_SKILL_TEST.accent]));
  expect(availableIds.has('lamp-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set(['lamp-test-key', 'lamp-test-side', 'lamp-test-depth']));
});

test('fan skill test fixture preserves the same readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(FAN_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([FAN_SKILL_TEST.accent]));
  expect(availableIds.has('fan-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set(['fan-test-key', 'fan-test-side', 'fan-test-depth']));
});

test('humidifier skill test fixture starts clear with the same four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(HUMIDIFIER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(HUMIDIFIER_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([HUMIDIFIER_SKILL_TEST.accent]));
  expect(availableIds.has('humidifier-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'humidifier-test-key',
    'humidifier-test-side',
    'humidifier-test-depth',
  ]));
});

test('radio skill test leaves three ordered cables after its trigger connection', () => {
  const puzzle = buildSkillTestPuzzle(RADIO_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(RADIO_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([RADIO_SKILL_TEST.accent]));
  expect(availableIds.has('radio-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set(['radio-test-key', 'radio-test-side', 'radio-test-depth']));
  expect(puzzle.solution).toEqual([
    'radio-test-key',
    'radio-test-blocked',
    'radio-test-side',
    'radio-test-depth',
  ]);
});

test('television skill test exposes the same readable topology for fault reconstruction', () => {
  const puzzle = buildSkillTestPuzzle(TELEVISION_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(TELEVISION_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([TELEVISION_SKILL_TEST.accent]));
  expect(availableIds.has('television-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'television-test-key',
    'television-test-side',
    'television-test-depth',
  ]));
});

test('toaster skill test exposes the same readable topology for double-sided toast', () => {
  const puzzle = buildSkillTestPuzzle(TOASTER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(TOASTER_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([TOASTER_SKILL_TEST.accent]));
  expect(availableIds.has('toaster-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'toaster-test-key',
    'toaster-test-side',
    'toaster-test-depth',
  ]));
  expect(puzzle.solution).toEqual([
    'toaster-test-key',
    'toaster-test-blocked',
    'toaster-test-side',
    'toaster-test-depth',
  ]);
});

test('refrigerator skill test exposes enough exits for the freeze-plugs debuff', () => {
  const puzzle = buildSkillTestPuzzle(REFRIGERATOR_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(REFRIGERATOR_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([REFRIGERATOR_SKILL_TEST.accent]));
  expect(availableIds.has('refrigerator-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'refrigerator-test-key',
    'refrigerator-test-side',
    'refrigerator-test-depth',
  ]));
});

test('washer skill test fixture exposes the three initial exits for spin-remove', () => {
  const puzzle = buildSkillTestPuzzle(WASHER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(WASHER_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([WASHER_SKILL_TEST.accent]));
  expect(availableIds.has('washer-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'washer-test-key',
    'washer-test-side',
    'washer-test-depth',
  ]));
  expect(puzzle.solution).toEqual([
    'washer-test-key',
    'washer-test-blocked',
    'washer-test-side',
    'washer-test-depth',
  ]);
});

test('microwave skill test fixture exposes three choices for timed-meal', () => {
  const puzzle = buildSkillTestPuzzle(MICROWAVE_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(MICROWAVE_SKILL_TEST.initialCommands).toEqual([]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([MICROWAVE_SKILL_TEST.accent]));
  expect(availableIds.has('microwave-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'microwave-test-key',
    'microwave-test-side',
    'microwave-test-depth',
  ]));
  expect(puzzle.solution).toEqual([
    'microwave-test-key',
    'microwave-test-blocked',
    'microwave-test-side',
    'microwave-test-depth',
  ]);
});

test('kettle skill test fixture primes three frozen plugs and leaves one thaw trigger available', () => {
  const puzzle = buildSkillTestPuzzle(KETTLE_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));
  const primed = KETTLE_SKILL_TEST.initialCommands[0];

  expect(puzzle.arrows).toHaveLength(4);
  expect(KETTLE_SKILL_TEST.applianceDefinition.id).toBe('kettle');
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color))).toEqual(new Set([KETTLE_SKILL_TEST.accent]));
  expect(availableIds).toEqual(new Set(['kettle-test-key', 'kettle-test-side', 'kettle-test-depth']));
  expect(primed?.type).toBe('set-status');
  if (primed?.type !== 'set-status') throw new Error('Kettle skill test must prime frozen-plug.');
  expect(primed.status.id).toBe('frozen-plug');
  expect(primed.status.turnsRemaining).toBe(3);
  expect(primed.status.targetCableIds).toEqual([
    'kettle-test-blocked',
    'kettle-test-side',
    'kettle-test-depth',
  ]);
});

test('coffee maker skill test fixture uses the seven cables required by its full skill lifecycle', () => {
  const puzzle = buildSkillTestPuzzle(COFFEE_MAKER_SKILL_TEST);
  expect(puzzle.arrows).toHaveLength(7);
  expect(puzzle.solution).toHaveLength(7);
  expect(puzzle.initiallyFree).toBe(7);
  expect(COFFEE_MAKER_SKILL_TEST.applianceDefinition.id).toBe('coffee-maker');
  expect(COFFEE_MAKER_SKILL_TEST.initialCommands).toEqual([]);
});

test('rice cooker skill test fixture keeps one trigger, three thick-cable turns, and one recovery cable', () => {
  const puzzle = buildSkillTestPuzzle(RICE_COOKER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(5);
  expect(puzzle.solution).toEqual(puzzle.arrows.map(({ id }) => id));
  expect(puzzle.initiallyFree).toBe(5);
  expect(availableIds).toEqual(new Set(puzzle.arrows.map(({ id }) => id)));
  expect(RICE_COOKER_SKILL_TEST.applianceDefinition.id).toBe('rice-cooker');
  expect(RICE_COOKER_SKILL_TEST.initialCommands).toEqual([]);
});

test('phone skill test fixture keeps one trigger, three disguise candidates, and one control cable', () => {
  const puzzle = buildSkillTestPuzzle(PHONE_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(5);
  expect(puzzle.solution).toEqual(puzzle.arrows.map(({ id }) => id));
  expect(puzzle.initiallyFree).toBe(5);
  expect(availableIds).toEqual(new Set(puzzle.arrows.map(({ id }) => id)));
  expect(PHONE_SKILL_TEST.applianceDefinition.id).toBe('phone');
  expect(PHONE_SKILL_TEST.initialCommands).toEqual([]);
});

test('robot vacuum skill test fixture snapshots three free cables without chaining into the blocked cable', () => {
  const puzzle = buildSkillTestPuzzle(ROBOT_VACUUM_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(5);
  expect(puzzle.solution).toEqual([
    'robot-vacuum-test-trigger',
    'robot-vacuum-test-key',
    'robot-vacuum-test-blocked',
    'robot-vacuum-test-side',
    'robot-vacuum-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(4);
  expect(availableIds).toEqual(new Set([
    'robot-vacuum-test-trigger',
    'robot-vacuum-test-key',
    'robot-vacuum-test-side',
    'robot-vacuum-test-depth',
  ]));
  expect(availableIds.has('robot-vacuum-test-blocked')).toBe(false);
  expect(ROBOT_VACUUM_SKILL_TEST.applianceDefinition.id).toBe('robot-vacuum');
  expect(ROBOT_VACUUM_SKILL_TEST.initialCommands).toEqual([]);
});

test('bubble machine skill test fixture keeps one blocked cable available for shield verification', () => {
  const puzzle = buildSkillTestPuzzle(BUBBLE_MACHINE_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'bubble-machine-test-key',
    'bubble-machine-test-blocked',
    'bubble-machine-test-side',
    'bubble-machine-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'bubble-machine-test-key',
    'bubble-machine-test-side',
    'bubble-machine-test-depth',
  ]));
  expect(availableIds.has('bubble-machine-test-blocked')).toBe(false);
  expect(BUBBLE_MACHINE_SKILL_TEST.applianceDefinition.id).toBe('bubble-machine');
  expect(BUBBLE_MACHINE_SKILL_TEST.initialCommands).toEqual([]);
});

test('gumball machine skill test fixture preserves the readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(GUMBALL_MACHINE_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'gumball-machine-test-key',
    'gumball-machine-test-blocked',
    'gumball-machine-test-side',
    'gumball-machine-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'gumball-machine-test-key',
    'gumball-machine-test-side',
    'gumball-machine-test-depth',
  ]));
  expect(availableIds.has('gumball-machine-test-blocked')).toBe(false);
  expect(GUMBALL_MACHINE_SKILL_TEST.applianceDefinition.id).toBe('gumball-machine');
  expect(GUMBALL_MACHINE_SKILL_TEST.initialCommands).toEqual([]);
});

test('popcorn machine skill test fixture preserves the readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(POPCORN_MACHINE_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'popcorn-machine-test-key',
    'popcorn-machine-test-blocked',
    'popcorn-machine-test-side',
    'popcorn-machine-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'popcorn-machine-test-key',
    'popcorn-machine-test-side',
    'popcorn-machine-test-depth',
  ]));
  expect(availableIds.has('popcorn-machine-test-blocked')).toBe(false);
  expect(POPCORN_MACHINE_SKILL_TEST.applianceDefinition.id).toBe('popcorn-machine');
  expect(POPCORN_MACHINE_SKILL_TEST.initialCommands).toEqual([]);
});

test('alarm clock skill test fixture starts with a timed status to fast-forward', () => {
  const puzzle = buildSkillTestPuzzle(ALARM_CLOCK_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'alarm-clock-test-key',
    'alarm-clock-test-blocked',
    'alarm-clock-test-side',
    'alarm-clock-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'alarm-clock-test-key',
    'alarm-clock-test-side',
    'alarm-clock-test-depth',
  ]));
  expect(ALARM_CLOCK_SKILL_TEST.applianceDefinition.id).toBe('alarm-clock');
  expect(ALARM_CLOCK_SKILL_TEST.initialCommands).toHaveLength(1);
  expect(ALARM_CLOCK_SKILL_TEST.initialCommands[0]).toEqual(expect.objectContaining({
    type: 'set-status',
    slot: 'debuff',
  }));
});

test('smart bin skill test fixture preserves the readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(SMART_BIN_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'smart-bin-test-key',
    'smart-bin-test-blocked',
    'smart-bin-test-side',
    'smart-bin-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'smart-bin-test-key',
    'smart-bin-test-side',
    'smart-bin-test-depth',
  ]));
  expect(SMART_BIN_SKILL_TEST.applianceDefinition.id).toBe('smart-bin');
  expect(SMART_BIN_SKILL_TEST.initialCommands).toEqual([]);
});

test('record player skill test fixture preserves the readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(RECORD_PLAYER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'record-player-test-key',
    'record-player-test-blocked',
    'record-player-test-side',
    'record-player-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'record-player-test-key',
    'record-player-test-side',
    'record-player-test-depth',
  ]));
  expect(RECORD_PLAYER_SKILL_TEST.applianceDefinition.id).toBe('record-player');
  expect(RECORD_PLAYER_SKILL_TEST.initialCommands).toEqual([]);
});

test('stand mixer skill test primes a five-turn visible debuff', () => {
  const puzzle = buildSkillTestPuzzle(STAND_MIXER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));
  const primed = STAND_MIXER_SKILL_TEST.initialCommands[0];

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'stand-mixer-test-key',
    'stand-mixer-test-blocked',
    'stand-mixer-test-side',
    'stand-mixer-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'stand-mixer-test-key',
    'stand-mixer-test-side',
    'stand-mixer-test-depth',
  ]));
  expect(STAND_MIXER_SKILL_TEST.applianceDefinition.id).toBe('stand-mixer');
  expect(primed?.type).toBe('set-status');
  if (primed?.type !== 'set-status') throw new Error('Stand mixer skill test must prime rice-thick-cable.');
  expect(primed.slot).toBe('debuff');
  expect(primed.status.id).toBe('rice-thick-cable');
  expect(primed.status.turnsRemaining).toBe(5);
  expect(primed.status.targetCableIds).toEqual(puzzle.arrows.map((arrow) => arrow.id));
});

test('printer skill test preserves the readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(PRINTER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'printer-test-key',
    'printer-test-blocked',
    'printer-test-side',
    'printer-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'printer-test-key',
    'printer-test-side',
    'printer-test-depth',
  ]));
  expect(PRINTER_SKILL_TEST.applianceDefinition.id).toBe('printer');
  expect(PRINTER_SKILL_TEST.initialCommands).toEqual([]);
});

test('induction cooktop skill test preserves the readable four-cable topology', () => {
  const puzzle = buildSkillTestPuzzle(INDUCTION_COOKTOP_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'induction-cooktop-test-key',
    'induction-cooktop-test-blocked',
    'induction-cooktop-test-side',
    'induction-cooktop-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'induction-cooktop-test-key',
    'induction-cooktop-test-side',
    'induction-cooktop-test-depth',
  ]));
  expect(INDUCTION_COOKTOP_SKILL_TEST.applianceDefinition.id).toBe('induction-cooktop');
  expect(INDUCTION_COOKTOP_SKILL_TEST.initialCommands).toEqual([]);
});

test('blender skill test keeps a readable multicolor shuffle fixture', () => {
  const puzzle = buildSkillTestPuzzle(BLENDER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'blender-test-key',
    'blender-test-blocked',
    'blender-test-side',
    'blender-test-depth',
  ]);
  expect(new Set(puzzle.arrows.map((arrow) => arrow.color)).size).toBe(4);
  expect(new Set(
    puzzle.arrows
      .filter((arrow) => arrow.id !== 'blender-test-side')
      .map((arrow) => arrow.color),
  ).size).toBe(3);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'blender-test-key',
    'blender-test-side',
    'blender-test-depth',
  ]));
  expect(BLENDER_SKILL_TEST.applianceDefinition.id).toBe('blender');
  expect(BLENDER_SKILL_TEST.initialCommands).toEqual([]);
});

test('dehumidifier skill test keeps a readable dry-shield fixture', () => {
  const puzzle = buildSkillTestPuzzle(DEHUMIDIFIER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.solution).toEqual([
    'dehumidifier-test-key',
    'dehumidifier-test-blocked',
    'dehumidifier-test-side',
    'dehumidifier-test-depth',
  ]);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds).toEqual(new Set([
    'dehumidifier-test-key',
    'dehumidifier-test-side',
    'dehumidifier-test-depth',
  ]));
  expect(DEHUMIDIFIER_SKILL_TEST.applianceDefinition.id).toBe('dehumidifier');
  expect(DEHUMIDIFIER_SKILL_TEST.initialCommands).toEqual([]);
});

test('portable speaker skill test keeps a readable four-cable rhythm fixture', () => {
  const puzzle = buildSkillTestPuzzle(PORTABLE_SPEAKER_SKILL_TEST);
  const availableIds = new Set(availableCableEnds(puzzle.arrows.map(makeRuntime)).map(({ id }) => id));

  expect(puzzle.arrows).toHaveLength(4);
  expect(puzzle.initiallyFree).toBe(3);
  expect(availableIds.has('portable-speaker-test-blocked')).toBe(false);
  expect(availableIds).toEqual(new Set([
    'portable-speaker-test-key',
    'portable-speaker-test-side',
    'portable-speaker-test-depth',
  ]));
  expect(PORTABLE_SPEAKER_SKILL_TEST.applianceDefinition.id).toBe('portable-speaker');
  expect(PORTABLE_SPEAKER_SKILL_TEST.initialCommands).toEqual([]);
});

test('portable speaker spacing pulses on the shared beat timeline and doubles only cable spacing', () => {
  expect(portableSpeakerSpacingMultiplierAt(0.38)).toBeLessThan(1);
  expect(portableSpeakerSpacingMultiplierAt(0.485)).toBeGreaterThan(1);

  const presentation = new PortableSpeakerSpacingPresentation();
  const applied = new Map<string, THREE.Vector3>();
  const targets = [-1, 0, 1].map((x, index) => ({
    id: `speaker-spacing-${index + 1}`,
    center: new THREE.Vector3(x, 0, 0),
    setOffset: (offset: THREE.Vector3) => applied.set(`speaker-spacing-${index + 1}`, offset.clone()),
  }));
  presentation.start(targets);
  presentation.update(presentation.durationMs / 1_000, targets);

  expect(presentation.diagnostics.phase).toBe('holding');
  expect(presentation.diagnostics.multiplier).toBe(PORTABLE_SPEAKER_SPACING_MULTIPLIER);
  const left = targets[0].center.clone().add(applied.get(targets[0].id)!);
  const right = targets[2].center.clone().add(applied.get(targets[2].id)!);
  expect(left.distanceTo(right)).toBeCloseTo(4, 5);
  expect(targets[0].center.distanceTo(targets[2].center)).toBeCloseTo(2, 5);

  presentation.sync(false, targets);
  presentation.update(PORTABLE_SPEAKER_SPACING_RELEASE_DURATION, targets);
  expect(presentation.diagnostics.phase).toBe('idle');
  expect([...applied.values()].every((offset) => offset.length() < 0.00001)).toBe(true);
});

test('dehumidifier dry shield uses transient extraction sweeps for turns and absorption', () => {
  const presentation = new DehumidifierDryShieldPresentation();
  const geometry = new THREE.BoxGeometry(2, 1.2, 1.5);
  const material = new THREE.MeshBasicMaterial();
  const target = new THREE.Mesh(geometry, material);
  target.position.set(0.4, 0.2, -0.1);
  target.updateWorldMatrix(true, true);
  const source = new THREE.Vector3(-4, -1, 2);

  presentation.update(0, 10);
  presentation.sync(true, 3, [target], source);
  expect(presentation.diagnostics.phase).toBe('arming');
  expect(presentation.diagnostics.sweepCycles).toBe(3);
  expect(presentation.diagnostics.persistentGeometry).toBe(false);
  expect(presentation.diagnostics.shieldShape).toBe('open-three-panel-air-canopy');
  expect(presentation.diagnostics.airflowMode).toBe('directional-stream-ribbons');
  expect(presentation.diagnostics.outletOpen).toBe(true);

  presentation.update(0, 15.3);
  expect(presentation.diagnostics.phase).toBe('idle');
  expect(presentation.diagnostics.visible).toBe(false);
  presentation.sync(true, 2, [target], source);
  expect(presentation.diagnostics.phase).toBe('turn-pulse');
  expect(presentation.diagnostics.turnPulseCount).toBe(1);
  expect(presentation.diagnostics.sweepCycles).toBe(1);

  presentation.update(0, 17);
  presentation.sync(false, null, [], source);
  expect(presentation.diagnostics.phase).toBe('absorb');
  expect(presentation.diagnostics.absorbCount).toBe(1);

  presentation.dispose();
  geometry.dispose();
  material.dispose();
});

test('seasonal petals follow the dehumidifier canopy outer arc only while visible', () => {
  const petals = new PetalField(28);
  petals.setCanopyFlow({
    active: true,
    center: new THREE.Vector3(0.4, 0.7, -0.2),
    direction: new THREE.Vector3(-1, -0.2, 0.3),
    radius: 3.1,
    strength: 0.8,
  });
  petals.update(1 / 60);
  expect(petals.canopyFlowState.active).toBe(true);
  expect(petals.canopyFlowState.particleCount).toBeGreaterThanOrEqual(8);
  expect(petals.canopyFlowState.path).toBe('open-canopy-outer-arc');
  expect(petals.canopyFlowState.seasonalProps).toBe(true);
  expect(Math.hypot(...petals.canopyFlowState.direction)).toBeCloseTo(1, 4);

  petals.setCanopyFlow({
    active: false,
    center: new THREE.Vector3(),
    direction: new THREE.Vector3(1, 0, 0),
    radius: 0,
    strength: 0,
  });
  expect(petals.canopyFlowState.active).toBe(false);
  expect(petals.canopyFlowState.particleCount).toBe(0);
  petals.dispose();
});

test('record player sound-wave shield repeats only while protection remains unused', () => {
  const presentation = new SoundWaveShieldPresentation();
  const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const material = new THREE.MeshBasicMaterial();
  const targets = [-0.7, 0, 0.7].map((x) => {
    const target = new THREE.Mesh(geometry, material);
    target.position.x = x;
    return target;
  });
  const startedAt = performance.now() / 1000;

  presentation.sync(true, targets);
  expect(presentation.diagnostics.phase).toBe('arming');
  expect(presentation.diagnostics.protected).toBe(true);
  expect(presentation.diagnostics.appearanceRingCycles).toBe(4);
  presentation.update(0, startedAt + 1);
  expect(presentation.diagnostics.surfaceRingProgress).toBeGreaterThan(0);
  presentation.update(0, startedAt + 5.3);
  presentation.update(0, startedAt + 5.4);
  presentation.update(0, startedAt + 14);
  expect(presentation.diagnostics.phase).toBe('reminder');
  expect(presentation.diagnostics.reminderCount).toBe(1);
  expect(presentation.diagnostics.appearanceRingCycles).toBe(3);

  presentation.sync(false, targets);
  presentation.playImpact(new THREE.Vector3(1, 0, 0));
  expect(presentation.diagnostics.phase).toBe('impact');
  expect(presentation.diagnostics.impactCount).toBe(1);
  expect(presentation.diagnostics.appearanceRingCycles).toBe(1);
  presentation.update(0, startedAt + 40);
  expect(presentation.diagnostics.phase).toBe('idle');
  expect(presentation.diagnostics.protected).toBe(false);
  expect(presentation.diagnostics.reminderCount).toBe(1);

  presentation.dispose();
  geometry.dispose();
  material.dispose();
});

test('coffee maker splash is transient and keeps the appliance readable', async ({ page }, testInfo) => {
  test.setTimeout(360_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
    window.__COFFEE_SPLASH_PROGRESS_OVERRIDE__ = 0.18;
    window.__COFFEE_STAIN_PROGRESS_OVERRIDE__ = 0.55;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=coffee-maker&seed=20260820');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.skill?.testId === 'coffee-maker'
      && diagnostics.totalArrows === 7;
  }, null, { timeout: 90_000 });
  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined; });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.inputLocked === false, null, { timeout: 30_000 });
  let pulled = false;
  for (let attempt = 0; attempt < 900 && !pulled; attempt += 1) {
    pulled = await page.evaluate(() => {
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
      const result = window.__PULL_CABLE_FOR_EVIDENCE__?.() ?? false;
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined;
      return result;
    });
    if (!pulled) await page.waitForTimeout(100);
  }
  expect(pulled).toBe(true);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === 'coffee-lock'
    && window.__THREE_GAME_DIAGNOSTICS__?.skill?.screenEffect.splashActive === true, null, { timeout: 45_000 });

  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const remaining = diagnostics?.skill?.remainingCableIds ?? [];
    const effects = diagnostics?.skill?.cableEffects ?? [];
    return remaining.length > 0 && remaining.every((id) => {
      const effect = effects.find((entry) => entry.id === id);
      return effect !== undefined && effect.coffeeStainAmount > 0.35 && effect.coffeeStainReveal > 0;
    });
  }, null, { timeout: 45_000 });

  const splash = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(splash.sceneVisibility.appliances).toBe(true);
  expect(splash.appliances[0].screenWidth).toBeGreaterThan(0);
  const stainReveals = splash.skill?.remainingCableIds.map((id) =>
    splash.skill?.cableEffects.find((entry) => entry.id === id)?.coffeeStainReveal ?? 0) ?? [];
  expect(Math.max(...stainReveals) - Math.min(...stainReveals)).toBeGreaterThan(0.04);
  for (const [progress, name] of [[0.18, 'impact'], [0.48, 'hang'], [0.78, 'fade']] as const) {
    await page.evaluate((value) => { window.__COFFEE_SPLASH_PROGRESS_OVERRIDE__ = value; }, progress);
    await page.waitForFunction(
      (value) => Math.abs((window.__THREE_GAME_DIAGNOSTICS__?.skill?.screenEffect.splashProgress ?? -1) - value) < 0.005,
      progress,
      { timeout: 10_000 },
    );
    expect((await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!)).skill?.screenEffect.splashProgress)
      .toBeCloseTo(progress, 2);
    await page.screenshot({ path: testInfo.outputPath(`coffee-splash-${name}.png`) });
  }

  await page.evaluate(() => {
    window.__COFFEE_SPLASH_PROGRESS_OVERRIDE__ = undefined;
    window.__COFFEE_STAIN_PROGRESS_OVERRIDE__ = undefined;
  });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.screenEffect.splashActive === false,
    null, { timeout: 10_000 });
  expect((await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!)).skill?.debuff).toBe('coffee-lock');
});

test('alarm clock skill test fast-forwards time without the removed blue ring', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=alarm-clock&seed=20260825');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.opening.transitioning === false
        && diagnostics.skill?.testId === 'alarm-clock'
        && diagnostics.totalArrows === 4;
    },
    null,
    { timeout: 90_000 },
  );

  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(diagnostics.totalArrows).toBe(4);
  expect(diagnostics.availableArrows).toBe(3);
  expect(diagnostics.skill?.buff).toBeNull();
  expect(diagnostics.skill?.debuff).toBe('bathroom-steam');
  expect(diagnostics.skill?.debuffTurnsRemaining).toBe(3);
  expect(diagnostics.skill?.screenEffect.mode).toBe('none');
  expect(diagnostics.skill?.effectAssets).not.toContain('popcorn-target-marker');
  expect(diagnostics.skill?.effectAssets).not.toContain('alarm-time-ring');
  expect(diagnostics.appliances.map(({ kind }) => kind)).toEqual(['alarm-clock']);
  await expect(page.locator('#skill-debuff-slot')).toBeVisible();
  await expect(page.locator('#skill-debuff-slot')).toHaveAttribute('data-status', 'bathroom-steam');
  await expect(page.locator('#skill-debuff-slot .skill-status-count')).toHaveText('3');
  expect(await page.evaluate(() => window.__PULL_CABLE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.skill?.phase === 'idle'
        && diagnostics.skill.inputLocked === false
        && diagnostics.skill.debuffTurnsRemaining === 1
        && diagnostics.activeAnimations === 0
        && diagnostics.queuedConnections === 0
        && diagnostics.activeConnections === 0;
    },
    null,
    { timeout: 90_000 },
  );
  await expect(page.locator('#skill-debuff-slot .skill-status-count')).toHaveText('1');
  await page.waitForURL((url) => url.searchParams.get('skill') === 'alarm-clock'
    && url.searchParams.get('layout') === null);
  const url = new URL(page.url());
  expect(url.searchParams.get('skill')).toBe('alarm-clock');
  expect(url.searchParams.get('layout')).toBeNull();
});

test('record player skill test keeps its finalized transient sound-wave shield', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=record-player&seed=20260825');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.opening.transitioning === false
        && diagnostics.skill?.testId === 'record-player'
        && diagnostics.totalArrows === 4;
    },
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.availableArrows).toBe(3);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['record-player']);
  expect(initial.skill?.buff).toBeNull();
  expect(initial.skill?.debuff).toBeNull();
  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('record-player-test-side') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.buff === 'soothing-record'
      && !diagnostics.skill.effectAssets.includes('record-note-orb-ring')
      && diagnostics.skill.soundWaveShield.protected
      && diagnostics.skill.soundWaveShield.targetCount === 3
      && diagnostics.skill.soundWaveShield.depthWrite === false
      && diagnostics.skill.soundWaveShield.persistentGeometry === false;
  }, null, { timeout: 45_000 });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.skill.buff === 'soothing-record'
      && diagnostics.skill.soundWaveShield.protected
      && diagnostics.skill.soundWaveShield.phase === 'idle'
      && diagnostics.skill.soundWaveShield.visible === false
      && diagnostics.skill.soundWaveShield.idleVisibility === 0
      && diagnostics.remainingArrows === 3
      && diagnostics.activeAnimations === 0
      && diagnostics.activeConnections === 0;
  }, null, { timeout: 45_000 });
  const settled = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(settled.skill?.lives).toBe(3);
  expect(settled.skill?.maxLives).toBe(3);
  expect(settled.skill?.debuff).toBeNull();
  await expect(page.locator('#skill-buff-slot')).toHaveAttribute('data-status', 'soothing-record');
  const reminderCountBefore = settled.skill!.soundWaveShield.reminderCount;
  await page.waitForFunction((previousCount) => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.buff === 'soothing-record'
      && diagnostics.skill.soundWaveShield.protected
      && diagnostics.skill.soundWaveShield.reminderCount > previousCount
      && diagnostics.skill.soundWaveShield.reminderInterval >= 8;
  }, reminderCountBefore, { timeout: 15_000 });
  await page.waitForFunction((minimumCount) => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.soundWaveShield.phase === 'idle'
      && diagnostics.skill.soundWaveShield.visible === false
      && diagnostics.skill.soundWaveShield.reminderCount >= minimumCount;
  }, reminderCountBefore + 1, { timeout: 15_000 });
  const blocked = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.blockedClickTarget);
  expect(blocked?.id).toBe('record-player-test-blocked');
  expect(await page.evaluate(() => (
    window.__PULL_CABLE_FOR_EVIDENCE__?.('record-player-test-blocked', 'head') ?? false
  ))).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.buff === null
      && diagnostics.skill.soundWaveShield.protected === false
      && diagnostics.skill.soundWaveShield.impactCount === 1;
  }, null, { timeout: 15_000 });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.soundWaveShield.phase === 'idle'
      && diagnostics.skill.soundWaveShield.visible === false
      && diagnostics.skill.lives === 3
      && diagnostics.remainingArrows === 3;
  }, null, { timeout: 30_000 });
  await page.waitForURL((url) => url.searchParams.get('skill') === 'record-player'
    && url.searchParams.get('layout') === null);
});

test('stand mixer skill test preserves its finalized normalization presentation', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=stand-mixer&seed=20260826');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'stand-mixer'
        && diagnostics.skill.debuff === 'rice-thick-cable'
        && diagnostics.skill.debuffTurnsRemaining === 5
        && diagnostics.skill.inputLocked === false
        && diagnostics.activeAnimations === 0
        && diagnostics.activeConnections === 0
        && diagnostics.totalArrows === 4;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.availableArrows).toBe(3);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['stand-mixer']);
  expect(initial.skill?.buff).toBeNull();
  await expect(page.locator('#skill-status-rack')).toBeVisible();
  await expect(page.locator('#skill-debuff-slot')).toHaveAttribute('data-status', 'rice-thick-cable');
  await expect(page.locator('#skill-debuff-slot .skill-status-count')).toHaveText('5');

  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('stand-mixer-test-side') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.presentation.skillId === 'normalize-statuses'
      && diagnostics.skill.presentation.lineCount === 3
      && diagnostics.skill.presentation.meshCount === 0
      && diagnostics.skill.presentation.sweepPassCount === 2
      && !diagnostics.skill.effectAssets.includes('stand-mixer-status-token');
  }, null, { timeout: 15_000 });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.skill.debuff === 'rice-thick-cable'
      && diagnostics.skill.debuffTurnsRemaining === 2
      && diagnostics.remainingArrows === 3;
  }, null, { timeout: 45_000 });
  await expect(page.locator('#skill-debuff-slot .skill-status-count')).toHaveText('2');
  await expect(page.locator('#skill-buff-slot')).toHaveAttribute('data-status', 'empty');
  await page.waitForURL((url) => url.searchParams.get('skill') === 'stand-mixer'
    && url.searchParams.get('layout') === null);
});

test('printer skill test stores and consumes one copied pull', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=printer&seed=20260826');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.opening.transitioning === false
        && diagnostics.skill?.testId === 'printer'
        && diagnostics.skill.printerCopyReady === false
        && diagnostics.skill.inputLocked === false
        && diagnostics.activeAnimations === 0
        && diagnostics.activeConnections === 0
        && diagnostics.totalArrows === 4;
    },
    null,
    { timeout: 90_000 },
  );

  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('printer-test-side') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.printerCopyReady === true
      && diagnostics.skill.screenEffect.mode === 'printer-scan';
  }, null, { timeout: 60_000 });
  await expect(page.locator('#skill-printer-pending')).toBeVisible();
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.skill.printerCopyReady === true
      && diagnostics.remainingArrows === 3
      && diagnostics.activeAnimations === 0
      && diagnostics.activeConnections === 0;
  }, null, { timeout: 90_000 });
  await expect(page.locator('#skill-printer-pending')).toBeVisible();
  await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return (diagnostics?.availableArrows ?? 0) > 0
      && diagnostics?.appliances.some(({ kind, state }) => kind === 'printer' && state === 'idle') === true;
  }, null, { timeout: 30_000 });

  const copiedExit = await page.evaluate(() => {
    const pulled = window.__PULL_CABLE_FOR_EVIDENCE__?.() ?? false;
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return {
      pulled,
      printerCopyReady: diagnostics?.skill?.printerCopyReady,
      remainingArrows: diagnostics?.remainingArrows,
      motion: diagnostics?.activeMotion,
    };
  });
  expect(copiedExit.pulled).toBe(true);
  expect(copiedExit.printerCopyReady).toBe(false);
  expect(copiedExit.remainingArrows).toBe(2);
  expect(copiedExit.motion).toMatchObject({ kind: 'exit', targetId: null });
  await expect(page.locator('#skill-printer-pending')).not.toBeVisible();
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.skill.printerCopyReady === false
      && diagnostics.remainingArrows === 1
      && diagnostics.activeAnimations === 0
      && diagnostics.activeConnections === 0;
  }, null, { timeout: 90_000 });
  await expect(page.locator('#skill-printer-pending')).not.toBeVisible();
  await page.waitForURL((url) => url.searchParams.get('skill') === 'printer'
    && url.searchParams.get('layout') === null);
});

test('direct dehumidifier test preserves the finalized dry-shield skill', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&skill=dehumidifier&direct=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'dehumidifier'
        && diagnostics.skill.inputLocked === false
        && diagnostics.totalArrows === 4
        && diagnostics.appliances.some(({ kind }) => kind === 'dehumidifier');
    },
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('dehumidifier-test-side') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.buff === 'dry-shield'
      && !diagnostics.skill.effectAssets.includes('dehumidifier-shield-droplets')
      && diagnostics.skill.dehumidifierDryShield.protected
      && diagnostics.skill.dehumidifierDryShield.phase === 'arming'
      && diagnostics.skill.dehumidifierDryShield.visible
      && diagnostics.skill.dehumidifierDryShield.targetCount === 3
      && diagnostics.skill.dehumidifierDryShield.turnsRemaining === 3
      && diagnostics.skill.dehumidifierDryShield.sweepCycles === 3
      && diagnostics.skill.dehumidifierCanopyPetals.active
      && diagnostics.skill.dehumidifierCanopyPetals.particleCount >= 8
      && diagnostics.skill.dehumidifierCanopyPetals.path === 'open-canopy-outer-arc'
      && diagnostics.skill.dehumidifierCanopyPetals.seasonalProps;
  }, null, { timeout: 45_000 });
  const armedShield = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.dehumidifierDryShield);
  expect(armedShield.depthWrite).toBe(false);
  expect(armedShield.persistentGeometry).toBe(false);
  expect(armedShield.behavior).toBe('directional-moisture-extraction');
  expect(armedShield.moisturePattern).toBe('condense-and-drain');
  expect(armedShield.shieldShape).toBe('open-three-panel-air-canopy');
  expect(armedShield.airflowMode).toBe('directional-stream-ribbons');
  expect(armedShield.outletOpen).toBe(true);
  expect(Math.hypot(...armedShield.drainDirection)).toBeCloseTo(1, 4);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.skill.buff === 'dry-shield'
      && diagnostics.skill.debuff === null
      && !diagnostics.skill.effectAssets.includes('dehumidifier-shield-droplets')
      && diagnostics.skill.dehumidifierDryShield.protected
      && diagnostics.skill.dehumidifierDryShield.phase === 'idle'
      && diagnostics.skill.dehumidifierDryShield.visible === false
      && diagnostics.skill.dehumidifierDryShield.idleVisibility === 0
      && diagnostics.skill.dehumidifierCanopyPetals.active === false
      && diagnostics.remainingArrows === 3;
  }, null, { timeout: 60_000 });
  await expect(page.locator('#skill-buff-slot')).toBeVisible();
  await expect(page.locator('#skill-buff-slot')).toHaveAttribute('data-status', 'dry-shield');
  await expect(page.locator('#skill-buff-slot .skill-status-count')).toHaveText('3');
  await page.waitForURL((url) => url.searchParams.get('skill') === 'dehumidifier'
    && url.searchParams.get('layout') === null);
});

test('main menu starts the portable speaker three-turn rhythm spacing skill test', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  const startingRevision = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.puzzleRevision ?? 0);
  await page.click('#challenge-mode-button');
  await expect(page.locator('#start-skill-test-button')).toHaveText('便携音箱技能测试');
  await page.click('#start-skill-test-button');
  await page.waitForFunction(
    (revision) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.puzzleRevision > revision
        && diagnostics.skill?.testId === 'portable-speaker'
        && diagnostics.skill.inputLocked === false
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null
        && diagnostics.blockedClickTarget !== null
        && diagnostics.appliances.some(({ kind }) => kind === 'portable-speaker');
    },
    startingRevision,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('portable-speaker-test-side') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.remainingArrows === 3
      && diagnostics.skill.buff === 'bass-spacing'
      && diagnostics.skill.buffTurnsRemaining === 3
      && diagnostics.skill.portableSpeakerSpacing.phase === 'holding'
      && Math.abs(diagnostics.skill.portableSpeakerSpacing.spacingRatio - 2) < 0.001;
  }, null, { timeout: 60_000 });
  await expect(page.locator('#skill-cue-title')).toHaveText('节拍扩距');
  await expect(page.locator('#skill-cue-detail')).toHaveText(
    '线组随音乐逐拍压缩、膨胀，最终保持 2 倍线间距 3 回合；只改变视觉间距，不改变可抽判定。',
  );
  await expect(page.locator('#skill-buff-slot')).toBeVisible();
  await expect(page.locator('#skill-buff-slot')).toHaveAttribute('data-status', 'bass-spacing');
  await expect(page.locator('#skill-buff-slot .skill-status-count')).toHaveText('3');
  const visualState = await page.evaluate(() => {
    const skill = window.__THREE_GAME_DIAGNOSTICS__!.skill!;
    return {
      effectAssets: skill.effectAssets,
      shiftedCableCount: skill.cableEffects.filter(({ bundleSpacingOffsetLength }) => (
        bundleSpacingOffsetLength > 0.01
      )).length,
      thicknesses: skill.cableEffects.map(({ visualThicknessScale }) => visualThicknessScale),
      recycleScales: skill.cableEffects.map(({ recycleScale }) => recycleScale),
    };
  });
  expect(visualState.effectAssets).not.toContain('speaker-bass-wave-arcs');
  expect(visualState.shiftedCableCount).toBeGreaterThanOrEqual(2);
  expect(visualState.thicknesses.every((scale) => scale === 1)).toBe(true);
  expect(visualState.recycleScales.every((scale) => scale === 1)).toBe(true);
  await page.waitForURL((url) => url.searchParams.get('skill') === 'portable-speaker'
    && url.searchParams.get('layout') === null);
});

test('direct blender skill test preserves the finalized multicolor shuffle', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=blender&seed=20260827');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.opening.transitioning === false
        && diagnostics.skill?.testId === 'blender'
        && diagnostics.skill.inputLocked === false
        && diagnostics.totalArrows === 4
        && diagnostics.skill.cableEffects.length === 4
        && diagnostics.appliances.some(({ kind }) => kind === 'blender');
    },
    null,
    { timeout: 90_000 },
  );
  const initialColors = await page.evaluate(() => Object.fromEntries(
    window.__THREE_GAME_DIAGNOSTICS__!.skill!.cableEffects.map(({ id, baseColor }) => [id, baseColor]),
  ));
  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('blender-test-side') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.presentation.skillId === 'color-shuffle'
      && diagnostics.skill.presentation.activeTimelines === 1
      && diagnostics.skill.presentation.colorPreviewActiveCableCount === 3;
  }, null, { timeout: 30_000 });
  const [earlyPreview, committedPreview] = await page.evaluate(() => {
    const capture = (timeMs: number) => {
      const frozen = window.__FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__?.(timeMs) ?? false;
      const skill = window.__THREE_GAME_DIAGNOSTICS__!.skill!;
      const remainingIds = [...skill.remainingCableIds];
      return {
        frozen,
        remainingIds,
        presentation: { ...skill.presentation },
        effects: skill.cableEffects
          .filter(({ id }) => remainingIds.includes(id))
          .map((effect) => ({ ...effect })),
      };
    };
    return [capture(1_200), capture(4_700)] as const;
  });
  expect(earlyPreview.frozen).toBe(true);
  expect(earlyPreview.presentation.colorCommitCount).toBe(0);
  expect(earlyPreview.presentation.colorPreviewActiveCableCount).toBe(3);
  expect(earlyPreview.effects).toHaveLength(3);
  const blenderPalette: number[] = [PAL.red, PAL.yellow, PAL.teal, PAL.blue];
  expect(earlyPreview.effects.every((effect) => effect.skillTintStrength === 1)).toBe(true);
  expect(earlyPreview.effects.every((effect) => effect.skillTintEmissionScale === 0)).toBe(true);
  expect(earlyPreview.effects.every((effect) => effect.glowStrength === 0)).toBe(true);
  expect(earlyPreview.effects.every((effect) => effect.cableColor !== effect.baseColor)).toBe(true);
  expect(earlyPreview.effects.every((effect) => blenderPalette.includes(effect.cableColor))).toBe(true);
  expect(earlyPreview.effects.every((effect) => effect.baseColor === initialColors[effect.id])).toBe(true);

  expect(committedPreview.frozen).toBe(true);
  expect(committedPreview.presentation.colorCommitCount).toBe(3);
  expect(committedPreview.presentation.colorPreviewActiveCableCount).toBe(0);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.remainingArrows === 3;
  }, null, { timeout: 60_000 });
  const shuffled = await page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__!;
    return {
      colors: Object.fromEntries(
        diagnostics.skill!.cableEffects.map(({ id, baseColor }) => [id, baseColor]),
      ),
      remainingIds: diagnostics.skill!.remainingCableIds,
      buff: diagnostics.skill!.buff,
      debuff: diagnostics.skill!.debuff,
      effectAssets: diagnostics.skill!.effectAssets,
    };
  });
  const beforeRemaining = shuffled.remainingIds.map((id) => initialColors[id]);
  const afterRemaining = shuffled.remainingIds.map((id) => shuffled.colors[id]);
  expect([...afterRemaining].sort((left, right) => left - right)).toEqual(
    [...beforeRemaining].sort((left, right) => left - right),
  );
  expect(shuffled.remainingIds.filter((id) => initialColors[id] !== shuffled.colors[id]).length).toBeGreaterThanOrEqual(2);
  expect(shuffled.buff).toBeNull();
  expect(shuffled.debuff).toBeNull();
  expect(shuffled.effectAssets).not.toContain('blender-energy-shards');
  await page.waitForURL((url) => url.searchParams.get('skill') === 'blender'
    && url.searchParams.get('layout') === null);
});

test('direct induction cooktop skill test reveals all real exits for three turns', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=induction-cooktop&seed=20260826');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.opening.transitioning === false
        && diagnostics.skill?.testId === 'induction-cooktop'
        && diagnostics.skill.inputLocked === false
        && diagnostics.totalArrows === 4
        && diagnostics.appliances.some(({ kind }) => kind === 'induction-cooktop');
  }, null, { timeout: 90_000 });
  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('induction-cooktop-test-side') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const marked = diagnostics?.skill?.cableEffects.filter(({ inductionRevealActive }) => inductionRevealActive) ?? [];
    const unmarked = diagnostics?.skill?.cableEffects.filter(({ inductionRevealActive }) => !inductionRevealActive) ?? [];
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.skill.buff === 'induction-reveal'
      && !diagnostics.skill.effectAssets.includes('induction-heat-ring')
      && marked.length === diagnostics.availableArrows
      && marked.every((effect) => effect.inductionRingCount === 2
        && effect.inductionHeatAmount > 0.5
        && effect.inductionRingMotion === 'opposed-path-ping-pong'
        && effect.inductionRingTangentAlignments.every((alignment) => alignment > 0.999))
      && unmarked.every((effect) => effect.inductionRingCount === 0
        && effect.inductionHeatAmount === 0)
      && diagnostics.remainingArrows === 3;
  }, null, { timeout: 60_000 });
  const firstRingState = await page.evaluate(() => {
    const effect = window.__THREE_GAME_DIAGNOSTICS__?.skill?.cableEffects
      .find(({ inductionRevealActive }) => inductionRevealActive);
    return effect?.inductionRingProgresses ?? null;
  });
  expect(firstRingState).not.toBeNull();
  await page.waitForFunction((previous) => {
    const effect = window.__THREE_GAME_DIAGNOSTICS__?.skill?.cableEffects
      .find(({ inductionRevealActive }) => inductionRevealActive);
    if (!effect || !previous) return false;
    const [inner, outer] = effect.inductionRingProgresses;
    return Math.abs(inner - previous[0]) > 0.04
      && Math.abs(outer - previous[1]) > 0.04
      && Math.abs(inner + outer - 1) < 0.001;
  }, firstRingState, { timeout: 10_000 });
  await expect(page.locator('#skill-status-rack')).toBeVisible();
  await expect(page.locator('#skill-buff-slot')).toHaveAttribute('data-status', 'induction-reveal');
  await expect(page.locator('#skill-buff-slot .skill-status-count')).toHaveText('3');
  await page.waitForURL((url) => url.searchParams.get('skill') === 'induction-cooktop'
    && url.searchParams.get('layout') === null);
});

test('smart bin skill test keeps its finalized direct recycle interaction', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=smart-bin&seed=20260825');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.testId === 'smart-bin'
      && diagnostics.totalArrows === 4
      && diagnostics.skill.inputLocked === false;
  }, null, { timeout: 30_000 });

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.availableArrows).toBe(3);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['smart-bin']);
  expect(initial.skill?.buff).toBeNull();
  expect(initial.skill?.debuff).toBeNull();
  expect(await page.evaluate(
    () => window.__PULL_CABLE_FOR_EVIDENCE__?.('smart-bin-test-key') ?? false,
  )).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'select-recycle-target'
      && diagnostics.remainingArrows === 3;
  }, null, { timeout: 45_000 });
  await expect(page.locator('#skill-cue-title')).toHaveText('指定回收');
  await expect(page.locator('#skill-recycle-prompt')).toBeVisible();
  await expect(page.locator('#skill-recycle-prompt strong')).toHaveText('选择任意一根线回收');
  await expect(page.locator('#skill-recycle-prompt small')).toHaveText('按住拖动旋转 · 单击确认回收');

  const canvas = page.locator('canvas').first();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (!canvasBox) throw new Error('Expected the game canvas');
  const orbitBeforeDrag = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.orbit);
  const dragX = canvasBox.x + canvasBox.width * 0.58;
  const dragY = canvasBox.y + canvasBox.height * 0.48;
  await page.mouse.move(dragX, dragY);
  await page.mouse.down();
  await page.mouse.move(dragX - 180, dragY + 24, { steps: 14 });
  await page.mouse.up();
  await page.waitForFunction(
    ({ yaw, pitch }) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.skill?.phase === 'select-recycle-target'
        && diagnostics.remainingArrows === 3
        && (Math.abs(diagnostics.orbit.yaw - yaw) > 0.12
          || Math.abs(diagnostics.orbit.pitch - pitch) > 0.12);
    },
    orbitBeforeDrag,
    { timeout: 10_000 },
  );

  const recycleTarget = await page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__!;
    return diagnostics.blockedClickTarget ?? diagnostics.clickTarget;
  });
  expect(recycleTarget).not.toBeNull();
  if (!recycleTarget) throw new Error('Expected a visible recycle target');
  await page.mouse.move(recycleTarget.x, recycleTarget.y);
  await page.waitForFunction((targetId) => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const effect = diagnostics?.skill?.cableEffects.find(({ id }) => id === targetId);
    return diagnostics?.hoveredArrow === targetId
      && effect?.recycleSelectionState === 'hover'
      && effect.recycleHighlightStrength >= 0.75
      && effect.recycleScale > 1.02;
  }, recycleTarget.id, { timeout: 20_000 });
  await page.mouse.click(recycleTarget.x, recycleTarget.y);
  await page.waitForFunction((targetId) => {
    const effect = window.__THREE_GAME_DIAGNOSTICS__?.skill?.cableEffects.find(({ id }) => id === targetId);
    return effect?.recycleSelectionState === 'selected'
      && effect.recycleHighlightStrength === 1
      && effect.recycleScale === 1
      && window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows === 3;
  }, recycleTarget.id, { timeout: 10_000 });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.phase === 'idle'
      && diagnostics.skill.inputLocked === false
      && diagnostics.remainingArrows === 2
      && diagnostics.activeAnimations === 0
      && diagnostics.activeConnections === 0;
  }, null, { timeout: 45_000 });
  await expect(page.locator('#skill-recycle-prompt')).toBeHidden();
  const settled = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(settled.skill?.remainingCableIds).not.toContain(recycleTarget.id);
  expect(settled.skill?.buff).toBeNull();
  expect(settled.skill?.debuff).toBeNull();
  await page.waitForURL((url) => url.searchParams.get('skill') === 'smart-bin'
    && url.searchParams.get('layout') === null);
});

test('gumball machine skill test opens the three-card sakura gacha selection', async ({ page }) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=gumball-machine&seed=20260824');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.testId === 'gumball-machine'
      && diagnostics.totalArrows === 4
      && diagnostics.skill.inputLocked === false;
  }, null, { timeout: 30_000 });

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['gumball-machine']);
  expect(initial.availableArrows).toBe(3);
  await expect(page.locator('#skill-cue-source')).toHaveText('扭蛋机');
  await expect(page.locator('#skill-cue-title')).toHaveText('樱花三选一');
  await expect(page.locator('#skill-cue-detail')).toHaveText('两张收益卡与一张风险卡的单次选择。');

  expect(await page.evaluate(() => (
    window.__PULL_CABLE_FOR_EVIDENCE__?.('gumball-machine-test-side', 'head') ?? false
  ))).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.cardCount === 3
      && diagnostics.skill.inputLocked === true;
  }, null, { timeout: 45_000 });
  await expect(page.locator('#skill-card-panel')).toHaveClass(/visible/);
  await expect(page.locator('#skill-card-panel')).toHaveCSS('display', 'grid');
  await expect(page.locator('#skill-card-panel')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('#skill-card-list .skill-card')).toHaveCount(3);
  await expect(page.locator('#skill-card-list .skill-card-back .skill-card-random')).toHaveText(['随机', '随机', '随机']);
  await expect(page.locator('#skill-card-list .skill-card-back small')).toHaveCount(0);
  await expect(page.locator('#skill-card-list .skill-card-front .skill-card-symbol-stage')).toHaveCount(3);
  await expect(page.locator('#skill-card-list .skill-card-front .skill-card-tier')).toHaveCount(3);
  const offeredCards = await page.locator('#skill-card-list .skill-card').evaluateAll((cards) => cards.map((card) => ({
    skillId: card.getAttribute('data-skill-id'),
    appliance: card.getAttribute('data-appliance'),
    tier: card.getAttribute('data-tier'),
  })));
  expect(offeredCards.every(({ skillId, appliance, tier }) => Boolean(skillId && appliance && tier))).toBe(true);
  expect(new Set(offeredCards.map(({ skillId }) => skillId)).size).toBe(3);
  expect(offeredCards.filter(({ tier }) => tier?.endsWith('benefit')).length).toBe(2);
  expect(offeredCards.filter(({ tier }) => tier?.endsWith('risk')).length).toBe(1);
  await page.waitForTimeout(1200);
  expect((await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!)).skill?.cardCount).toBe(3);

  const cards = page.locator('#skill-card-list .skill-card');
  await page.evaluate(() => {
    const panel = document.querySelector('#skill-card-panel');
    const firstCard = document.querySelector('#skill-card-list .skill-card');
    const timing = { selectedAt: 0, hiddenAt: 0 };
    Reflect.set(window, '__GACHA_CARD_REVEAL_TIMING__', timing);
    firstCard?.addEventListener('click', () => {
      timing.selectedAt = performance.now();
    }, { capture: true, once: true });
    const observer = new MutationObserver(() => {
      if (timing.selectedAt > 0 && !panel?.classList.contains('visible')) {
        timing.hiddenAt = performance.now();
        observer.disconnect();
      }
    });
    if (panel) observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
  });
  await cards.first().click();
  await expect(page.locator('#skill-card-list .skill-card.selected')).toHaveCount(1);
  await expect(page.locator('#skill-card-list .skill-card.dismissed')).toHaveCount(2);
  await expect(cards.first().locator('.skill-card-front b')).not.toBeEmpty();
  await page.waitForTimeout(800);
  const selectedSymbol = await cards.first().locator('.skill-card-front .skill-card-symbol-stage').evaluate((symbol) => {
    const rect = symbol.getBoundingClientRect();
    return { width: rect.width, height: rect.height, hasArtwork: symbol.childElementCount > 0 };
  });
  expect(selectedSymbol.width).toBeGreaterThan(40);
  expect(selectedSymbol.height).toBeGreaterThan(40);
  expect(selectedSymbol.hasArtwork).toBe(true);
  const selectedCardStyle = await cards.first().evaluate((card) => ({
    filter: getComputedStyle(card).filter,
    transform: getComputedStyle(card).transform,
  }));
  expect(selectedCardStyle.filter).toBe('none');
  expect(selectedCardStyle.transform.startsWith('matrix3d(-')).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.cardCount === 0
      && diagnostics.skill.phase !== 'select-card';
  }, null, { timeout: 30_000 });
  const revealTiming = await page.evaluate(() => Reflect.get(window, '__GACHA_CARD_REVEAL_TIMING__') as {
    selectedAt: number;
    hiddenAt: number;
  });
  expect(revealTiming.selectedAt).toBeGreaterThan(0);
  expect(revealTiming.hiddenAt - revealTiming.selectedAt).toBeGreaterThanOrEqual(4_000);
});

test('bubble machine skill test grants a five-turn shield and consumes it on one blocked click', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=bubble-machine&seed=20260824');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.testId === 'bubble-machine'
      && diagnostics.totalArrows === 4
      && diagnostics.skill.inputLocked === false;
  }, null, { timeout: 30_000 });

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['bubble-machine']);
  expect(initial.availableArrows).toBe(3);
  expect(initial.skill?.buff).toBeNull();
  await expect(page.locator('#skill-cue-source')).toHaveText('泡泡机');
  await expect(page.locator('#skill-cue-title')).toHaveText('虹膜泡泡');
  await expect(page.locator('#skill-cue-detail')).toHaveText('五回合内抵挡一次受阻点击。');

  expect(await page.evaluate(() => (
    window.__PULL_CABLE_FOR_EVIDENCE__?.('bubble-machine-test-side', 'head') ?? false
  ))).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.buff === 'iridescent-bubble'
      && !diagnostics.skill.effectAssets.includes('bubble-shell-wave-membrane')
      && diagnostics.skill.screenEffect.mode === 'none'
      && diagnostics.skill.bubbleShield.active
      && diagnostics.skill.bubbleShield.visible
      && diagnostics.skill.bubbleShield.targetCount === 3
      && diagnostics.skill.bubbleShield.depthWrite === false
      && diagnostics.skill.bubbleShield.surfaceIridescence === 'distributed'
      && diagnostics.skill.bubbleShield.deformationMode === 'inertial-soft-body'
      && diagnostics.skill.bubbleShield.surfaceNormalMode === 'smooth-radial'
      && diagnostics.skill.bubbleShield.colorDistributionMode === 'balanced-spectrum';
  }, null, { timeout: 45_000 });
  await expect(page.locator('#skill-buff-slot')).toHaveAttribute('data-status', 'iridescent-bubble');
  await expect(page.locator('#skill-buff-slot .skill-status-count')).toHaveText('5');
  const canvas = page.locator('canvas').first();
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (!canvasBox) throw new Error('Expected the game canvas');
  const dragX = canvasBox.x + canvasBox.width * 0.55;
  const dragY = canvasBox.y + canvasBox.height * 0.48;
  await page.mouse.move(dragX, dragY);
  await page.mouse.down();
  await page.mouse.move(dragX - 190, dragY + 28, { steps: 14 });
  await page.mouse.up();
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.skill?.bubbleShield.wobbleAmplitude ?? 0) > 0.008,
    null,
    { timeout: 10_000 },
  );
  const movingShield = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.bubbleShield);
  expect(Math.hypot(...movingShield.wobble)).toBeGreaterThan(0.008);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.inputLocked === false
      && diagnostics.activeAnimations === 0
      && diagnostics.activeConnections === 0;
  }, null, { timeout: 45_000 });

  const blocked = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.blockedClickTarget);
  expect(blocked?.id).toBe('bubble-machine-test-blocked');
  expect(await page.evaluate(() => (
    window.__PULL_CABLE_FOR_EVIDENCE__?.('bubble-machine-test-blocked', 'head') ?? false
  ))).toBe(true);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.buff === null,
    null, { timeout: 30_000 });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.bubbleShield.visible === false,
    null, { timeout: 30_000 });
  const consumed = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(consumed.skill?.screenEffect.mode).toBe('none');
  expect(consumed.skill?.lives).toBe(3);
  expect(consumed.remainingArrows).toBe(3);
});

test('robot vacuum skill test clears only the three-cable snapshot at 0.1 second intervals', async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=robot-vacuum&seed=20260824');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.testId === 'robot-vacuum'
      && diagnostics.totalArrows === 5
      && diagnostics.skill.inputLocked === false;
  }, null, { timeout: 30_000 });

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['robot-vacuum']);
  expect(initial.availableArrows).toBe(4);
  expect(initial.skill?.buff).toBeNull();
  expect(initial.skill?.debuff).toBeNull();
  await expect(page.locator('#skill-cue-source')).toHaveText('扫地机器人');
  await expect(page.locator('#skill-cue-title')).toHaveText('快照清线');
  await expect(page.locator('#skill-cue-detail')).toHaveText('清除触发瞬间全部真实可抽线。');

  expect(await page.evaluate(() => (
    window.__PULL_CABLE_FOR_EVIDENCE__?.('robot-vacuum-test-trigger', 'head') ?? false
  ))).toBe(true);
  await page.waitForFunction(() => {
    const presentation = window.__THREE_GAME_DIAGNOSTICS__?.skill?.presentation;
    return presentation?.skillId === 'snapshot-sweep' && presentation.targetCount === 3;
  }, null, { timeout: 45_000 });
  const snapshot = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.presentation);
  expect(snapshot.skillId).toBe('snapshot-sweep');
  expect(snapshot.targetCount).toBe(3);
  expect(snapshot.meshCount).toBe(0);
  expect(snapshot.lineCount).toBe(0);
  expect(snapshot.labelCount).toBe(0);
  await page.waitForFunction(() => (
    window.__THREE_GAME_DIAGNOSTICS__?.skill?.presentation.autoRemovalOrder.length === 3
  ), null, { timeout: 45_000 });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows === 1, null, { timeout: 45_000 });

  const swept = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(swept.skill?.presentation.autoRemovalOrder).toEqual([
    'robot-vacuum-test-key',
    'robot-vacuum-test-side',
    'robot-vacuum-test-depth',
  ]);
  const starts = swept.skill!.presentation.autoRemovalStartsMs;
  expect(starts).toHaveLength(3);
  expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(55);
  expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(55);
  expect(swept.skill?.remainingCableIds).toEqual(['robot-vacuum-test-blocked']);
  expect(swept.skill?.buff).toBeNull();
  expect(swept.skill?.debuff).toBeNull();

  expect(await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.inputLocked === false
      && diagnostics.activeAnimations === 0
      && diagnostics.activeConnections === 0
      && diagnostics.availableArrows === 1;
  }, null, { timeout: 45_000 });
  const settled = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(settled.skill?.remainingCableIds).toEqual(['robot-vacuum-test-blocked']);
  expect(settled.availableClickTargets.map(({ id }) => id)).toEqual(['robot-vacuum-test-blocked']);
});

test('phone skill test creates three persistent fake tail plugs and clears them one by one', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=phone&seed=20260824');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.testId === 'phone'
      && diagnostics.totalArrows === 5
      && diagnostics.skill.inputLocked === false;
  }, null, { timeout: 30_000 });

  const pullCable = async (id: string, expectedRemaining: number) => {
    await page.waitForFunction(() => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.skill?.inputLocked === false
        && diagnostics.activeAnimations === 0
        && diagnostics.activeConnections === 0
        && diagnostics.appliances.some(({ kind, state, dropping }) =>
          kind === 'phone' && state === 'idle' && dropping === false);
    }, null, { timeout: 45_000 });
    expect(await page.evaluate(
      (cableId) => window.__PULL_CABLE_FOR_EVIDENCE__?.(cableId, 'head') ?? false,
      id,
    )).toBe(true);
    await page.waitForFunction(
      (remaining) => window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows === remaining,
      expectedRemaining,
      { timeout: 45_000 },
    );
  };

  const settlePhone = async () => {
    await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.inputLocked === false
      && window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations === 0
      && window.__THREE_GAME_DIAGNOSTICS__?.activeConnections === 0, null, { timeout: 45_000 });
    expect(await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  };

  const fakeIds = () => page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const remaining = new Set(diagnostics?.skill?.remainingCableIds ?? []);
    return (diagnostics?.skill?.cableEffects ?? [])
      .filter(({ id, fakeTailPlugVisible }) => remaining.has(id) && fakeTailPlugVisible)
      .map(({ id }) => id)
      .sort();
  });

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['phone']);
  expect(initial.skill?.debuff).toBeNull();
  await expect(page.locator('#skill-cue-source')).toHaveText('手机');
  await expect(page.locator('#skill-cue-title')).toHaveText('双头伪装');
  await expect(page.locator('#skill-cue-detail')).toHaveText('最多三根线的普通尾端生成永久假插头。');

  await pullCable('phone-test-trigger', 4);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === 'fake-double-plug', null, { timeout: 45_000 });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const remaining = new Set(diagnostics?.skill?.remainingCableIds ?? []);
    return (diagnostics?.skill?.cableEffects ?? [])
      .filter(({ id, fakeTailPlugVisible }) => remaining.has(id) && fakeTailPlugVisible).length === 3;
  }, null, { timeout: 45_000 });
  const targets = await fakeIds();
  expect(targets).toHaveLength(3);
  const remainingAfterTrigger = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.remainingCableIds);
  const control = remainingAfterTrigger.find((id) => !targets.includes(id));
  expect(control).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath('phone-three-fake-tail-plugs.png'), fullPage: true });

  await settlePhone();
  await pullCable(control!, 3);
  expect(await fakeIds()).toEqual(targets);

  for (const [index, target] of targets.entries()) {
    await settlePhone();
    await pullCable(target, 2 - index);
    const expectedTargets = targets.slice(index + 1).sort();
    await page.waitForFunction((count) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const remaining = new Set(diagnostics?.skill?.remainingCableIds ?? []);
      return (diagnostics?.skill?.cableEffects ?? [])
        .filter(({ id, fakeTailPlugVisible }) => remaining.has(id) && fakeTailPlugVisible).length === count;
    }, expectedTargets.length, { timeout: 45_000 });
    expect(await fakeIds()).toEqual(expectedTargets);
  }

  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === null
    && window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows === 0, null, { timeout: 45_000 });
  const cleared = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(cleared.skill?.debuff).toBeNull();
  expect(cleared.skill?.remainingCableIds).toEqual([]);
});


test('rice cooker skill test thickens every remaining cable for exactly three correct pulls', async ({ page }) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=rice-cooker&seed=20260821');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  expect(await page.evaluate(() => window.__FINISH_OPENING_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.opening.transitioning === false
      && diagnostics.skill?.testId === 'rice-cooker'
      && diagnostics.totalArrows === 5;
  }, null, { timeout: 30_000 });

  const connectAppliance = async (kind: 'rice-cooker' | 'blender') => {
    await page.waitForFunction((targetKind) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.skill?.inputLocked === false
        && diagnostics.activeAnimations === 0
        && diagnostics.activeConnections === 0
        && diagnostics.availableArrows > 0
        && diagnostics.appliances.some(({ kind: applianceKind, state, dropping }) =>
          applianceKind === targetKind && state === 'idle' && dropping === false);
    }, kind, { timeout: 45_000 });
    expect(await page.evaluate(
      (targetKind) => window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__?.(targetKind) ?? false,
      kind,
    )).toBe(true);
  };

  const expectAllRemainingThickness = async (expected: number) => {
    await page.waitForFunction((scale) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const remaining = diagnostics?.skill?.remainingCableIds ?? [];
      const effects = diagnostics?.skill?.cableEffects ?? [];
      return remaining.length > 0 && remaining.every((id) => {
        const effect = effects.find((entry) => entry.id === id);
        return effect !== undefined
          && Math.abs(effect.visualThicknessScale - scale) < 0.03
          && Math.abs(effect.geometryThicknessScale - scale) < 0.03
          && Math.abs(effect.plugJointThicknessScale - scale) < 0.03;
      });
    }, expected, { timeout: 30_000 });
  };

  expect((await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!)).appliances.map(({ kind }) => kind))
    .toEqual(['rice-cooker']);
  await connectAppliance('rice-cooker');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === 'rice-thick-cable'
    && window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuffTurnsRemaining === 3, null, { timeout: 45_000 });
  await expectAllRemainingThickness(1.5);
  const thickened = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(thickened.availableArrows).toBe(thickened.remainingArrows);

  for (const turns of [2, 1]) {
    expect(await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
    await connectAppliance('blender');
    await page.waitForFunction((expected) => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === 'rice-thick-cable'
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuffTurnsRemaining === expected, turns, { timeout: 45_000 });
    await expectAllRemainingThickness(1.5);
  }

  expect(await page.evaluate(() => window.__SETTLE_APPLIANCE_FOR_EVIDENCE__?.() ?? false)).toBe(true);
  await connectAppliance('blender');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === null
    && window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows === 1, null, { timeout: 45_000 });
  await expectAllRemainingThickness(1);
  const recovered = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(recovered.skill?.debuffTurnsRemaining).toBeNull();
  expect(recovered.availableArrows).toBe(1);
  expect(recovered.skill?.remainingCableIds).toEqual(['rice-cooker-test-recovered']);
});
test('electric kettle skill test melts frozen-plug through staged foreground heat', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
  });
  await page.goto('/?theme=day&mode=skill-test&direct=1&skill=kettle&seed=20260821');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.skill?.testId === 'kettle'
      && diagnostics.skill.debuff === 'frozen-plug'
      && diagnostics.totalArrows === 4;
  }, null, { timeout: 90_000 });

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['kettle']);
  expect(initial.skill?.debuff).toBe('frozen-plug');
  expect(initial.skill?.debuffTurnsRemaining).toBe(3);
  expect(initial.skill?.cableEffects.filter(({ freezeAmount }) => freezeAmount > 0)).toHaveLength(3);

  let pulled = false;
  for (let attempt = 0; attempt < 300 && !pulled; attempt += 1) {
    pulled = await page.evaluate(() => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      if (diagnostics?.skill?.inputLocked !== false
        || diagnostics.activeAnimations !== 0
        || diagnostics.activeConnections !== 0) return false;
      window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
      return window.__PULL_CABLE_FOR_EVIDENCE__?.('kettle-test-key') ?? false;
    });
    if (!pulled) await page.waitForTimeout(100);
  }
  expect(pulled).toBe(true);
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.debuff === null
      && diagnostics.remainingArrows === 3
      && diagnostics.skill.kettleThaw.phase === 'heating'
      && diagnostics.skill.screenEffect.mode === 'kettle-thaw-heat';
  }, null, { timeout: 45_000 });

  await expect(page.locator('#skill-cue-source')).toHaveText('电热水壶');
  await expect(page.locator('#skill-cue-title')).toHaveText('高温蒸汽解冻');
  await expect(page.locator('#skill-cue-detail')).toHaveText('立即融化全部急冻冰壳。');

  const captureStage = async (
    time: number,
    phase: 'heating' | 'melting' | 'release',
    minFreeze: number,
    maxFreeze: number,
    filename: string,
  ): Promise<void> => {
    await page.evaluate((value) => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = value; }, time);
    await page.waitForFunction(({ expectedPhase, expectedTime }) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      const thaw = diagnostics?.skill?.kettleThaw;
      return diagnostics?.skill?.screenEffect.mode === 'kettle-thaw-heat'
        && thaw?.phase === expectedPhase
        && Math.abs(thaw.elapsed - expectedTime) < 0.06;
    }, { expectedPhase: phase, expectedTime: time }, { timeout: 20_000 });
    const stage = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
    expect(stage.skill?.kettleThaw.active).toBe(true);
    expect(stage.skill?.kettleThaw.progress).toBeCloseTo(time / 2.9, 1);
    expect(stage.skill?.refrigeratorFreeze.phase).toBe('thawing');
    expect(stage.skill?.refrigeratorFreeze.cableAmount).toBeGreaterThan(minFreeze);
    expect(stage.skill?.refrigeratorFreeze.cableAmount).toBeLessThan(maxFreeze);
    expect(stage.skill?.cableEffects.filter(({ freezeAmount }) => freezeAmount > 0)).toHaveLength(3);
    expect(stage.appliances[0]?.state).toBe('active');
    expect(stage.appliances[0]?.activeTimeRemaining).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath(filename) });
  };

  await captureStage(0.32, 'heating', 0.92, 1.01, 'kettle-thaw-heating.png');
  await captureStage(1.5, 'melting', 0.35, 0.65, 'kettle-thaw-melting.png');
  await captureStage(2.5, 'release', 0.001, 0.12, 'kettle-thaw-release.png');

  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 3.05; });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.kettleThaw.phase === 'complete'
      && diagnostics.skill.refrigeratorFreeze.phase === 'idle'
      && diagnostics.skill.cableEffects.every(({ freezeAmount }) => freezeAmount === 0);
  }, null, { timeout: 20_000 });
  const thawed = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(thawed.skill?.debuff).toBeNull();
  expect(thawed.skill?.screenEffect.mode).toBe('none');
  expect(thawed.skill?.screenEffect.progress).toBe(0);
  expect(thawed.appliances[0]?.state).toBe('active');
  expect(thawed.appliances[0]?.activeTimeRemaining).toBeGreaterThan(0);
  expect(thawed.performances.sessions).toBe(1);
  expect(thawed.performances.elapsedByKind.kettle).toBeCloseTo(3.05, 1);

  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.inputLocked === false
      && diagnostics.skill.screenEffect.mode === 'none'
      && diagnostics.skill.kettleThaw.phase === 'idle';
  }, null, { timeout: 20_000 });
});
test('coffee maker skill test locks all remaining cables for four successful pulls', async ({ page }, testInfo) => {
  test.setTimeout(600_000);
  await page.addInitScript(() => {
    window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
    window.__COFFEE_STAIN_PROGRESS_OVERRIDE__ = 0.55;
  });
  await page.goto('/?theme=day&mode=skill-test&skill=coffee-maker&seed=20260820&direct=1');
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true, null, { timeout: 90_000 });
  await page.click('#start-game-button');
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.opening.active === false
      && diagnostics.skill?.testId === 'coffee-maker'
      && diagnostics.totalArrows === 7;
  }, null, { timeout: 90_000 });

  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = undefined; });
  await page.evaluate(() => { window.__COFFEE_SPLASH_PROGRESS_OVERRIDE__ = 0.48; });
  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.skill?.debuff).toBeNull();
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['coffee-maker']);
  expect(initial.totalArrows).toBe(7);

  const clickAvailableCable = async (performanceTimeAfterPull = 6): Promise<void> => {
    for (let attempt = 0; attempt < 900; attempt += 1) {
      const pulled = await page.evaluate((performanceTime) => {
        const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
        if (
          diagnostics?.skill?.inputLocked !== false
          || diagnostics.activeAnimations !== 0
          || diagnostics.activeConnections !== 0
        ) return false;
        window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 0;
        const result = window.__PULL_CABLE_FOR_EVIDENCE__?.() ?? false;
        window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = performanceTime;
        return result;
      }, performanceTimeAfterPull);
      if (pulled) return;
      await page.waitForTimeout(100);
    }
    throw new Error('No available cable could be pulled after lifecycle retries.');
  };

  await clickAvailableCable(6);
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === 'coffee-lock'
    && window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuffTurnsRemaining === 4, null, { timeout: 45_000 });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    const remaining = diagnostics?.skill?.remainingCableIds ?? [];
    const effects = diagnostics?.skill?.cableEffects ?? [];
    return remaining.length > 0 && remaining.every((id) => {
      const effect = effects.find((entry) => entry.id === id);
      return effect !== undefined && effect.coffeeStainAmount > 0.35 && effect.coffeeStainReveal > 0;
    });
  }, null, { timeout: 45_000 });
  const triggered = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(triggered.skill?.remainingCableIds.length).toBe(triggered.remainingArrows);
  const triggeredReveals = triggered.skill?.remainingCableIds.map((id) => {
    const effect = triggered.skill?.cableEffects.find((entry) => entry.id === id);
    expect(effect?.coffeeStainAmount).toBeGreaterThan(0.35);
    expect(effect?.coffeeStainReveal).toBeGreaterThan(0);
    return effect?.coffeeStainReveal ?? 0;
  }) ?? [];
  expect(Math.max(...triggeredReveals) - Math.min(...triggeredReveals)).toBeGreaterThan(0.04);
  expect(triggered.skill?.screenEffect.mode).toBe('coffee-lock');
  expect(triggered.skill?.screenEffect.progress).toBeCloseTo(1, 1);
  expect(triggered.skill?.screenEffect.splashActive).toBe(true);
  expect(triggered.skill?.screenEffect.splashProgress).toBeCloseTo(0.48, 2);
  await page.screenshot({ path: testInfo.outputPath('coffee-splash.png') });
  await page.evaluate(() => { window.__COFFEE_SPLASH_PROGRESS_OVERRIDE__ = undefined; });

  for (const turns of [3, 2, 1, 0]) {
    await clickAvailableCable(turns === 0 ? 2.4 : 6);
    await page.waitForFunction((expected) => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === 'coffee-lock'
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuffTurnsRemaining === expected, turns, { timeout: 45_000 });
    const state = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
    expect(state.skill?.remainingCableIds.every((id) => {
      const effect = state.skill?.cableEffects.find((entry) => entry.id === id);
      return effect !== undefined;
    })).toBe(true);
    expect(state.skill?.screenEffect.progress).toBeCloseTo(turns / 4, 1);
    if (turns === 0) {
      expect(state.skill?.debuff).toBe('coffee-lock');
      await expect(page.locator('#skill-cue-title')).toHaveText('技能被封锁');
      await page.waitForFunction(() => {
        const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
        return diagnostics?.skill?.debuff === 'coffee-lock'
          && diagnostics.appliances[0]?.state === 'active'
          && diagnostics.appliances[0].activeTimeRemaining > 0;
      }, null, { timeout: 30_000 });
    }
  }

  const exhausted = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(exhausted.skill?.debuff).toBe('coffee-lock');
  expect(exhausted.skill?.debuffTurnsRemaining).toBe(0);
  expect(exhausted.sceneVisibility.appliances).toBe(true);
  expect(exhausted.appliances[0].state).toBe('active');
  expect(exhausted.appliances[0].activeTimeRemaining).toBeGreaterThan(0);
  expect(exhausted.appliances[0].screenWidth).toBeGreaterThan(0);

  await page.evaluate(() => { window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__ = 6; });
  await page.waitForFunction(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === null
    && (window.__THREE_GAME_DIAGNOSTICS__?.appliances[0].activeTimeRemaining ?? 1) === 0, null, { timeout: 20_000 });
  await page.evaluate(() => { window.__COFFEE_STAIN_PROGRESS_OVERRIDE__ = undefined; });
  await page.waitForFunction(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    return diagnostics?.skill?.debuff === null
      && diagnostics.clickTarget != null
      && diagnostics.appliances.some(({ state, dropping }) => state === 'idle' && dropping === false);
  }, null, { timeout: 45_000 });
  await clickAvailableCable(6);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === 'coffee-lock',
    null,
    { timeout: 45_000 },
  );
  await expect(page.locator('#skill-cue-title')).not.toHaveText('技能被封锁');
});

test('washer skill test opens with a normal random-challenge-sized cable group', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?theme=day&mode=skill-test&skill=washer&direct=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'washer'
        && diagnostics.totalArrows > 4;
    },
    null,
    { timeout: 90_000 },
  );

  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(diagnostics.mode).toBe('skill');
  expect(diagnostics.totalArrows).toBeGreaterThan(4);
  expect(diagnostics.appliances.map(({ kind }) => kind)).toEqual(['washer']);
  expect(new URL(page.url()).searchParams.get('layout')).toBe('random');
});

test('washer skill test removes up to two remaining cables after its trigger connection', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&skill=washer&seed=2679418801&direct=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'washer'
        && diagnostics.totalArrows > 4
        && diagnostics.clickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.totalArrows).toBeGreaterThan(4);
  await page.screenshot({ path: testInfo.outputPath('washer-random-multiline-before.png'), fullPage: true });
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['washer']);
  expect(initial.skill?.invulnerable).toBe(true);
  expect(initial.skill?.effectAssets).toEqual([]);
  await expect(page.locator('#skill-cue-source')).toHaveText('洗衣机');
  await expect(page.locator('#skill-cue-title')).toHaveText('脱水甩线');
  await expect(page.locator('#skill-cue-detail')).toHaveText('从全部剩余线中甩出最多两根。');

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    (initialTotal) => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === initialTotal - 1
        && diagnostics.skill?.inputLocked === true
        && diagnostics.skill.washerSpin.active === true
        && diagnostics.skill.washerSpin.phase === 'spin-up';
    },
    initial.totalArrows,
    { timeout: 45_000 },
  );
  const earlySpin = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.washerSpin);
  expect(earlySpin.elapsed).toBeLessThan(1.2);
  expect(earlySpin.averageEntryOffset).toBeGreaterThan(0.01);
  expect(earlySpin.averageEntryOffset).toBeLessThan(3.2);
  await page.evaluate(() => {
    Reflect.deleteProperty(window, '__WASHER_SLOW_FRAME_RESULT__');
    const diagnosticsChurn = {
      frames: 0,
      replacements: 0,
      previous: window.__THREE_GAME_DIAGNOSTICS__,
    };
    Reflect.set(window, '__WASHER_DIAGNOSTICS_CHURN__', diagnosticsChurn);
    const watchDiagnosticsChurn = (): void => {
      const current = window.__THREE_GAME_DIAGNOSTICS__;
      const spin = current?.skill?.washerSpin;
      if (spin?.active) {
        diagnosticsChurn.frames += 1;
        if (current !== diagnosticsChurn.previous) diagnosticsChurn.replacements += 1;
      }
      diagnosticsChurn.previous = current;
      if (spin?.phase !== 'complete') requestAnimationFrame(watchDiagnosticsChurn);
    };
    requestAnimationFrame(watchDiagnosticsChurn);
    const watchRegrouping = (): void => {
      const spin = window.__THREE_GAME_DIAGNOSTICS__?.skill?.washerSpin;
      if (!spin?.active) return;
      if (spin.elapsed < 3.58) {
        requestAnimationFrame(watchRegrouping);
        return;
      }
      const before = { ...spin };
      const blockedUntil = performance.now() + 500;
      while (performance.now() < blockedUntil) {
        // Intentionally block one render interval to reproduce the real-world
        // main-thread stall that previously skipped most of the regrouping.
      }
      requestAnimationFrame(() => {
        const after = window.__THREE_GAME_DIAGNOSTICS__?.skill?.washerSpin;
        if (after) Reflect.set(window, '__WASHER_SLOW_FRAME_RESULT__', { before, after: { ...after } });
      });
    };
    requestAnimationFrame(watchRegrouping);
  });
  await page.waitForFunction(
    () => {
      const spin = window.__THREE_GAME_DIAGNOSTICS__?.skill?.washerSpin;
      return (spin?.phase === 'centrifuge' || spin?.phase === 'launch')
        && spin.angularVelocity > 10
        && spin.centrifugalAmount > 0.55;
    },
    null,
    { timeout: 15_000 },
  );
  const beforeLaunch = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.washerSpin);
  expect(beforeLaunch.duration).toBeGreaterThan(5.2);
  expect(beforeLaunch.centrifugalAmount).toBeGreaterThan(0.55);
  expect(beforeLaunch.averageEntryOffset).toBeGreaterThan(1.6);
  expect(beforeLaunch.maxEntryOffset).toBeGreaterThan(2.2);
  expect(beforeLaunch.minimumPlanarRadius).toBeGreaterThan(3.6);
  expect(beforeLaunch.averagePlanarRadius).toBeGreaterThan(4.2);
  await page.screenshot({ path: testInfo.outputPath('washer-centrifuge.png'), fullPage: true });

  await page.waitForFunction(
    () => {
      const fling = window.__THREE_GAME_DIAGNOSTICS__?.activeFlingMotions[0];
      return fling !== undefined && fling.progress > 0.22 && fling.progress < 0.7;
    },
    null,
    { timeout: 15_000 },
  );
  const firstFling = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.activeFlingMotions[0]);
  expect(firstFling.detachedFromCableRoot).toBe(true);
  expect(firstFling.worldDistanceFromLaunch).toBeGreaterThan(1);
  expect(firstFling.angularVelocity).toBeDefined();
  expect(firstFling.angularVelocity.some((value) => Math.abs(value) > 2.5)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('washer-first-cable-flinging.png'), fullPage: true });

  const simultaneousHandle = await page.waitForFunction(
    () => {
      const motions = window.__THREE_GAME_DIAGNOSTICS__?.activeFlingMotions ?? [];
      return motions.length === 2 ? motions.map((motion) => ({ ...motion })) : null;
    },
    null,
    { timeout: 15_000 },
  );
  const simultaneousFlings = await simultaneousHandle.jsonValue();
  expect(simultaneousFlings).not.toBeNull();
  if (!simultaneousFlings) throw new Error('Expected two simultaneous washer flings');
  expect(simultaneousFlings).toHaveLength(2);
  expect(new Set(simultaneousFlings.map(({ id }) => id)).size).toBe(2);
  expect(simultaneousFlings.every(({ detachedFromCableRoot }) => detachedFromCableRoot)).toBe(true);
  expect(simultaneousFlings[0].direction[0]).toBeLessThan(0);
  expect(simultaneousFlings[1].direction[0]).toBeGreaterThan(0);
  expect(simultaneousFlings[0].worldDistanceFromLaunch).toBeGreaterThan(
    simultaneousFlings[1].worldDistanceFromLaunch,
  );
  await page.screenshot({ path: testInfo.outputPath('washer-two-cables-flung.png'), fullPage: true });

  const secondLaunch = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.washerSpin);
  expect(secondLaunch.launchElapsedSeconds).toHaveLength(2);
  expect(secondLaunch.launchElapsedSeconds[1] - secondLaunch.launchElapsedSeconds[0]).toBeGreaterThan(0.7);
  expect(new Set(secondLaunch.launchOrder).size).toBe(2);
  await page.waitForFunction(
    () => Reflect.has(window, '__WASHER_SLOW_FRAME_RESULT__'),
    null,
    { timeout: 15_000 },
  );
  const slowFrameProbe = await page.evaluate(() => Reflect.get(window, '__WASHER_SLOW_FRAME_RESULT__') as {
    before: { elapsed: number; averageEntryOffset: number; phase: string };
    after: { elapsed: number; averageEntryOffset: number; phase: string };
  });
  expect(slowFrameProbe.after.elapsed - slowFrameProbe.before.elapsed).toBeLessThan(0.12);
  expect(slowFrameProbe.after.averageEntryOffset).toBeGreaterThan(
    slowFrameProbe.before.averageEntryOffset * 0.8,
  );
  expect(slowFrameProbe.before.phase).toBe('slowdown');
  expect(slowFrameProbe.after.phase).toBe('slowdown');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.completedFlingMotions.length === 2,
    null,
    { timeout: 15_000 },
  );
  const completedFlings = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.completedFlingMotions);
  expect(completedFlings).toHaveLength(2);
  expect(completedFlings.every(({ distanceMonotonic }) => distanceMonotonic)).toBe(true);
  expect(completedFlings.every(({ maxScreenRadius }) => maxScreenRadius > 1.6)).toBe(true);
  const regroupingLifecycle = await page.evaluate(() => {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__!;
    return {
      spin: diagnostics.skill!.washerSpin,
      washer: diagnostics.appliances.find((item) => item.kind === 'washer'),
    };
  });
  expect(regroupingLifecycle.spin.active).toBe(true);
  expect(regroupingLifecycle.spin.elapsed).toBeLessThan(regroupingLifecycle.spin.duration);
  expect(regroupingLifecycle.washer?.state).toBe('active');
  expect(regroupingLifecycle.washer?.activeTimeRemaining ?? 0).toBeGreaterThan(0.5);

  await page.waitForFunction(
    (initialTotal) => window.__THREE_GAME_DIAGNOSTICS__?.remainingArrows === initialTotal - 3,
    initial.totalArrows,
    { timeout: 15_000 },
  );
  await expect(page.locator('#skill-cue-title')).toHaveText('脱水甩线');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.inputLocked === false
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.washerSpin.phase === 'complete',
    null,
    { timeout: 45_000 },
  );
  const settledSpin = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.washerSpin);
  expect(Number.isFinite(settledSpin.spinAngle)).toBe(true);
  expect(settledSpin.angularVelocity).toBe(0);
  expect(settledSpin.centrifugalAmount).toBe(0);
  expect(settledSpin.averageEntryOffset).toBeLessThan(0.001);
  expect(settledSpin.maxEntryOffset).toBeLessThan(0.001);
  const diagnosticsChurn = await page.evaluate(() => {
    const churn = Reflect.get(window, '__WASHER_DIAGNOSTICS_CHURN__') as {
      frames: number;
      replacements: number;
    };
    return { frames: churn.frames, replacements: churn.replacements };
  });
  expect(diagnosticsChurn.frames).toBeGreaterThan(60);
  expect(diagnosticsChurn.replacements * 3).toBeLessThan(diagnosticsChurn.frames);
  await page.screenshot({ path: testInfo.outputPath('washer-settled.png'), fullPage: true });
});

test('fan steam remains animated and frosted in the daytime theme', async ({ page }) => {
  test.setTimeout(180_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=day&mode=skill-test&skill=fan&direct=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'fan'
        && diagnostics.skill.debuff === 'bathroom-steam';
    },
    null,
    { timeout: 90_000 },
  );
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('day');

  await page.waitForTimeout(2_000);
  const initialSteam = await page.locator('#game-canvas').screenshot();
  await page.waitForTimeout(5_500);
  const flowingSteam = await page.locator('#game-canvas').screenshot();
  await Promise.all([
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-day.png'), initialSteam),
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-day-flow.png'), flowingSteam),
  ]);

  const initial = PNG.sync.read(initialSteam);
  const flowing = PNG.sync.read(flowingSteam);
  let changedPixels = 0;
  for (let index = 0; index < initial.width * initial.height; index += 1) {
    const offset = index * 4;
    const difference = Math.abs(initial.data[offset] - flowing.data[offset])
      + Math.abs(initial.data[offset + 1] - flowing.data[offset + 1])
      + Math.abs(initial.data[offset + 2] - flowing.data[offset + 2]);
    if (difference > 18) changedPixels += 1;
  }
  expect(changedPixels).toBeGreaterThan(initial.width * initial.height * 0.004);

  const measureFps = async (): Promise<number> => page.evaluate(async () => {
    const start = performance.now();
    let frames = 0;
    await new Promise<void>((resolve) => {
      const countFrame = (now: number): void => {
        frames += 1;
        if (now - start >= 2_000) resolve();
        else requestAnimationFrame(countFrame);
      };
      requestAnimationFrame(countFrame);
    });
    return frames / ((performance.now() - start) / 1_000);
  });
  const steamFps = await measureFps();

  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.clickTarget !== null,
    null,
    { timeout: 30_000 },
  );
  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.debuff === null
      && window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.active === true,
    null,
    { timeout: 30_000 },
  );
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.active === false
      && window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations === 0,
    null,
    { timeout: 30_000 },
  );
  const clearFps = await measureFps();
  await writeFile(
    path.join(ARTIFACT_DIR, 'daytime-steam-performance.json'),
    `${JSON.stringify({ steamFps, clearFps, ratio: steamFps / clearFps }, null, 2)}\n`,
    'utf8',
  );
  expect(steamFps).toBeGreaterThan(2);
  expect(steamFps / clearFps).toBeGreaterThan(0.55);
});

test('fan skill test mode is invulnerable, quiet, and clears the primed steam state', async ({ page }) => {
  test.setTimeout(300_000);
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?theme=night&mode=skill-test&skill=fan&direct=1');
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.opening.ready === true,
    null,
    { timeout: 90_000 },
  );
  await page.click('#start-game-button');
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.opening.active === false
        && diagnostics.skill?.testId === 'fan'
        && diagnostics.totalArrows === 4
        && diagnostics.clickTarget !== null
        && diagnostics.blockedClickTarget !== null;
    },
    null,
    { timeout: 90_000 },
  );

  const initial = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(initial.skill?.invulnerable).toBe(true);
  expect(initial.skill?.debuff).toBe('bathroom-steam');
  expect(initial.appliances.map(({ kind }) => kind)).toEqual(['fan']);
  expect(new Set(initial.routing.requiredColors)).toEqual(new Set([initial.appliances[0].accent]));
  await expect(page.locator('#skill-challenge-ui')).toBeVisible();
  await expect(page.locator('#skill-challenge-ui')).toHaveClass(/visible/);
  await expect(page.locator('#skill-cue')).toBeVisible();
  await expect(page.locator('#skill-cue-source')).toHaveText('风扇');
  await expect(page.locator('#skill-cue-title')).toHaveText('吹散蒸汽');
  await expect(page.locator('#skill-cue-detail')).toHaveText('提前清除浴室蒸汽。');
  await expect(page.locator('#skill-status-rack')).toBeHidden();
  await expect(page.locator('#random-lives')).toBeHidden();
  await expect(page.locator('#hint-button')).toBeHidden();
  await expect(page.locator('#status-line')).toBeHidden();

  const steamScreenshot = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam.png'), steamScreenshot);
  await page.waitForTimeout(5_500);
  const flowingSteamScreenshot = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-flow.png'), flowingSteamScreenshot);
  const steamStart = PNG.sync.read(steamScreenshot);
  const steamFlow = PNG.sync.read(flowingSteamScreenshot);
  let changedSteamPixels = 0;
  for (let index = 0; index < steamStart.width * steamStart.height; index += 1) {
    const offset = index * 4;
    const difference = Math.abs(steamStart.data[offset] - steamFlow.data[offset])
      + Math.abs(steamStart.data[offset + 1] - steamFlow.data[offset + 1])
      + Math.abs(steamStart.data[offset + 2] - steamFlow.data[offset + 2]);
    if (difference > 18) changedSteamPixels += 1;
  }
  expect(changedSteamPixels).toBeGreaterThan(steamStart.width * steamStart.height * 0.004);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(750);
  const mobileSteamScreenshot = await page.locator('#game-canvas').screenshot();
  await writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-steam-mobile.png'), mobileSteamScreenshot);
  const mobileSteam = PNG.sync.read(mobileSteamScreenshot);
  expect(mobileSteam.width).toBe(390);
  expect(mobileSteam.height).toBe(844);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(750);
  const blockedTarget = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.blockedClickTarget!);
  await page.mouse.click(blockedTarget.x, blockedTarget.y);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.skill?.lives)).toBe(initial.skill?.lives);

  const target = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.clickTarget!);
  await page.mouse.click(target.x, target.y);
  await page.waitForFunction(
    () => {
      const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
      return diagnostics?.remainingArrows === 3
        && diagnostics.skill?.debuff === null
        && diagnostics.skill.effectAssets.length === 0
        && diagnostics.skill.steamClear.active;
    },
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = 0.08; });
  await page.waitForFunction(
    () => (window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.progress ?? 1) <= 0.1,
    null,
    { timeout: 30_000 },
  );
  const clearStart = await page.screenshot();
  const clearingStart = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!.skill!.steamClear);
  expect(clearingStart.origin).toBeLessThan(0.5);
  expect(clearingStart.direction).toBe('left-to-right');
  expect(clearingStart.progress).toBeLessThan(0.55);

  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = 0.52; });
  await page.waitForFunction(
    () => Math.abs((window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.progress ?? 0) - 0.52) < 0.02,
    null,
    { timeout: 30_000 },
  );
  const clearMid = await page.screenshot();

  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = 1; });
  await page.waitForFunction(
    () => window.__THREE_GAME_DIAGNOSTICS__?.skill?.steamClear.active === false
      && window.__THREE_GAME_DIAGNOSTICS__?.activeAnimations === 0,
    null,
    { timeout: 30_000 },
  );
  await page.evaluate(() => { window.__STEAM_CLEAR_PROGRESS_OVERRIDE__ = undefined; });

  const triggered = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__!);
  expect(triggered.skill!.debuff).toBeNull();
  expect(triggered.skill!.steamClear.active).toBe(false);

  const screenshot = await page.locator('#game-canvas').screenshot();
  await Promise.all([
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-clear-start.png'), clearStart),
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-clear-mid.png'), clearMid),
    writeFile(path.join(ARTIFACT_DIR, 'fan-skill-test-triggered.png'), screenshot),
    writeFile(
      path.join(ARTIFACT_DIR, 'runtime-diagnostics.json'),
      `${JSON.stringify(triggered.skill, null, 2)}\n`,
      'utf8',
    ),
    writeFile(
      path.join(ARTIFACT_DIR, 'steam-renderer-diagnostics.json'),
      `${JSON.stringify({ active: initial.renderer, cleared: triggered.renderer }, null, 2)}\n`,
      'utf8',
    ),
  ]);
  const image = PNG.sync.read(screenshot);
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < image.width * image.height; index += 1) {
    const offset = index * 4;
    const value = image.data[offset] + image.data[offset + 1] + image.data[offset + 2];
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  expect(maximum - minimum).toBeGreaterThan(120);
});
