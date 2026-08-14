import { generatePuzzle } from './generator';
import { buildRushPuzzle, getRushChallengeByLevelId } from './rushChallenges';
import type { LevelDefinition } from './types';

type GenerateRequest = {
  requestId: number;
  seed: number;
  targetCount: number;
  level?: LevelDefinition;
  mode?: 'campaign' | 'random' | 'skill' | 'rush';
};

self.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { requestId, seed, targetCount, level, mode } = event.data;
  const startedAt = performance.now();
  try {
    const rushChallenge = mode === 'rush' && level
      ? getRushChallengeByLevelId(level.id)
      : null;
    if (mode === 'rush' && !rushChallenge) {
      throw new Error(`Unknown fixed RUSH level ${level?.id ?? 'missing'}.`);
    }
    self.postMessage({
      requestId,
      puzzle: rushChallenge
        ? buildRushPuzzle(rushChallenge)
        : generatePuzzle(seed, targetCount, {
            shape: level?.shape,
            lengthQuota: level?.lengthQuota,
            minInitiallyFree: level?.minInitiallyFree,
            maxInitiallyFree: level?.maxInitiallyFree,
            level,
            mode,
          }),
      generationMs: performance.now() - startedAt,
    });
  } catch (error) {
    self.postMessage({
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
