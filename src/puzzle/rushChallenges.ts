import { RUSH_LAYOUTS, type FixedRushLayout } from './rushLayouts.generated';
import { selectRandomChallengeMode } from './randomChallengeModes';
import type {
  DifficultyBand,
  LevelDefinition,
  LengthQuota,
  PuzzleDefinition,
  ShapeId,
} from './types';

export type RushChallengeId = `rush-${string}`;

export type LocalizedRushText = Readonly<{
  zh: string;
  en: string;
}>;

export type RushChallenge = Readonly<{
  id: RushChallengeId;
  title: LocalizedRushText;
  objective: LocalizedRushText;
  timeLimitSeconds: number;
  level: LevelDefinition;
  layout: FixedRushLayout;
  validation: Readonly<{
    solvable: true;
    geometrySafe: true;
  }>;
}>;

const VERIFIED = Object.freeze({ solvable: true, geometrySafe: true } as const);
export const RUSH_RANDOM_LINE_RATIO = 0.8;
export const RUSH_WARMUP_RULES = Object.freeze({
  challengeCount: 2,
  minimumShortShare: 0.6,
  maximumLongShare: 0,
  maximumAverageTurns: 2.2,
} as const);

type RushLevelTuning = Readonly<{
  targetCount?: number;
  lengthQuota?: LengthQuota;
  warmup?: boolean;
}>;

function rushLevel(
  id: number,
  seed: number,
  shape: ShapeId,
  difficulty: DifficultyBand,
  referenceTargetCount: number,
  tuning: RushLevelTuning = {},
): LevelDefinition {
  const targetCount = tuning.targetCount
    ?? Math.ceil(referenceTargetCount * RUSH_RANDOM_LINE_RATIO);
  const warmup = tuning.warmup === true;
  return {
    id: 100 + id,
    seed,
    label: `RUSH ${id.toString().padStart(2, '0')} · ${shape}`,
    shape,
    difficulty,
    targetCount,
    lengthQuota: tuning.lengthQuota ?? { short: 0.1, medium: 0.45, long: 0.45 },
    minInitiallyFree: warmup
      ? Math.max(5, Math.ceil(targetCount * 0.3))
      : Math.max(2, Math.floor(targetCount * 0.2)),
    maxInitiallyFree: warmup
      ? Math.max(8, Math.ceil(targetCount * 0.5))
      : Math.max(3, Math.ceil(targetCount * 0.42)),
    boundaryHeadRatio: warmup ? 0.28 : 0.055,
    halfExtents: [5, 5, 5],
    minSpans: warmup ? [6, 6, 6] : [8, 8, 8],
    minNeighborRatio: warmup ? 0.26 : 0.38,
    minDensity: warmup ? 0.12 : 0.2,
    cameraRadius: warmup ? 20.8 : 22.8,
    referenceTargetCount,
  };
}

function card(
  id: number,
  title: LocalizedRushText,
  objective: LocalizedRushText,
  timeLimitSeconds: number,
  level: LevelDefinition,
): RushChallenge {
  const challengeId = `rush-${id.toString().padStart(2, '0')}` as RushChallengeId;
  const layout = RUSH_LAYOUTS[challengeId];
  if (!layout) throw new Error(`Missing fixed layout for ${challengeId}.`);
  return Object.freeze({
    id: challengeId,
    title,
    objective,
    timeLimitSeconds,
    level,
    layout,
    validation: VERIFIED,
  });
}

