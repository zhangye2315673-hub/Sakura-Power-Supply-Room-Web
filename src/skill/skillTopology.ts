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

export function skillTopologyDefinitionsAreCommitSafe(
  definitions: readonly ArrowDefinition[],
): boolean {
  return geometryIsClear(definitions) && findRemovalSequence([...definitions]) !== null;
}
