import { generatePuzzle } from '../src/puzzle/generator';
import { applianceSeedForPuzzle, getRandomLevel } from '../src/puzzle/levels';
import { selectAppliancesForSeed, type ApplianceKind } from '../src/systems/ApplianceCatalog';
import { checkArrowExit, makeRuntime } from '../src/puzzle/collision';

const kinds = ['lamp', 'kettle', 'radio', 'blender', 'refrigerator', 'hair-dryer', 'toaster'] as const satisfies readonly ApplianceKind[];
const matches = new Map<ApplianceKind, number>();

for (let seed = 1; seed <= 10_000 && matches.size < kinds.length; seed += 1) {
  const definitions = selectAppliancesForSeed(applianceSeedForPuzzle(seed));
  const level = getRandomLevel(seed);
  if (level.challengeKind === 'double-ended') continue;
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'random',
  });
  const runtimes = puzzle.arrows.map(makeRuntime);
  const activeColors = [...new Set(puzzle.arrows.map((arrow) => arrow.color))];

  for (const kind of kinds) {
    if (matches.has(kind)) continue;
    const applianceIndex = definitions.findIndex((definition) => definition.id === kind);
    const assignedColor = applianceIndex >= 0 ? activeColors[applianceIndex] : undefined;
    if (assignedColor !== undefined && runtimes.some((arrow) =>
      arrow.definition.color === assignedColor && checkArrowExit(arrow, runtimes).clear,
    )) matches.set(kind, seed);
  }
}

for (const kind of kinds) {
  const seed = matches.get(kind);
  if (seed === undefined) throw new Error(`No deterministic first-move evidence seed found for ${kind}.`);
  console.log(`${kind}: ${seed}`);
}