export const RUSH_CHALLENGES: readonly RushChallenge[] = Object.freeze([
  card(1, { zh: '樱核热身', en: 'SAKURA CORE WARM-UP' }, { zh: '快速清空 20 条短线束', en: 'Quick-clear 20 short cables' }, 43, rushLevel(1, 0x13a5c7e1, 'cube', 'easy', 42, {
    targetCount: 20,
    lengthQuota: { short: 0.8, medium: 0.2, long: 0 },
    warmup: true,
  })),
  card(2, { zh: '花筒起速', en: 'BLOOM CYLINDER START' }, { zh: '快速清空 22 条少转角线束', en: 'Quick-clear 22 low-turn cables' }, 47, rushLevel(2, 0x2c7f91b3, 'cylinder', 'easy', 42, {
    targetCount: 22,
    lengthQuota: { short: 0.7, medium: 0.3, long: 0 },
    warmup: true,
  })),
  card(3, { zh: '球心追线', en: 'SPHERE CORE CHASE' }, { zh: '清空 34 条球形线束', en: 'Clear all 34 sphere cables' }, 67, rushLevel(3, 0x37d4a269, 'sphere', 'normal', 42)),
  card(4, { zh: '八面突围', en: 'OCTA BREAKOUT' }, { zh: '清空 34 条八面体线束', en: 'Clear all 34 octahedron cables' }, 69, rushLevel(4, 0x48b2e5d7, 'octahedron', 'normal', 42)),
  card(5, { zh: '樱核加速', en: 'SAKURA CORE ACCEL' }, { zh: '清空 37 条方体线束', en: 'Clear all 37 cube cables' }, 74, rushLevel(5, 0x5e19c483, 'cube', 'normal', 46)),
  card(6, { zh: '环柱穿梭', en: 'CYLINDER SHUTTLE' }, { zh: '清空 37 条圆柱线束', en: 'Clear all 37 cylinder cables' }, 78, rushLevel(6, 0x69f3b1a5, 'cylinder', 'hard', 46)),
  card(7, { zh: '球阵冲刺', en: 'SPHERE GRID SPRINT' }, { zh: '清空 37 条球形线束', en: 'Clear all 37 sphere cables' }, 81, rushLevel(7, 0x7ad582cf, 'sphere', 'hard', 46)),
  card(8, { zh: '八面折返', en: 'OCTA TURNBACK' }, { zh: '清空 37 条八面体线束', en: 'Clear all 37 octahedron cables' }, 84, rushLevel(8, 0x84c16b39, 'octahedron', 'hard', 46)),
  card(9, { zh: '樱核密阵', en: 'SAKURA CORE GRID' }, { zh: '清空 40 条高密方体线束', en: 'Clear all 40 dense cube cables' }, 90, rushLevel(9, 0x95e2d741, 'cube', 'expert', 50)),
  card(10, { zh: '终极速接', en: 'FINAL SPEED LINK' }, { zh: '清空 44 条高密圆柱线束', en: 'Clear all 44 dense cylinder cables' }, 96, rushLevel(10, 0xa7b439ed, 'cylinder', 'expert', 54)),
]);

function mixSeed(seed: number): number {
  let mixed = seed >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

export function getRushChallenge(id: string | null | undefined): RushChallenge | null {
  return RUSH_CHALLENGES.find((challenge) => challenge.id === id) ?? null;
}

export function getRushChallengeByLevelId(levelId: number): RushChallenge | null {
  return RUSH_CHALLENGES.find((challenge) => challenge.level.id === levelId) ?? null;
}

export function getNextRushChallenge(challenge: RushChallenge): RushChallenge | null {
  const index = RUSH_CHALLENGES.findIndex((candidate) => candidate.id === challenge.id);
  return index >= 0 ? RUSH_CHALLENGES[index + 1] ?? null : null;
}

export function pickRushChallenge(selectionSeed: number): RushChallenge {
  return RUSH_CHALLENGES[mixSeed(selectionSeed ^ 0x6d2b79f5) % RUSH_CHALLENGES.length];
}

/** @deprecated Use selectRandomChallengeMode for the extensible total challenge pool. */
export function selectRandomChallengeRule(selectionSeed: number): 'classic' | 'rush' {
  return selectRandomChallengeMode(selectionSeed) === 'rush' ? 'rush' : 'classic';
}

export function buildRushPuzzle(challenge: RushChallenge): PuzzleDefinition {
  return {
    seed: challenge.level.seed,
    arrows: challenge.layout.arrows.map((arrow) => ({
      ...arrow,
      path: arrow.path.map((point) => [...point] as typeof point),
    })),
    solution: [...challenge.layout.solution],
    initiallyFree: challenge.layout.initiallyFree,
    level: challenge.level,
    mode: 'rush',
  };
}
