import type {
  DifficultyBand,
  GridExtents,
  LevelDefinition,
  LengthQuota,
  RandomChallengeKind,
  ShapeId,
} from './types';
import { selectRandomChallengeMode } from './randomChallengeModes';

const TUTORIAL_QUOTAS: readonly LengthQuota[] = [
  { short: 0.2, medium: 0.6, long: 0.2 },
  { short: 0.14, medium: 0.58, long: 0.28 },
  { short: 0.12, medium: 0.55, long: 0.33 },
  { short: 0.1, medium: 0.55, long: 0.35 },
  { short: 0.18, medium: 0.52, long: 0.3 },
];

function level(
  id: number,
  seed: number,
  shape: ShapeId,
  difficulty: DifficultyBand,
  targetCount: number,
  minInitiallyFree: number,
  maxInitiallyFree: number,
  halfExtents: GridExtents,
  minSpans: GridExtents,
  minNeighborRatio: number,
  minDensity: number,
  cameraRadius: number,
  lengthQuota: LengthQuota,
): LevelDefinition {
  return {
    id,
    seed,
    label: `${id.toString().padStart(2, '0')} · ${shape}`,
    shape,
    difficulty,
    targetCount,
    lengthQuota,
    minInitiallyFree,
    maxInitiallyFree,
    boundaryHeadRatio: difficulty === 'easy' ? 0.16 : 0.08,
    halfExtents,
    minSpans,
    minNeighborRatio,
    minDensity,
    cameraRadius,
  };
}

export const CAMPAIGN_LEVELS: readonly LevelDefinition[] = [
  level(1, 2654435761, 'cube', 'easy', 5, 2, 3, [2, 2, 2], [4, 4, 4], 0.2, 0.24, 19.2, TUTORIAL_QUOTAS[0]),
  level(2, 1013904226, 'cuboid', 'easy', 7, 2, 3, [3, 2, 2], [5, 3, 3], 0.24, 0.25, 19.4, TUTORIAL_QUOTAS[1]),
  level(3, 3668339987, 'pyramid', 'normal', 9, 2, 3, [3, 3, 3], [4, 5, 4], 0.28, 0.18, 19.8, TUTORIAL_QUOTAS[2]),
  level(4, 2802362286, 'cylinder', 'normal', 12, 3, 4, [3, 3, 3], [4, 5, 4], 0.32, 0.35, 20.2, TUTORIAL_QUOTAS[3]),
  level(5, 387276917, 'sphere', 'hard', 16, 3, 5, [4, 4, 4], [6, 6, 6], 0.36, 0.28, 20.8, TUTORIAL_QUOTAS[4]),
  level(6, 19088743, 'octahedron', 'hard', 18, 4, 5, [4, 4, 4], [6, 6, 6], 0.38, 0.26, 21.2, { short: 0.12, medium: 0.53, long: 0.35 }),
  level(7, 305419896, 'cuboid', 'hard', 24, 4, 6, [5, 4, 4], [7, 6, 6], 0.40, 0.22, 21.8, { short: 0.10, medium: 0.52, long: 0.38 }),
  level(8, 3735928559, 'pyramid', 'expert', 28, 4, 6, [5, 5, 5], [7, 7, 7], 0.42, 0.27, 22.4, { short: 0.08, medium: 0.50, long: 0.42 }),
];

export type RandomChallengeProfile = Readonly<{
  shape: ShapeId;
  halfExtents: GridExtents;
  targetCount: number;
  maxFreeRatio?: number;
  minDensity?: number;
}>;

export const RANDOM_CHALLENGE_PROFILES: readonly RandomChallengeProfile[] = [
  { shape: 'cube', halfExtents: [5, 5, 5], targetCount: 42, maxFreeRatio: 0.48, minDensity: 0.2 },
  { shape: 'cylinder', halfExtents: [5, 5, 5], targetCount: 42, maxFreeRatio: 0.48, minDensity: 0.2 },
  { shape: 'sphere', halfExtents: [5, 5, 5], targetCount: 42, maxFreeRatio: 0.48, minDensity: 0.2 },
  { shape: 'octahedron', halfExtents: [5, 5, 5], targetCount: 42, maxFreeRatio: 0.48, minDensity: 0.2 },
  { shape: 'cube', halfExtents: [5, 5, 5], targetCount: 46, maxFreeRatio: 0.42, minDensity: 0.2 },
  { shape: 'cylinder', halfExtents: [5, 5, 5], targetCount: 46, maxFreeRatio: 0.42, minDensity: 0.2 },
  { shape: 'sphere', halfExtents: [5, 5, 5], targetCount: 46, maxFreeRatio: 0.42, minDensity: 0.2 },
  { shape: 'octahedron', halfExtents: [5, 5, 5], targetCount: 46, maxFreeRatio: 0.42, minDensity: 0.2 },
  { shape: 'cube', halfExtents: [5, 5, 5], targetCount: 50, maxFreeRatio: 0.38, minDensity: 0.2 },
  { shape: 'cylinder', halfExtents: [5, 5, 5], targetCount: 50, maxFreeRatio: 0.38, minDensity: 0.2 },
  { shape: 'cube', halfExtents: [5, 5, 5], targetCount: 54, maxFreeRatio: 0.34, minDensity: 0.2 },
  { shape: 'cylinder', halfExtents: [5, 5, 5], targetCount: 54, maxFreeRatio: 0.34, minDensity: 0.2 },
];

