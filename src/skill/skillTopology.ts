import { findRemovalSequence } from '../puzzle/collision';
import { geometryIsClear } from '../puzzle/geometryValidation';
import type { ArrowDefinition } from '../puzzle/types';

export function skillTopologyDefinitionsAreCommitSafe(
  definitions: readonly ArrowDefinition[],
): boolean {
  return geometryIsClear(definitions) && findRemovalSequence([...definitions]) !== null;
}
