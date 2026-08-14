import { generatePuzzle } from '../src/puzzle/generator';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { measurePuzzleCompactness } from '../src/puzzle/gridOccupancy';
import { getCampaignLevel } from '../src/puzzle/levels';

const levelId = Number(process.argv[2] ?? 1);
const limit = Number(process.argv[3] ?? 80);
const level = getCampaignLevel(levelId);

for (let index = 1; index <= limit; index += 1) {
  const seed = Math.imul(index, 0x9e3779b1) >>> 0;
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level: { ...level, seed },
    mode: 'campaign',
    maxSearchAttempts: 1,
  });
  const compactness = measurePuzzleCompactness(puzzle.arrows);
  const passed =
    puzzle.arrows.length === level.targetCount &&
    puzzle.initiallyFree >= level.minInitiallyFree &&
    puzzle.initiallyFree <= level.maxInitiallyFree &&
    compactness.neighborRatio >= level.minNeighborRatio &&
    compactness.connectedRatio >= 0.98 &&
    compactness.isolatedArrowIds.length === 0 &&
    compactness.spans.every((span, axis) => span >= level.minSpans[axis]) &&
    validatePuzzleGeometry(puzzle.arrows).length === 0;
  console.log(JSON.stringify({
    index,
    seed,
    count: puzzle.arrows.length,
    initiallyFree: puzzle.initiallyFree,
    compactness,
    passed,
  }));
  if (passed) break;
}
