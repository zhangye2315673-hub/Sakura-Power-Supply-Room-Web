import { expect, test } from '@playwright/test';
import { sampleArrowPath } from '../src/puzzle/collision';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import {
  cableExternalTerminalPositions,
  cableSocketPointsToWorld,
  type ArrowDefinition,
} from '../src/puzzle/types';
import { reverseCableKeepingExternalEndpoints } from '../src/skill/skillTopology';

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
