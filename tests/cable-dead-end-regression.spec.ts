import { expect, test } from '@playwright/test';
import {
  checkCableEndExit,
  makeRuntime,
} from '../src/puzzle/collision';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { skillTopologyDefinitionsAreCommitSafe } from '../src/skill/skillTopology';
import type { ArrowDefinition } from '../src/puzzle/types';

const definition = (
  id: string,
  path: ArrowDefinition['path'],
  exitDirection: ArrowDefinition['exitDirection'],
): ArrowDefinition => ({ id, path, exitDirection, color: 0x4b79c9, lengthClass: 'short' });

test('an exit ray that turns back through its own cable is not removable', () => {
  const selfBlocked = makeRuntime(definition(
    'self-blocked',
    [[3, 5, 5], [3, 6, 5], [6, 6, 5], [6, 5, 5]],
    '-X',
  ));
  const result = checkCableEndExit(selfBlocked, [selfBlocked], 'head');
  expect(result.clear).toBe(false);
  expect(result.blockerId).toBe('self-blocked');
});

test('a cable body cannot pass through a single-ended plug envelope', () => {
  const plugOwner = makeRuntime(definition(
    'plug-owner',
    [[5, 4, 5], [5, 5, 5]],
    '+Y',
  ));
  const crossing = makeRuntime(definition(
    'crossing',
    [[4, 6, 5], [6, 6, 5]],
    '+X',
  ));
  const issues = validatePuzzleGeometry([plugOwner.definition, crossing.definition]);
  expect(issues).toContainEqual(expect.objectContaining({
    kind: 'plug-overlap',
    arrowId: 'plug-owner',
    otherArrowId: 'crossing',
  }));
});

test('skill topology commits reject a swapped plug that would enter a neighboring cable', () => {
  const moving = definition('moving', [[3, 5, 5], [5, 5, 5]], '+Y');
  const neighbor = definition('neighbor', [[2, 4, 5], [2, 6, 5]], '+Y');
  const swapped: ArrowDefinition = {
    ...moving,
    path: [...moving.path].reverse(),
    exitDirection: '-X',
  };

  expect(validatePuzzleGeometry([moving, neighbor])).toEqual([]);
  expect(validatePuzzleGeometry([swapped, neighbor])).toContainEqual(expect.objectContaining({
    kind: 'plug-overlap',
    arrowId: 'moving',
    otherArrowId: 'neighbor',
  }));
  expect(skillTopologyDefinitionsAreCommitSafe([swapped, neighbor])).toBe(false);
});
