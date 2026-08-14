import { measureWiringComplexity, removalSequenceIsValid } from '../src/puzzle/difficulty';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import {
  RUSH_CHALLENGES,
  RUSH_RANDOM_LINE_RATIO,
  RUSH_WARMUP_RULES,
  buildRushPuzzle,
} from '../src/puzzle/rushChallenges';

let failed = false;
for (const [index, challenge] of RUSH_CHALLENGES.entries()) {
  const startedAt = performance.now();
  const puzzle = buildRushPuzzle(challenge);
  const warmup = index < RUSH_WARMUP_RULES.challengeCount;
  const shortShare = puzzle.arrows.filter((arrow) => arrow.lengthClass === 'short').length
    / puzzle.arrows.length;
  const longShare = puzzle.arrows.filter((arrow) => arrow.lengthClass === 'long').length
    / puzzle.arrows.length;
  const complexity = measureWiringComplexity(puzzle.arrows);
  const checks = {
    fixedCount: puzzle.arrows.length === challenge.level.targetCount,
    referenceFloor: warmup || puzzle.arrows.length >= Math.ceil(
      (challenge.level.referenceTargetCount ?? 0) * RUSH_RANDOM_LINE_RATIO,
    ),
    warmupShortShare: !warmup || shortShare >= RUSH_WARMUP_RULES.minimumShortShare,
    warmupLongShare: !warmup || longShare <= RUSH_WARMUP_RULES.maximumLongShare,
    warmupTurns: !warmup || complexity.averageTurns <= RUSH_WARMUP_RULES.maximumAverageTurns,
    warmupOpeningChoices: !warmup || (
      puzzle.initiallyFree >= challenge.level.minInitiallyFree
      && puzzle.initiallyFree <= challenge.level.maxInitiallyFree
    ),
    solvable: removalSequenceIsValid(puzzle.arrows, puzzle.solution),
    geometrySafe: validatePuzzleGeometry(puzzle.arrows).length === 0,
  };
  const passed = Object.values(checks).every(Boolean);
  failed ||= !passed;
  console.log(JSON.stringify({
    id: challenge.id,
    milliseconds: Math.round(performance.now() - startedAt),
    arrows: puzzle.arrows.length,
    initiallyFree: puzzle.initiallyFree,
    shortShare: Number(shortShare.toFixed(2)),
    longShare: Number(longShare.toFixed(2)),
    averageTurns: Number(complexity.averageTurns.toFixed(2)),
    checks,
  }));
}

if (failed) process.exitCode = 1;
