import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { generatePuzzle } from '../src/puzzle/generator';
import { getRandomLevel, getSkillChallengeLevel } from '../src/puzzle/levels';
import { SKILL_PUZZLE_TEMPLATES } from '../src/puzzle/skillTemplates.generated';
import { selectTemplateVariant } from '../src/puzzle/templatePools';
import { cableSocketPointsToWorld, DIRECTION_VECTORS } from '../src/puzzle/types';
import { createRoundedCablePath } from '../src/render/CableGeometry';
import { PlugCableModel } from '../src/render/PlugCableModel';
import type { ArrowDefinition } from '../src/puzzle/types';

function segmentLength(path: ArrowDefinition['path'], index: number): number {
  const start = path[index];
  const end = path[index + 1];
  return Math.abs(end[0] - start[0])
    + Math.abs(end[1] - start[1])
    + Math.abs(end[2] - start[2]);
}

function headDirectionMatches(definition: ArrowDefinition): boolean {
  const head = definition.path[definition.path.length - 1];
  const previous = definition.path[definition.path.length - 2];
  const outward = new THREE.Vector3(
    Math.sign(head[0] - previous[0]),
    Math.sign(head[1] - previous[1]),
    Math.sign(head[2] - previous[2]),
  );
  return outward.equals(DIRECTION_VECTORS[definition.exitDirection]);
}

test('技能模板的插头方向始终与连接处线段共线', () => {
  const level = getSkillChallengeLevel(17);
  expect(level.targetCount).toBe(46);
  const puzzle = generatePuzzle(17, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'skill',
  });

  expect(puzzle.arrows.filter((arrow) => !headDirectionMatches(arrow)).map((arrow) => arrow.id))
    .toEqual([]);
});

test('双头挑战的主插头方向也由实际连接线段决定', () => {
  const seed = Array.from({ length: 1_000 }, (_, candidate) => candidate)
    .find((candidate) => getRandomLevel(candidate).challengeKind === 'double-ended')!;
  const level = getRandomLevel(seed);
  const puzzle = generatePuzzle(seed, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'random',
  });

  expect(puzzle.arrows.filter((arrow) => !headDirectionMatches(arrow)).map((arrow) => arrow.id))
    .toEqual([]);
});

test('技能出口重排保持每条线路原有总长度', () => {
  const level = getSkillChallengeLevel(17);
  const common = {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
  } as const;
  const templateKey = `${level.shape}-${level.targetCount}`;
  const pool = SKILL_PUZZLE_TEMPLATES[templateKey];
  const baseline = selectTemplateVariant(17, pool, 0x1f123bb5).value;
  const skill = generatePuzzle(17, level.targetCount, { ...common, mode: 'skill' });
  const pathLength = (definition: ArrowDefinition) => definition.path.slice(0, -1)
    .reduce((total, _point, index) => total + segmentLength(definition.path, index), 0);
  const baselineLengths = new Map(baseline.arrows.map((arrow) => [arrow.id, pathLength(arrow)]));

  expect(skill.arrows.map((arrow) => ({
    id: arrow.id,
    before: baselineLengths.get(arrow.id),
    after: pathLength(arrow),
  })).filter(({ before, after }) => before !== after)).toEqual([]);
});

test('54 线圆柱模板的旧方向差异会转换成完整等长路径', () => {
  const level = getSkillChallengeLevel(5);
  expect(level.shape).toBe('cylinder');
  expect(level.targetCount).toBe(54);
  const puzzle = generatePuzzle(5, level.targetCount, {
    shape: level.shape,
    lengthQuota: level.lengthQuota,
    minInitiallyFree: level.minInitiallyFree,
    maxInitiallyFree: level.maxInitiallyFree,
    level,
    mode: 'skill',
  });

  expect(puzzle.arrows).toHaveLength(54);
  expect(puzzle.initiallyFree).toBeGreaterThanOrEqual(4);
  expect(puzzle.initiallyFree).toBeLessThanOrEqual(8);
  expect(puzzle.arrows.filter((arrow) => !headDirectionMatches(arrow)).map((arrow) => arrow.id))
    .toEqual([]);
});

test('视觉模型只在原路径内部保留直线段，不把双端插头向外推远', () => {
  const definition: ArrowDefinition = {
    id: 'legacy-short-endpoint-leads',
    path: [
      [5, 5, 5],
      [5, 5, 6],
      [6, 5, 6],
    ],
    exitDirection: '+X',
    color: 0xe86b82,
    lengthClass: 'short',
    doubleEnded: true,
  };
  const model = new PlugCableModel(definition);
  const sockets = cableSocketPointsToWorld(definition);
  const head = model.getHeadWorldPosition(new THREE.Vector3(), 'head');
  const tail = model.getHeadWorldPosition(new THREE.Vector3(), 'tail');
  const logicalLength = sockets.slice(1).reduce(
    (sum, point, index) => sum + point.distanceTo(sockets[index]),
    0,
  );

  expect(head.distanceTo(sockets[2])).toBeLessThan(1e-6);
  expect(tail.distanceTo(sockets[0])).toBeLessThan(1e-6);
  expect(model.pathLength).toBeCloseTo(logicalLength, 6);
  model.dispose();
});