const RANDOM_COUNT_WEIGHTS: readonly { count: number; weight: number }[] = [
  { count: 42, weight: 20 },
  { count: 46, weight: 25 },
  { count: 50, weight: 35 },
  { count: 54, weight: 20 },
];

function mixSeed(seed: number): number {
  let mixed = seed >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

function randomChallengeProfile(
  seed: number,
  maximumTargetCount = Number.POSITIVE_INFINITY,
): RandomChallengeProfile {
  const mixed = mixSeed(seed ^ 0x5f3759df);
  const eligibleCounts = RANDOM_COUNT_WEIGHTS.filter(
    (entry) => entry.count <= maximumTargetCount,
  );
  const totalWeight = eligibleCounts.reduce((total, entry) => total + entry.weight, 0);
  const countRoll = mixed % totalWeight;
  let cumulativeWeight = 0;
  const targetCount = eligibleCounts.find((entry) => {
    cumulativeWeight += entry.weight;
    return countRoll < cumulativeWeight;
  })?.count ?? eligibleCounts[eligibleCounts.length - 1].count;
  const candidates = RANDOM_CHALLENGE_PROFILES.filter(
    (profile) => profile.targetCount === targetCount,
  );
  return candidates[mixSeed(mixed ^ 0x9e3779b9) % candidates.length];
}

export function getRandomChallengeKind(seed: number): RandomChallengeKind {
  return selectRandomChallengeMode(seed) === 'double-ended' ? 'double-ended' : 'standard';
}

export function getCampaignLevel(id: number): LevelDefinition {
  return CAMPAIGN_LEVELS[Math.max(1, Math.min(CAMPAIGN_LEVELS.length, id)) - 1];
}

export function getRandomLevel(seed: number): LevelDefinition {
  const challengeKind = getRandomChallengeKind(seed);
  return buildRandomLevel(seed, challengeKind, false);
}

export function getStandardRandomLevel(seed: number): LevelDefinition {
  return buildRandomLevel(seed, 'standard', false);
}

export function getDoubleEndedLevel(seed: number): LevelDefinition {
  return buildRandomLevel(seed, 'double-ended', false);
}

export function getSkillChallengeLevel(seed: number): LevelDefinition {
  return buildRandomLevel(seed, 'standard', true);
}

function buildRandomLevel(
  seed: number,
  challengeKind: RandomChallengeKind,
  skillChallenge: boolean,
): LevelDefinition {
  const profile = randomChallengeProfile(
    seed,
    challengeKind === 'double-ended' ? 50 : Number.POSITIVE_INFINITY,
  );
  const referenceTargetCount = profile.targetCount;
  const shape = challengeKind === 'double-ended' ? 'cube' : profile.shape;
  const targetCount = challengeKind === 'double-ended'
    ? Math.round(referenceTargetCount * 0.8)
    : referenceTargetCount;
  return {
    id: 0,
    seed,
    label: `随机 · ${shape}`,
    shape,
    difficulty: targetCount >= 23 ? 'expert' : 'hard',
    targetCount,
    lengthQuota: { short: 0.1, medium: 0.45, long: 0.45 },
    minInitiallyFree: challengeKind === 'double-ended'
      ? 1
      : skillChallenge
        ? 4
      : Math.max(4, Math.floor(targetCount * 0.1)),
    maxInitiallyFree: challengeKind === 'double-ended'
      ? 3
      : skillChallenge
        ? 8
      : Math.min(18, Math.max(7, Math.ceil(targetCount * (profile.maxFreeRatio ?? 0.24)))),
    boundaryHeadRatio: 0.055,
    halfExtents: profile.halfExtents,
    minSpans: profile.halfExtents.map((extent) => Math.max(4, extent * 2 - 2)) as unknown as GridExtents,
    minNeighborRatio: 0.38,
    minDensity: profile.minDensity ?? 0.28,
    cameraRadius: 22.8,
    challengeKind,
    referenceTargetCount,
  };
}

export function seedForCampaignLevel(id: number): number {
  return getCampaignLevel(id).seed;
}

export function applianceSeedForPuzzle(puzzleSeed: number, levelId = 0): number {
  const salt = levelId > 0 ? Math.imul(levelId, 0x9e3779b9) : 0xa511e9b3;
  return Math.imul((puzzleSeed ^ salt) >>> 0, 0x85ebca6b) >>> 0;
}
