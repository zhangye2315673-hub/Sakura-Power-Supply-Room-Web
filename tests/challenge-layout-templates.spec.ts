import { expect, test } from '@playwright/test';
import { availableCableEnds, makeRuntime } from '../src/puzzle/collision';
import { freeDefinitions, removalSequenceIsValid } from '../src/puzzle/difficulty';
import { DOUBLE_ENDED_PUZZLE_TEMPLATES } from '../src/puzzle/doubleEndedTemplates.generated';
import { EXPLORATION_PUZZLE_TEMPLATES } from '../src/puzzle/explorationTemplates.generated';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { generatePuzzle } from '../src/puzzle/generator';
import { getStandardRandomLevel, RANDOM_CHALLENGE_PROFILES } from '../src/puzzle/levels';
import { RANDOM_PUZZLE_TEMPLATES } from '../src/puzzle/randomTemplates.generated';
import type { RandomPuzzleTemplate, RandomPuzzleTemplatePool } from '../src/puzzle/randomTemplates';
import type { DoubleEndedPuzzleTemplatePool } from '../src/puzzle/doubleEndedTemplates';
import { SKILL_PUZZLE_TEMPLATES } from '../src/puzzle/skillTemplates.generated';
import { selectTemplateVariant } from '../src/puzzle/templatePools';

const profileKeys = [...new Set(
  RANDOM_CHALLENGE_PROFILES.map(({ shape, targetCount }) => `${shape}-${targetCount}`),
)].sort();
const explorationPools = EXPLORATION_PUZZLE_TEMPLATES as Record<string, RandomPuzzleTemplatePool>;
const skillPools = SKILL_PUZZLE_TEMPLATES as unknown as Record<string, RandomPuzzleTemplatePool>;
const doubleEndedPools = DOUBLE_ENDED_PUZZLE_TEMPLATES as unknown as Record<number, DoubleEndedPuzzleTemplatePool>;

function topologySignature(template: RandomPuzzleTemplate): string {
  return template.arrows
    .map((arrow) => arrow.path.map((point) => point.join(',')).join(';'))
    .join('|');
}

test('exploration and skill challenges have the requested dedicated template coverage', () => {
  expect(Object.keys(explorationPools).sort()).toEqual(profileKeys);
  expect(Object.keys(skillPools).sort()).toEqual(profileKeys);

  for (const key of profileKeys) {
    expect(explorationPools[key], `${key} exploration variants`).toHaveLength(1);
    expect(skillPools[key], `${key} skill variants`).toHaveLength(2);
  }
});

test('double-ended challenges have four base topologies for every line count', () => {
  expect(Object.keys(doubleEndedPools).map(Number).sort((a, b) => a - b))
    .toEqual([34, 37, 40]);
  for (const targetCount of [34, 37, 40]) {
    expect(doubleEndedPools[targetCount], `${targetCount} cable variants`)
      .toHaveLength(4);
  }
});

test('new single-ended base layouts are valid and are not direct copies of normal random layouts', () => {
  const normalSignatures = new Set(
    Object.values(RANDOM_PUZZLE_TEMPLATES).map(topologySignature),
  );
  const newSignatures = new Set<string>();

  for (const [key, templates] of Object.entries(explorationPools)) {
    for (const template of templates) {
      expect(template.arrows, key).toHaveLength(Number(key.split('-').at(-1)));
      expect(validatePuzzleGeometry(template.arrows), key).toEqual([]);
      expect(removalSequenceIsValid(template.arrows, template.solution), key).toBe(true);
      const signature = topologySignature(template);
      expect(normalSignatures.has(signature), `${key} duplicates normal random`).toBe(false);
      expect(newSignatures.has(signature), `${key} duplicates another new layout`).toBe(false);
      newSignatures.add(signature);
    }
  }

  for (const [key, templates] of Object.entries(skillPools)) {
    for (const template of templates) {
      expect(template.arrows, key).toHaveLength(Number(key.split('-').at(-1)));
      expect(validatePuzzleGeometry(template.arrows), key).toEqual([]);
      expect(removalSequenceIsValid(template.arrows, template.solution), key).toBe(true);
      expect(freeDefinitions(template.arrows).length, key).toBeGreaterThanOrEqual(4);
      expect(freeDefinitions(template.arrows).length, key).toBeLessThanOrEqual(8);
      const signature = topologySignature(template);
      expect(normalSignatures.has(signature), `${key} duplicates normal random`).toBe(false);
      expect(newSignatures.has(signature), `${key} duplicates another new layout`).toBe(false);
      newSignatures.add(signature);
    }
  }
});

test('all double-ended base layouts preserve their end-specific solution', () => {
  for (const [targetCount, templates] of Object.entries(doubleEndedPools)) {
    const signatures = new Set<string>();
    for (const template of templates) {
      expect(template.arrows).toHaveLength(Number(targetCount));
      expect(validatePuzzleGeometry(template.arrows), `${targetCount} geometry`).toEqual([]);
      const signature = topologySignature(template);
      expect(signatures.has(signature), `${targetCount} duplicate topology`).toBe(false);
      signatures.add(signature);

      const runtimes = template.arrows.map(makeRuntime);
      template.solution.forEach((id, index) => {
        const choices = availableCableEnds(runtimes);
        expect(choices.length).toBeGreaterThanOrEqual(1);
        expect(choices.length).toBeLessThanOrEqual(3);
        expect(choices).toContainEqual({ id, end: template.solutionEnds[index] });
        runtimes.find((runtime) => runtime.definition.id === id)!.state = 'removed';
      });
    }
  }
});

test('template variant selection is stable and reaches every slot', () => {
  const variants = ['a', 'b', 'c', 'd'] as const;
  expect(selectTemplateVariant(20260904, variants, 0x1f123bb5))
    .toEqual(selectTemplateVariant(20260904, variants, 0x1f123bb5));
  expect(new Set(Array.from({ length: 256 }, (_, seed) => (
    selectTemplateVariant(seed, variants, 0x1f123bb5).index
  )))).toEqual(new Set([0, 1, 2, 3]));
});

test('exploration generation selects its dedicated topology and remains seed-stable', () => {
  const seed = 20260904;
  const profile = RANDOM_CHALLENGE_PROFILES.find(({ shape, targetCount }) => (
    shape === 'cube' && targetCount === 42
  ))!;
  const base = getStandardRandomLevel(seed);
  const level = {
    ...base,
    seed,
    shape: profile.shape,
    targetCount: profile.targetCount,
    halfExtents: profile.halfExtents,
  };
  const options = {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'random' as const,
  };
  const random = generatePuzzle(seed, level.targetCount, { ...options, templateMode: 'random' });
  const exploration = generatePuzzle(seed, level.targetCount, { ...options, templateMode: 'exploration' });
  const repeated = generatePuzzle(seed, level.targetCount, { ...options, templateMode: 'exploration' });

  expect(topologySignature(exploration)).not.toBe(topologySignature(random));
  expect(topologySignature(repeated)).toBe(topologySignature(exploration));
  expect(exploration.solution).toEqual(repeated.solution);
});