test('插头根部的可见直线段来自原路径内部，圆角不会贴到插头接口', () => {
  const definition: ArrowDefinition = {
    id: 'internal-straight-lead',
    path: [
      [5, 5, 5],
      [5, 5, 6],
      [6, 5, 6],
    ],
    exitDirection: '+X',
    color: 0xf0a044,
    lengthClass: 'short',
    doubleEnded: true,
  };
  const sockets = cableSocketPointsToWorld(definition);
  const rounded = createRoundedCablePath(sockets);
  const corner = rounded.fillets.find(({ applied }) => applied);

  expect(corner).toBeDefined();
  expect(corner!.tangentStart.distanceTo(sockets[0])).toBeGreaterThan(0.4);
  expect(corner!.tangentEnd.distanceTo(sockets[2])).toBeGreaterThan(0.4);
});

test('抽线时插头沿端点引出方向直线移动，不会斜切过弯角', () => {
  const definition: ArrowDefinition = {
    id: 'legacy-short-endpoint-motion',
    path: [
      [5, 5, 5],
      [5, 5, 6],
      [6, 5, 6],
    ],
    exitDirection: '+X',
    color: 0x56a8ff,
    lengthClass: 'short',
    doubleEnded: true,
  };
  const model = new PlugCableModel(definition);
  const headAtRest = model.getHeadWorldPosition(new THREE.Vector3(), 'head');
  const tailAtRest = model.getHeadWorldPosition(new THREE.Vector3(), 'tail');

  model.setMotionDistance(0.24, 'head');
  const headPulled = model.getHeadWorldPosition(new THREE.Vector3(), 'head');
  expect(headPulled.clone().sub(headAtRest).dot(DIRECTION_VECTORS['+X'])).toBeCloseTo(0.24, 6);
  expect(Math.abs(headPulled.y - headAtRest.y)).toBeLessThan(1e-6);
  expect(Math.abs(headPulled.z - headAtRest.z)).toBeLessThan(1e-6);

  model.setMotionDistance(0.24, 'tail');
  const tailPulled = model.getHeadWorldPosition(new THREE.Vector3(), 'tail');
  expect(tailPulled.clone().sub(tailAtRest).dot(DIRECTION_VECTORS['-Z'])).toBeCloseTo(0.24, 6);
  expect(Math.abs(tailPulled.x - tailAtRest.x)).toBeLessThan(1e-6);
  expect(Math.abs(tailPulled.y - tailAtRest.y)).toBeLessThan(1e-6);
  model.dispose();
});

test('抽线重建必须保留插头连接点，不能从上一折点直接斜连到外移插头', () => {
  const definition: ArrowDefinition = {
    id: 'legacy-mismatched-endpoint-motion',
    path: [
      [3, 3, 3],
      [3, 3, 5],
      [5, 3, 5],
    ],
    // 历史模板和技能重构曾出现方向字段与末段不一致。即使上游数据
    // 尚未完成纠正，视觉层也不能把最后一个折点直接拉成对角线。
    exitDirection: '+Y',
    color: 0x8d74d6,
    lengthClass: 'short',
  };
  const model = new PlugCableModel(definition);
  const captured: THREE.Vector3[][] = [];
  const internal = model as unknown as {
    build: (points: readonly THREE.Vector3[], withOutline?: boolean, end?: 'head' | 'tail') => void;
  };
  const originalBuild = internal.build.bind(model);
  internal.build = (points, withOutline, end) => {
    captured.push(points.map((point) => point.clone()));
    originalBuild(points, withOutline, end);
  };

  model.setMotionDistance(0.32, 'head');
  const motionPoints = captured.at(-1)!;
  const endpoint = cableSocketPointsToWorld(definition).at(-1)!;
  const diagonalSegments = motionPoints.slice(0, -1).filter((point, index) => {
    const delta = motionPoints[index + 1].clone().sub(point);
    const changedAxes = [Math.abs(delta.x), Math.abs(delta.y), Math.abs(delta.z)]
      .filter((amount) => amount > 1e-6).length;
    return changedAxes > 1;
  });

  expect(motionPoints.some((point) => point.distanceTo(endpoint) < 1e-6)).toBe(true);
  expect(diagonalSegments).toEqual([]);
  model.dispose();
});
