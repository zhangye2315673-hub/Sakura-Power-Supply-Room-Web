import { cableEndDirection, findRemovalSequence } from '../puzzle/collision';
import { geometryIsClear } from '../puzzle/geometryValidation';
import type { ArrowDefinition, GridPoint } from '../puzzle/types';

export function reverseCableKeepingExternalEndpoints(
  definition: ArrowDefinition,
): ArrowDefinition {
  const reversed: ArrowDefinition = {
    ...definition,
    path: [...definition.path].reverse().map((point) => [...point] as GridPoint),
    exitDirection: cableEndDirection(definition, 'tail'),
  };

  // Offset the internal sockets to compensate for the plug and tail having
  // different lengths. The visible outer terminals then exchange positions
  // without either end growing beyond the cable's original footprint.
  if (definition.terminalAnchorMode === 'preserve-external-endpoints') {
    delete reversed.terminalAnchorMode;
  } else {
    reversed.terminalAnchorMode = 'preserve-external-endpoints';
  }
  return reversed;
}

function copySpatialRoute(
  identity: ArrowDefinition,
  route: ArrowDefinition,
): ArrowDefinition {
  return {
    ...identity,
    path: route.path.map((point) => [...point] as GridPoint),
    exitDirection: route.exitDirection,
    lengthClass: route.lengthClass,
    terminalAnchorMode: route.terminalAnchorMode,
  };
}

export function buildTelevisionSpatialReplacements(
  definitions: readonly ArrowDefinition[],
  targetCableIds: readonly string[],
): Map<string, ArrowDefinition> {
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  const requestedTargets = [...new Set(targetCableIds)]
    .map((id) => definitionsById.get(id))
    .filter((definition): definition is ArrowDefinition => definition !== undefined);
  if (requestedTargets.length < 2) return new Map();

  // Try every non-identity route permutation. Cyclic rotations cover the
  // common case, but a valid three-line reconstruction can require a swap of
  // only two routes; silently returning an empty map made the first cable click
  // appear to do nothing and skipped the television fault screen.
  const permutations = (values: number[]): number[][] => {
    if (values.length <= 1) return [values];
    const result: number[][] = [];
    values.forEach((value, index) => {
      const rest = [...values.slice(0, index), ...values.slice(index + 1)];
      permutations(rest).forEach((tail) => result.push([value, ...tail]));
    });
    return result;
  };
  // Prefer all requested cables, but fall back to a valid pair when a
  // particular three-way permutation cannot preserve a solvable topology.
  // The skill promises “up to three”, so a two-way reconstruction is still a
  // real effect and is preferable to showing a glitch with no state change.
  for (let subsetSize = requestedTargets.length; subsetSize >= 2; subsetSize -= 1) {
    const choose = (start: number, picked: ArrowDefinition[]): ArrowDefinition[][] => {
      if (picked.length === subsetSize) return [picked];
      const result: ArrowDefinition[][] = [];
      for (let index = start; index <= requestedTargets.length - (subsetSize - picked.length); index += 1) {
        result.push(...choose(index + 1, [...picked, requestedTargets[index]]));
      }
      return result;
    };
    for (const targets of choose(0, [])) {
      const identity = targets.map((_, index) => index);
      for (const permutation of permutations(identity)) {
        if (permutation.some((value, index) => value === index)) continue;
        const replacements = new Map<string, ArrowDefinition>();
        targets.forEach((source, index) => {
          const route = targets[permutation[index]];
          replacements.set(source.id, copySpatialRoute(source, route));
        });
        const trial = definitions.map((definition) => replacements.get(definition.id) ?? definition);
        if (skillTopologyDefinitionsAreCommitSafe(trial)) return replacements;
      }
    }
  }
  return new Map();
}

export function skillTopologyDefinitionsAreCommitSafe(
  definitions: readonly ArrowDefinition[],
): boolean {
  return geometryIsClear(definitions) && findRemovalSequence([...definitions]) !== null;
}

export function frozenStatusBlocksEveryAvailableCable(
  availableCableIds: readonly string[],
  frozenCableIds: ReadonlySet<string>,
): boolean {
  return availableCableIds.length > 0
    && availableCableIds.every((id) => frozenCableIds.has(id));
}
