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
  const targets = [...new Set(targetCableIds)]
    .map((id) => definitionsById.get(id))
    .filter((definition): definition is ArrowDefinition => definition !== undefined);
  if (targets.length < 2) return new Map();

  for (let routeOffset = 1; routeOffset < targets.length; routeOffset += 1) {
    const replacements = new Map<string, ArrowDefinition>();
    targets.forEach((identity, index) => {
      const route = targets[(index + routeOffset) % targets.length];
      replacements.set(identity.id, copySpatialRoute(identity, route));
    });
    const trial = definitions.map((definition) => replacements.get(definition.id) ?? definition);
    if (skillTopologyDefinitionsAreCommitSafe(trial)) return replacements;
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
