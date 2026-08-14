import { generatePuzzle } from '../src/puzzle/generator';
import { applianceSeedForPuzzle, getRandomLevel } from '../src/puzzle/levels';
import { selectAppliancesForSeed } from '../src/systems/ApplianceCatalog';
import { ARROW_COLORS } from '../src/style/palette';

for (let seed = 1; seed <= 120; seed += 1) {
  const definitions = selectAppliancesForSeed(applianceSeedForPuzzle(seed));
  const lampIndex = definitions.findIndex((definition) => definition.id === 'lamp');
  if (lampIndex < 0) continue;
  const level = getRandomLevel(seed);
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'random',
  });
  const first = puzzle.arrows.find((arrow) => arrow.id === puzzle.solution[0]);
  if (first?.color !== ARROW_COLORS[lampIndex]) continue;
  console.log(JSON.stringify({ seed, lampIndex, lampColor: ARROW_COLORS[lampIndex], firstArrow: first.id }));
  break;
}
