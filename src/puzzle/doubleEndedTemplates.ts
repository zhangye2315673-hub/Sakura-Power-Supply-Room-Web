import type { ArrowDefinition, CableEnd } from './types';

export type DoubleEndedPuzzleTemplate = Readonly<{
  arrows: ArrowDefinition[];
  solution: string[];
  solutionEnds: CableEnd[];
  initiallyFree: number;
}>;
