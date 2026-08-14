import { generatePuzzle } from '../src/puzzle/generator';
import {
  analyzeRandomDifficulty,
  freeDefinitions,
  hardDifficultyChecks,
  hardWiringChecks,
  measureWiringComplexity,
  removalSequenceIsValid,
} from '../src/puzzle/difficulty';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { measurePuzzleCompactness } from '../src/puzzle/gridOccupancy';
import { getRandomLevel, RANDOM_CHALLENGE_PROFILES } from '../src/puzzle/levels';
import { pointInsideShape } from '../src/puzzle/shapes';

const requestedSeeds = process.argv
  .slice(2)
  .flatMap((value) => value.split(','))
  .map(Number)
  .filter((value) => Number.isInteger(value));
const profileKeys = new Set(
  RANDOM_CHALLENGE_PROFILES.map((profile) => `${profile.shape}-${profile.targetCount}`),
);

function collectCoverageSeeds(samplesPerProfile = 4): number[] {
  const collected = new Map<string, number[]>();
  for (let seed = 0; seed < 100_000; seed += 1) {
    const level = getRandomLevel(seed);
    const key = `${level.shape}-${level.targetCount}`;
    if (!profileKeys.has(key)) continue;
    const samples = collected.get(key) ?? [];
    if (samples.length < samplesPerProfile) samples.push(seed);
    collected.set(key, samples);
    if ([...profileKeys].every((profileKey) => (collected.get(profileKey)?.length ?? 0) >= samplesPerProfile)) {
      return [...collected.values()].flat();
    }
  }
  throw new Error(`Unable to cover every random profile: ${[...profileKeys].filter((key) => !collected.has(key)).join(', ')}`);
}

const seeds = requestedSeeds.length > 0 ? requestedSeeds : collectCoverageSeeds();
let failed = false;
const coveredProfiles = new Set<string>();

for (const seed of seeds) {
  const level = getRandomLevel(seed);
  coveredProfiles.add(`${level.shape}-${level.targetCount}`);
  const startedAt = performance.now();
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'random',
  });
  const compactness = measurePuzzleCompactness(puzzle.arrows);
  const geometryIssues = validatePuzzleGeometry(puzzle.arrows);
  const wiring = measureWiringComplexity(puzzle.arrows);
  const difficultyCurve = analyzeRandomDifficulty(
    puzzle.arrows,
    puzzle.solution,
    level.shape,
    level.halfExtents,
  );
  const actualInitiallyFree = freeDefinitions(puzzle.arrows).length;
  const checks = {
    challengeCount: puzzle.arrows.length >= 40 && puzzle.arrows.length === level.targetCount,
    initiallyFree:
      puzzle.initiallyFree >= level.minInitiallyFree &&
      puzzle.initiallyFree <= level.maxInitiallyFree,
    solvable: removalSequenceIsValid(puzzle.arrows, puzzle.solution),
    geometryClear: geometryIssues.length === 0,
    insideShape: puzzle.arrows.every((arrow) =>
      arrow.path.every((point) => pointInsideShape(level.shape, point, level.halfExtents))),
    initialFreeAccurate: actualInitiallyFree === puzzle.initiallyFree,
    neighborRatio: compactness.neighborRatio >= level.minNeighborRatio,
    density: compactness.density >= level.minDensity,
    connectedCluster: compactness.connectedRatio === 1,
    noIsolatedArrows: compactness.isolatedArrowIds.length === 0,
    longCableShare:
      puzzle.arrows.filter((arrow) => arrow.lengthClass === 'long').length >=
      Math.floor(puzzle.arrows.length * 0.2),
    ...hardDifficultyChecks(difficultyCurve),
    ...hardWiringChecks(wiring),
  };
  if (Object.values(checks).some((passed) => !passed)) failed = true;
  console.log(JSON.stringify({
    seed,
    shape: level.shape,
    count: puzzle.arrows.length,
    target: level.targetCount,
    initiallyFree: puzzle.initiallyFree,
    actualInitiallyFree,
    compactness,
    wiring,
    difficultyCurve,
    geometryIssues,
    generationMs: Math.round(performance.now() - startedAt),
    checks,
  }));
}

if (requestedSeeds.length === 0) {
  const missingProfiles = [...profileKeys].filter((key) => !coveredProfiles.has(key));
  if (missingProfiles.length > 0) {
    failed = true;
    console.error(`Missing random profile coverage: ${missingProfiles.join(', ')}`);
  }
  console.log(JSON.stringify({
    profileCoverage: [...coveredProfiles].sort(),
    expectedProfiles: [...profileKeys].sort(),
    samples: seeds.length,
  }));
}

if (failed) process.exitCode = 1;
