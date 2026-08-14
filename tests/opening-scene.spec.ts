import { expect, test } from '@playwright/test';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { OPENING_CABLES } from '../src/systems/OpeningScene';

test('opening cables are open-ended real cable paths with clear geometry', () => {
  expect(OPENING_CABLES).toHaveLength(5);
  for (const cable of OPENING_CABLES) {
    expect(cable.path[0]).not.toEqual(cable.path[cable.path.length - 1]);
  }
  expect(validatePuzzleGeometry(OPENING_CABLES)).toEqual([]);
});
