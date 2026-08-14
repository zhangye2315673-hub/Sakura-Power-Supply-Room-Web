import {
  analyzeRandomDifficulty,
  freeDefinitions,
  hardDifficultyChecks,
  removalSequenceIsValid,
} from '../src/puzzle/difficulty';
import { validatePuzzleGeometry } from '../src/puzzle/geometryValidation';
import { RANDOM_CHALLENGE_PROFILES } from '../src/puzzle/levels';
import { RANDOM_PUZZLE_TEMPLATES } from '../src/puzzle/randomTemplates.generated';
import type { ArrowDefinition, DirectionKey } from '../src/puzzle/types';

const DIRECTIONS: readonly DirectionKey[] = ['+X', '-X', '+Y', '-Y', '+Z', '-Z'];
const TARGETS: Record<string, readonly string[]> = {
  'cylinder-54': ['arrow-9', 'arrow-21', 'arrow-49', 'arrow-54'],
  'octahedron-46': ['arrow-29', 'arrow-30', 'arrow-40', 'arrow-45'],
  'cube-54': ['arrow-1', 'arrow-27'],
};

function assignments(ids: readonly string[], index = 0, current: DirectionKey[] = []): DirectionKey[][] {
  if (index === ids.length) return [[...current]];
  return DIRECTIONS.flatMap((direction) => assignments(ids, index + 1, [...current, direction]));
}

const CURVE_RESTORES = {
  'cylinder-46': {
    opening: { remaining: 46, free: 12, obvious: 2 },
    firstGate: { remaining: 35, free: 8, obvious: 0 },
    centralGate: { remaining: 23, free: 5, obvious: 0 },
    release: { remaining: 12, free: 5, obvious: 0 },
  },
  'cylinder-50': {
    opening: { remaining: 50, free: 15, obvious: 2 },
    firstGate: { remaining: 38, free: 8, obvious: 0 },
    centralGate: { remaining: 25, free: 6, obvious: 0 },
    release: { remaining: 13, free: 5, obvious: 0 },
  },
} as const;

for (const [key, expectedCurve] of Object.entries(CURVE_RESTORES)) {
  const template = RANDOM_PUZZLE_TEMPLATES[key];
  const [shape, countText] = key.split('-') as [ArrowDefinition['id'], string];
  const profile = RANDOM_CHALLENGE_PROFILES.find(
    (candidate) => candidate.shape === shape && candidate.targetCount === Number(countText),
  );
  if (!template || !profile) throw new Error(`Missing restore target ${key}`);
  const valid = [];
  for (const arrow of template.arrows) {
    for (const direction of DIRECTIONS) {
      if (direction === arrow.exitDirection) continue;
      const arrows = template.arrows.map((candidate) => (
        candidate.id === arrow.id ? { ...candidate, exitDirection: direction } : candidate
      ));
      if (validatePuzzleGeometry(arrows).length > 0) continue;
      if (!removalSequenceIsValid(arrows, template.solution)) continue;
      const curve = analyzeRandomDifficulty(arrows, template.solution, profile.shape, profile.halfExtents);
      if (JSON.stringify(curve) !== JSON.stringify(expectedCurve)) continue;
      valid.push({ id: arrow.id, from: arrow.exitDirection, to: direction, curve });
    }
  }
  console.log(JSON.stringify({ key, restoreCandidates: valid }, null, 2));
}

for (const [key, ids] of Object.entries(TARGETS)) {
  const template = RANDOM_PUZZLE_TEMPLATES[key];
  if (!template) throw new Error(`Missing template ${key}`);
  const [shape, countText] = key.split('-') as [ArrowDefinition['id'], string];
  const profile = RANDOM_CHALLENGE_PROFILES.find(
    (candidate) => candidate.shape === shape && candidate.targetCount === Number(countText),
  );
  if (!profile) throw new Error(`Missing profile ${key}`);

  const originals = new Map(
    template.arrows
      .filter((arrow) => ids.includes(arrow.id))
      .map((arrow) => [arrow.id, arrow.exitDirection]),
  );
  const valid: Array<{
    changes: number;
    initiallyFree: number;
    directions: Record<string, DirectionKey>;
    curve: unknown;
  }> = [];
  const stageCounts = { geometry: 0, removal: 0, initialFree: 0, difficulty: 0 };

  for (const candidateDirections of assignments(ids)) {
    const directions = Object.fromEntries(
      ids.map((id, index) => [id, candidateDirections[index]]),
    ) as Record<string, DirectionKey>;
    const arrows = template.arrows.map((arrow) => (
      directions[arrow.id]
        ? { ...arrow, exitDirection: directions[arrow.id] }
        : arrow
    ));
    if (validatePuzzleGeometry(arrows).length > 0) continue;
    stageCounts.geometry += 1;
    if (!removalSequenceIsValid(arrows, template.solution)) continue;
    stageCounts.removal += 1;
    const initiallyFree = freeDefinitions(arrows).length;
    if (initiallyFree < profile.minInitiallyFree || initiallyFree > profile.maxInitiallyFree) continue;
    stageCounts.initialFree += 1;
    const curve = analyzeRandomDifficulty(arrows, template.solution, profile.shape, profile.halfExtents);
    if (Object.values(hardDifficultyChecks(curve)).some((passed) => !passed)) continue;
    stageCounts.difficulty += 1;
    const changes = ids.filter((id) => directions[id] !== originals.get(id)).length;
    valid.push({ changes, initiallyFree, directions, curve });
  }

  valid.sort((left, right) => left.changes - right.changes);
  console.log(JSON.stringify({ key, stageCounts, candidates: valid.slice(0, 12) }, null, 2));
}
