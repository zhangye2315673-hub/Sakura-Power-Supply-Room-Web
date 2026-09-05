import type { CableEnd } from '../puzzle/types';

export type CablePickRef = Readonly<{
  id: string;
  end: CableEnd;
}>;

const keyOf = ({ id, end }: CablePickRef): string => `${id}:${end}`;

/**
 * Prefer a physically available plug when multiple plug meshes overlap in
 * screen space. If none of the hits is currently removable, keep the nearest
 * hit so blocked and fake-plug mistakes still receive normal feedback.
 */
export function preferAvailableCablePick(
  hits: readonly CablePickRef[],
  available: readonly CablePickRef[],
): CablePickRef | null {
  if (hits.length === 0) return null;
  const availableKeys = new Set(available.map(keyOf));
  return hits.find((hit) => availableKeys.has(keyOf(hit))) ?? hits[0];
}
