import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { OPENING_CABLES, OpeningScene } from '../src/systems/OpeningScene';
import type { SeasonMode } from '../src/theme/SeasonProfiles';

test('opening cables are open-ended real cable paths with clear geometry', () => {
  expect(OPENING_CABLES).toHaveLength(5);
  for (const cable of OPENING_CABLES) {
    expect(cable.path[0]).not.toEqual(cable.path[cable.path.length - 1]);
  }
  expect(validatePuzzleGeometry(OPENING_CABLES)).toEqual([]);
});

const seasonWeights = (season: SeasonMode): Record<SeasonMode, number> => ({
  spring: season === 'spring' ? 1 : 0,
  summer: season === 'summer' ? 1 : 0,
  autumn: season === 'autumn' ? 1 : 0,
  winter: season === 'winter' ? 1 : 0,
});

test('首页开场飘落物按生命周期渐进切换季节，不混合形状', () => {
  const opening = new OpeningScene();
  opening.setSeasonState(seasonWeights('spring'), 0);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 20);
  opening.update(1 / 60, 0, camera);
  expect(opening.getStateSummary().visibleSeasonLayers).toEqual(['spring']);

  opening.setSeasonState(seasonWeights('winter'), 0);
  opening.update(1 / 60, 0.1, camera);
  expect(opening.getStateSummary().visibleSeasonLayers).toEqual(['spring']);

  for (let index = 1; index <= 900; index += 1) {
    opening.update(1 / 60, index / 60, camera);
  }
  expect(opening.getStateSummary().visibleSeasonLayers).toEqual(['winter']);
  opening.dispose();
});
