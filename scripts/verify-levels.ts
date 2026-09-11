import { availableCableEnds, makeRuntime } from '../src/puzzle/collision';
import { campaignChapter } from '../src/game/CampaignChapters';
import { selectCampaignAppliances } from '../src/systems/ApplianceCatalog';
import { strict as assert } from 'node:assert';
import { generatePuzzle } from '../src/puzzle/generator';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { measurePuzzleCompactness } from '../src/puzzle/gridOccupancy';
import { CAMPAIGN_LEVELS, seedForCampaignLevel } from '../src/puzzle/levels';
import { pointInsideShape } from '../src/puzzle/shapes';
import { GRID_SIZE, type ArrowLengthClass, type DirectionKey, type GridPoint } from '../src/puzzle/types';

const GRID_DIRECTIONS: Record<DirectionKey, GridPoint> = {
  '+X': [1, 0, 0], '-X': [-1, 0, 0],
  '+Y': [0, 1, 0], '-Y': [0, -1, 0],
  '+Z': [0, 0, 1], '-Z': [0, 0, -1],
};

const requestedIds = process.argv
  .slice(2)
  .flatMap((value) => value.split(','))
  .map(Number)
  .filter((value) => Number.isInteger(value));
const levels = requestedIds.length > 0
  ? CAMPAIGN_LEVELS.filter((level) => requestedIds.includes(level.id))
  : CAMPAIGN_LEVELS;

let failed = false;

for (const level of levels) {
  const seed = seedForCampaignLevel(level.id);
  const startedAt = performance.now();
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'campaign',
  });
  const generationMs = Math.round(performance.now() - startedAt);
  const runtimes = puzzle.arrows.map(makeRuntime);
  const choiceCounts: number[] = [];
  for (const id of puzzle.solution) {
    const choices = availableCableEnds(runtimes);
    choiceCounts.push(new Set(choices.map(choice => choice.id)).size);
    assert(choices.some(choice => choice.id === id), `Level ${level.id}: blocked move ${id}`);
    runtimes.find(arrow => arrow.definition.id === id)!.state = 'removed';
  }
  assert(runtimes.every(arrow => arrow.state === 'removed'));
  const colors = new Set(puzzle.arrows.map(arrow => arrow.color));
  assert.equal(selectCampaignAppliances(campaignChapter(level.id).appliances, colors.size).length, colors.size);
  // Every caller owns a copy; scene effects must not mutate the stored campaign layout.
  const again = generatePuzzle(seed, level.targetCount, { shape: level.shape, level, mode: 'campaign' });
  assert.deepEqual(again.arrows, puzzle.arrows);
  assert.notEqual(again.arrows, puzzle.arrows);
  assert.notEqual(again.arrows[0].path, puzzle.arrows[0].path);

  const lengthMix = puzzle.arrows.reduce<Record<ArrowLengthClass, number>>(
    (mix, arrow) => {
      mix[arrow.lengthClass] += 1;
      return mix;
    },
    { short: 0, medium: 0, long: 0 },
  );
  const boundaryHeads = puzzle.arrows.filter((arrow) => {
    const head = arrow.path[arrow.path.length - 1];
    const direction = GRID_DIRECTIONS[arrow.exitDirection];
    const outward: GridPoint = [
      head[0] + direction[0],
      head[1] + direction[1],
      head[2] + direction[2],
    ];
    return outward.some((value) => value < 0 || value >= GRID_SIZE) ||
      !pointInsideShape(level.shape, outward, level.halfExtents);
  }).length;
  const geometryIssues = validatePuzzleGeometry(puzzle.arrows);
  const compactness = measurePuzzleCompactness(puzzle.arrows);
  const checks = {
    exactCount: puzzle.arrows.length === level.targetCount,
    initiallyFree:
      puzzle.initiallyFree >= level.minInitiallyFree &&
      puzzle.initiallyFree <= level.maxInitiallyFree,
    solvable: puzzle.solution.length === puzzle.arrows.length,
    shortRatio: lengthMix.short <= Math.ceil(puzzle.arrows.length * 0.2),
    geometryClear: geometryIssues.length === 0,
    neighborRatio: compactness.neighborRatio >= level.minNeighborRatio,
    density: compactness.density >= level.minDensity,
    noIsolatedArrows: compactness.isolatedArrowIds.length === 0,
    connectedCluster: compactness.connectedRatio >= 0.98,
    withinExtents: compactness.spans.every(
      (span, axis) => span <= level.halfExtents[axis] * 2,
    ),
    minimumSpans: compactness.spans.every(
      (span, axis) => span >= level.minSpans[axis],
    ),
  };
  if (Object.values(checks).some((passed) => !passed)) failed = true;
  console.log(JSON.stringify({
    level: level.id,
    shape: level.shape,
    difficulty: level.difficulty,
    count: puzzle.arrows.length,
    target: level.targetCount,
    initiallyFree: puzzle.initiallyFree,
    expectedFree: [level.minInitiallyFree, level.maxInitiallyFree],
    lengthMix,
    boundaryHeads,
    compactness,
    geometryIssues,
    generationMs,
    choiceCounts,
    checks,
  }));
}

if (failed) process.exitCode = 1;
