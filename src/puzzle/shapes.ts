import { GRID_HALF, GRID_SIZE, type GridExtents, type GridPoint, type ShapeId } from './types';

export type ShapeBoundary = {
  head: GridPoint;
  exit: GridPoint;
};

const CENTER = GRID_HALF;

function distance(point: GridPoint): [number, number, number] {
  return [
    Math.abs(point[0] - CENTER),
    Math.abs(point[1] - CENTER),
    Math.abs(point[2] - CENTER),
  ];
}

export function pointInsideShape(
  shape: ShapeId,
  point: GridPoint,
  halfExtents: GridExtents = [GRID_HALF, GRID_HALF, GRID_HALF],
): boolean {
  const [x, y, z] = distance(point);
  const [halfX, halfY, halfZ] = halfExtents;
  if (x > halfX || y > halfY || z > halfZ) return false;
  const nx = halfX > 0 ? x / halfX : 0;
  const ny = halfY > 0 ? y / halfY : 0;
  const nz = halfZ > 0 ? z / halfZ : 0;
  switch (shape) {
    case 'cube':
      return true;
    case 'cuboid':
      return true;
    case 'octahedron':
      return nx + ny + nz <= (Math.max(...halfExtents) >= 5 ? 2.08 : 1.5);
    case 'pyramid': {
      const vertical = halfY > 0 ? (point[1] - (CENTER - halfY)) / (halfY * 2) : 1;
      // Keep the stepped crown readable without collapsing the upper half into
      // a single sparse lane. The silhouette is a loose occupancy boundary,
      // not a surface that cables must trace.
      const largeRandomShape = Math.max(...halfExtents) >= 5;
      const radius = largeRandomShape
        ? Math.max(0.66, 1 - vertical * 0.34)
        : Math.max(0.42, 1 - vertical * 0.58);
      return nx <= radius && nz <= radius;
    }
    case 'cylinder':
      return nx * nx + nz * nz <= 1.05;
    case 'sphere':
      // Large random challenges use a fuller stepped sphere so 40+ long,
      // three-axis cables can remain dense without collapsing into a sparse
      // shell. Tutorial spheres keep the tighter silhouette.
      return nx * nx + ny * ny + nz * nz <= (Math.max(...halfExtents) >= 5 ? 1.42 : 1.08);
    case 'torus': {
      const radial = Math.sqrt(nx * nx + nz * nz);
      return (radial - 0.55) ** 2 + (ny * 0.82) ** 2 <= 0.5 ** 2;
    }
    case 'arch': {
      const localY = point[1] - CENTER;
      const inPillar = nx >= 0.54 && localY <= halfY * 0.45;
      const inBridge = localY >= halfY * 0.35;
      return (inPillar || inBridge) && nz <= 1;
    }
  }
}

function add(point: GridPoint, delta: GridPoint): GridPoint {
  return [point[0] + delta[0], point[1] + delta[1], point[2] + delta[2]];
}

export function shapeBoundaries(
  shape: ShapeId,
  halfExtents: GridExtents = [GRID_HALF, GRID_HALF, GRID_HALF],
): ShapeBoundary[] {
  const directions: GridPoint[] = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0],
    [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ];
  const boundaries: ShapeBoundary[] = [];
  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let z = 0; z < GRID_SIZE; z += 1) {
        const head: GridPoint = [x, y, z];
        if (!pointInsideShape(shape, head, halfExtents)) continue;
        for (const exit of directions) {
          const outside = add(head, exit);
          const insideBounds = outside.every((value) => value >= 0 && value < GRID_SIZE);
          if (!insideBounds || !pointInsideShape(shape, outside, halfExtents)) {
            boundaries.push({ head, exit: outside });
          }
        }
      }
    }
  }
  return boundaries;
}

export function shapeDisplayName(shape: ShapeId): string {
  return {
    cube: '正方体',
    cuboid: '长方体',
    octahedron: '八面体',
    pyramid: '四棱锥',
    cylinder: '圆柱体',
    sphere: '球体',
    torus: '圆环体',
    arch: '拱门体',
  }[shape];
}
