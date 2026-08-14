import { availableCableEnds, makeRuntime } from '../src/puzzle/collision';
import { generatePuzzle } from '../src/puzzle/generator';
import { applianceSeedForPuzzle, getRandomLevel } from '../src/puzzle/levels';
import { selectAppliancesForSeed, type ApplianceKind } from '../src/systems/ApplianceCatalog';

const requestedKinds = (process.argv.slice(2).filter((argument) => !argument.startsWith('--')) as ApplianceKind[]);
const kinds = requestedKinds.length > 0
  ? requestedKinds
  : ['kettle', 'fan', 'washer', 'printer', 'humidifier', 'dehumidifier'] satisfies ApplianceKind[];
const limitArgument = process.argv.find((argument) => argument.startsWith('--limit='));
const limit = Number(limitArgument?.slice('--limit='.length) ?? 200);

function arrangeColors(seed: number, colors: readonly number[], count: number): number[] {
  const arranged = Array.from({ length: count }, (_, index) => colors[index % colors.length]);
  let state = (seed ^ 0xb5297a4d) >>> 0;
  const random = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let index = arranged.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [arranged[index], arranged[swapIndex]] = [arranged[swapIndex], arranged[index]];
  }
  return arranged;
}

const unresolved = new Set(kinds);
for (let seed = 1; seed <= limit && unresolved.size > 0; seed += 1) {
  const level = getRandomLevel(seed);
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'random',
  });
  const definitions = selectAppliancesForSeed(applianceSeedForPuzzle(seed, 0));
  const activeColors = [...new Set(puzzle.arrows.map((arrow) => arrow.color))];
  const applianceSeed = applianceSeedForPuzzle(seed, 0);
  const arrangedColors = arrangeColors(applianceSeed, activeColors, definitions.length);
  const available = availableCableEnds(puzzle.arrows.map(makeRuntime));
  const arrowsById = new Map(puzzle.arrows.map((arrow) => [arrow.id, arrow]));

  for (const kind of [...unresolved]) {
    const index = definitions.findIndex((definition) => definition.id === kind);
    if (index < 0) continue;
    const accent = arrangedColors[index];
    const matchingEnd = available.find(({ id }) => arrowsById.get(id)?.color === accent);
    if (!matchingEnd) continue;
    console.log(JSON.stringify({
      kind,
      seed,
      applianceSeed,
      challengeKind: level.challengeKind,
      targetCount: puzzle.arrows.length,
      initiallyFree: puzzle.initiallyFree,
      accent,
      cableId: matchingEnd.id,
      cableEnd: matchingEnd.end,
    }));
    unresolved.delete(kind);
  }
}

if (unresolved.size > 0) {
  throw new Error(`No first-move evidence seed found through ${limit}: ${[...unresolved].join(', ')}`);
}
