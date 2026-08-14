import { generatePuzzle } from '../src/puzzle/generator';
import type { DifficultyBand, LevelDefinition, ShapeId } from '../src/puzzle/types';

const [shape = 'cube', targetText = '12', minText = '3', maxText = '6', difficulty = 'normal', limitText = '40'] = process.argv.slice(2);
const target = Number(targetText);
const minInitiallyFree = Number(minText);
const maxInitiallyFree = Number(maxText);
const limit = Number(limitText);
const difficultyBand = difficulty as DifficultyBand;
const quotas = {
  easy: { short: 0.08, medium: 0.42, long: 0.5 },
  normal: { short: 0.1, medium: 0.42, long: 0.48 },
  hard: { short: 0.12, medium: 0.43, long: 0.45 },
  expert: { short: 0.12, medium: 0.43, long: 0.45 },
} as const;
const boundaryRatios = { easy: 0.4, normal: 0.12, hard: 0.08, expert: 0.05 } as const;
const level: LevelDefinition = {
  id: 0,
  seed: 0,
  label: 'seed search',
  shape: shape as ShapeId,
  difficulty: difficultyBand,
  targetCount: target,
  lengthQuota: quotas[difficultyBand],
  minInitiallyFree,
  maxInitiallyFree,
  boundaryHeadRatio: boundaryRatios[difficultyBand],
  halfExtents: [4, 4, 4],
  minSpans: [5, 5, 5],
  minNeighborRatio: 0.3,
  minDensity: 0,
  cameraRadius: 21,
};

for (let index = 1; index <= limit; index += 1) {
  const seed = Math.imul(index, 0x9e3779b1) >>> 0;
  const startedAt = performance.now();
  const puzzle = generatePuzzle(seed, target, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree,
    maxInitiallyFree,
    level,
    maxSearchAttempts: 1,
  });
  const generationMs = Math.round(performance.now() - startedAt);
  console.log(JSON.stringify({ index, seed, count: puzzle.arrows.length, initiallyFree: puzzle.initiallyFree, generationMs }));
  if (
    puzzle.arrows.length === target &&
    puzzle.initiallyFree >= minInitiallyFree &&
    puzzle.initiallyFree <= maxInitiallyFree
  ) {
    break;
  }
}
