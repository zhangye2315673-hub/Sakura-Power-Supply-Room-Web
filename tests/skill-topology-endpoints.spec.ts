import { expect, test } from '@playwright/test';
import { sampleArrowPath } from '../src/puzzle/collision';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import {
  cableExternalTerminalPositions,
  cableSocketPointsToWorld,
  type ArrowDefinition,
} from '../src/puzzle/types';
import {
  buildTelevisionSpatialReplacements,
  reverseCableKeepingExternalEndpoints,
  skillTopologyDefinitionsAreCommitSafe,
} from '../src/skill/skillTopology';

const definition: ArrowDefinition = {
  id: 'endpoint-swap-proof',
  path: [
    [2, 5, 5],
    [3, 5, 5],
    [4, 5, 5],
  ],
  exitDirection: '+X',
  color: 0xf0a044,
  lengthClass: 'short',
};

function expectSamePosition(
  actual: { x: number; y: number; z: number },
  expected: { x: number; y: number; z: number },
): void {
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
  expect(actual.z).toBeCloseTo(expected.z, 10);
}

test('head-tail reversal swaps the existing outer terminal coordinates without extending them', () => {
  const before = cableExternalTerminalPositions(definition);
  const reversed = reverseCableKeepingExternalEndpoints(definition);
  const after = cableExternalTerminalPositions(reversed);

  expect(reversed.terminalAnchorMode).toBe('preserve-external-endpoints');
  expectSamePosition(after.head, before.tail);
  expectSamePosition(after.tail, before.head);
  expect(validatePuzzleGeometry([reversed])).toEqual([]);

  const sockets = cableSocketPointsToWorld(reversed);
  const samples = sampleArrowPath(reversed);
  expectSamePosition(samples[0], sockets[0]);
  expectSamePosition(samples[samples.length - 1], sockets[sockets.length - 1]);
});

test('a second reversal restores the original external terminal identities', () => {
  const before = cableExternalTerminalPositions(definition);
  const restored = reverseCableKeepingExternalEndpoints(
    reverseCableKeepingExternalEndpoints(definition),
  );
  const after = cableExternalTerminalPositions(restored);

  expect(restored.terminalAnchorMode).toBeUndefined();
  expect(restored.path).toEqual(definition.path);
  expect(restored.exitDirection).toBe(definition.exitDirection);
  expectSamePosition(after.head, before.head);
  expectSamePosition(after.tail, before.tail);
});

test('television reassigns complete spatial routes without reversing cable identities', () => {
  const definitions: ArrowDefinition[] = [
    definition,
    {
      ...definition,
      id: 'television-route-b',
      path: [[6, 2, 2], [6, 3, 2], [6, 4, 2]],
      exitDirection: '+Y',
      color: 0x56a8ff,
    },
    {
      ...definition,
      id: 'television-route-c',
      path: [[8, 8, 8], [8, 8, 7], [8, 8, 6]],
      exitDirection: '-Z',
      color: 0xffc14d,
    },
  ];
  const replacements = buildTelevisionSpatialReplacements(
    definitions,
    definitions.map(({ id }) => id),
  );
  const reconstructed = definitions.map((entry) => replacements.get(entry.id) ?? entry);

  expect(replacements.size).toBe(3);
  expect(skillTopologyDefinitionsAreCommitSafe(reconstructed)).toBe(true);
  reconstructed.forEach((entry, index) => {
    const original = definitions[index];
    expect(entry.id).toBe(original.id);
    expect(entry.color).toBe(original.color);
    expect(entry.path).not.toEqual(original.path);
    expect(entry.path).not.toEqual([...original.path].reverse());
    expect(definitions.some((candidate) => candidate.path.every(
      (point, pointIndex) => point.every((value, axis) => value === entry.path[pointIndex]?.[axis]),
    ))).toBe(true);
  });
});
