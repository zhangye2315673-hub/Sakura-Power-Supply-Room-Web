import type { ArrowDefinition } from './types';

export type RandomPuzzleTemplate = {
  arrows: ArrowDefinition[];
  solution: string[];
  initiallyFree: number;
};

export type RandomPuzzleTemplatePool = readonly RandomPuzzleTemplate[];
