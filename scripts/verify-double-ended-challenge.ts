import {
  availableCableEnds,
  makeRuntime,
} from '../src/puzzle/collision';
import { generatePuzzle } from '../src/puzzle/generator';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { getRandomLevel } from '../src/puzzle/levels';
import {
  RANDOM_CHALLENGE_MODE_WEIGHTS,
  selectRandomChallengeMode,
} from '../src/puzzle/randomChallengeModes';

const pool = Array.from({ length: 10_000 }, (_, seed) => ({
  mode: selectRandomChallengeMode(seed),
  level: getRandomLevel(seed),
}));
const doubleEndedPool = pool.filter(
  ({ mode, level }) => mode === 'double-ended' && level.challengeKind === 'double-ended',
);
const rushPool = pool.filter(({ mode }) => mode === 'rush');
const ratio = doubleEndedPool.length / pool.length;
const rushRatio = rushPool.length / pool.length;
if (ratio < 0.18 || ratio > 0.22) throw new Error(`Double-ended pool ratio ${ratio}`);
if (rushRatio < 0.18 || rushRatio > 0.22) throw new Error(`RUSH pool ratio ${rushRatio}`);
const doubleEndedWeight = RANDOM_CHALLENGE_MODE_WEIGHTS.find(
  ({ mode }) => mode === 'double-ended',
)?.weight;
const rushWeight = RANDOM_CHALLENGE_MODE_WEIGHTS.find(({ mode }) => mode === 'rush')?.weight;
if (doubleEndedWeight !== rushWeight) {
  throw new Error(`Mode weights differ: double-ended=${doubleEndedWeight}, RUSH=${rushWeight}`);
}

const seeds = doubleEndedPool.slice(0, 24).map(({ level }) => level.seed);
let threeChoiceSteps = 0;
let totalSteps = 0;

for (const seed of seeds) {
  const level = getRandomLevel(seed);
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'random',
  });
  if (puzzle.arrows.length !== Math.round(level.referenceTargetCount! * 0.8)) {
    throw new Error(`Seed ${seed} has wrong cable count ${puzzle.arrows.length}`);
  }
  if (puzzle.arrows.some((arrow) => !arrow.doubleEnded)) {
    throw new Error(`Seed ${seed} contains a single-ended cable`);
  }
  const geometryIssues = validatePuzzleGeometry(puzzle.arrows);
  if (geometryIssues.length > 0) throw new Error(`Seed ${seed} geometry: ${JSON.stringify(geometryIssues[0])}`);

  const runtimes = puzzle.arrows.map(makeRuntime);
  puzzle.solution.forEach((id, index) => {
    const choices = availableCableEnds(runtimes);
    if (choices.length < 1 || choices.length > 3) {
      throw new Error(`Seed ${seed} step ${index} exposes ${choices.length} plugs`);
    }
    if (!choices.some((choice) => choice.id === id && choice.end === puzzle.solutionEnds?.[index])) {
      throw new Error(`Seed ${seed} step ${index} solution is blocked`);
    }
    if (choices.length === 3) threeChoiceSteps += 1;
    totalSteps += 1;
    runtimes.find((runtime) => runtime.definition.id === id)!.state = 'removed';
  });

  const alternate = puzzle.arrows.map(makeRuntime);
  for (let step = 0; step < alternate.length; step += 1) {
    const choices = availableCableEnds(alternate);
    if (choices.length === 0) throw new Error(`Seed ${seed} alternate path deadlocked at ${step}`);
    if (choices.length === 3) threeChoiceSteps += 1;
    const selected = choices[(seed + step) % choices.length];
    alternate.find((runtime) => runtime.definition.id === selected.id)!.state = 'removed';
  }
}

if (threeChoiceSteps === 0) {
  throw new Error('Double-ended templates never expose the required occasional three-choice step');
}

console.log(JSON.stringify({
  poolSamples: pool.length,
  doubleEndedPool: doubleEndedPool.length,
  ratio,
  rushPool: rushPool.length,
  rushRatio,
  verifiedSeeds: seeds.length,
  totalSteps,
  threeChoiceSteps,
}));
