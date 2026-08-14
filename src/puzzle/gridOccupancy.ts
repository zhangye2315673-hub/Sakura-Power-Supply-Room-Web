import type { ArrowDefinition, GridPoint } from './types';

const GRID_DIRECTIONS: readonly GridPoint[] = [
  [1, 0, 0], [-1, 0, 0],
  [0, 1, 0], [0, -1, 0],
  [0, 0, 1], [0, 0, -1],
];

function pointKey(point: GridPoint): string {
  return point.join('|');
}

function parsePoint(key: string): GridPoint {
  const [x, y, z] = key.split('|').map(Number);
  return [x, y, z];
}

export function expandPathGridPoints(path: readonly GridPoint[]): GridPoint[] {
  const points: GridPoint[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const direction: GridPoint = [
      Math.sign(end[0] - start[0]),
      Math.sign(end[1] - start[1]),
      Math.sign(end[2] - start[2]),
    ];
    const length =
      Math.abs(end[0] - start[0]) +
      Math.abs(end[1] - start[1]) +
      Math.abs(end[2] - start[2]);
    for (let step = 0; step <= length; step += 1) {
      if (index > 0 && step === 0) continue;
      points.push([
        start[0] + direction[0] * step,
        start[1] + direction[1] * step,
        start[2] + direction[2] * step,
      ]);
    }
  }
  return points;
}

export type CompactnessMetrics = {
  occupiedNodes: number;
  neighborRatio: number;
  connectedRatio: number;
  density: number;
  spans: readonly [number, number, number];
  isolatedArrowIds: string[];
};

export function measurePuzzleCompactness(
  definitions: readonly ArrowDefinition[],
): CompactnessMetrics {
  if (definitions.length === 0) {
    return {
      occupiedNodes: 0,
      neighborRatio: 0,
      connectedRatio: 0,
      density: 0,
      spans: [0, 0, 0],
      isolatedArrowIds: [],
    };
  }

  const arrowKeys = definitions.map((definition) =>
    new Set(expandPathGridPoints(definition.path).map(pointKey)),
  );
  const allKeys = new Set(arrowKeys.flatMap((keys) => [...keys]));
  let neighboringNodes = 0;
  let measuredNodes = 0;
  const isolatedArrowIds: string[] = [];

  arrowKeys.forEach((keys, arrowIndex) => {
    const otherKeys = new Set(
      arrowKeys.flatMap((candidate, candidateIndex) =>
        candidateIndex === arrowIndex ? [] : [...candidate],
      ),
    );
    let arrowHasNeighbor = false;
    for (const key of keys) {
      const point = parsePoint(key);
      const hasNeighbor = GRID_DIRECTIONS.some((direction) =>
        otherKeys.has(pointKey([
          point[0] + direction[0],
          point[1] + direction[1],
          point[2] + direction[2],
        ])),
      );
      if (hasNeighbor) {
        neighboringNodes += 1;
        arrowHasNeighbor = true;
      }
      measuredNodes += 1;
    }
    if (!arrowHasNeighbor) isolatedArrowIds.push(definitions[arrowIndex].id);
  });

  const points = [...allKeys].map(parsePoint);
  const minimums = [0, 1, 2].map((axis) => Math.min(...points.map((point) => point[axis])));
  const maximums = [0, 1, 2].map((axis) => Math.max(...points.map((point) => point[axis])));
  const spans: [number, number, number] = [
    maximums[0] - minimums[0],
    maximums[1] - minimums[1],
    maximums[2] - minimums[2],
  ];
  const boundingNodeVolume = (spans[0] + 1) * (spans[1] + 1) * (spans[2] + 1);

  let largestComponent = 0;
  const unseen = new Set(allKeys);
  while (unseen.size > 0) {
    const first = unseen.values().next().value as string;
    const queue = [first];
    unseen.delete(first);
    let componentSize = 0;
    while (queue.length > 0) {
      const key = queue.pop() as string;
      componentSize += 1;
      const point = parsePoint(key);
      for (const direction of GRID_DIRECTIONS) {
        const neighbor = pointKey([
          point[0] + direction[0],
          point[1] + direction[1],
          point[2] + direction[2],
        ]);
        if (!unseen.delete(neighbor)) continue;
        queue.push(neighbor);
      }
    }
    largestComponent = Math.max(largestComponent, componentSize);
  }

  return {
    occupiedNodes: allKeys.size,
    neighborRatio: neighboringNodes / Math.max(1, measuredNodes),
    connectedRatio: largestComponent / Math.max(1, allKeys.size),
    density: allKeys.size / Math.max(1, boundingNodeVolume),
    spans,
    isolatedArrowIds,
  };
}
