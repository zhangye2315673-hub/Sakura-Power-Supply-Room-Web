export type RandomChallengeMode = 'standard' | 'exploration' | 'skill' | 'double-ended' | 'rush';

export const RANDOM_CHALLENGE_MODE_WEIGHTS = Object.freeze([
  { mode: 'standard', weight: 20 },
  { mode: 'exploration', weight: 20 },
  { mode: 'skill', weight: 20 },
  { mode: 'double-ended', weight: 20 },
  { mode: 'rush', weight: 20 },
] as const satisfies readonly Readonly<{
  mode: RandomChallengeMode;
  weight: number;
}>[]);

function mixSeed(seed: number): number {
  let mixed = seed >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

export function selectRandomChallengeMode(selectionSeed: number): RandomChallengeMode {
  const totalWeight = RANDOM_CHALLENGE_MODE_WEIGHTS.reduce(
    (total, entry) => total + entry.weight,
    0,
  );
  const roll = mixSeed(selectionSeed ^ 0x9e3779b9) % totalWeight;
  let cumulativeWeight = 0;

  for (const entry of RANDOM_CHALLENGE_MODE_WEIGHTS) {
    cumulativeWeight += entry.weight;
    if (roll < cumulativeWeight) return entry.mode;
  }

  return 'standard';
}
