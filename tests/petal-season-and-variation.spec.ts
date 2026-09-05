import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { PetalField } from '../src/systems/PetalField';
import type { SeasonMode } from '../src/theme/SeasonProfiles';

const weights = (season: SeasonMode): Record<SeasonMode, number> => ({
  spring: season === 'spring' ? 1 : 0,
  summer: season === 'summer' ? 1 : 0,
  autumn: season === 'autumn' ? 1 : 0,
  winter: season === 'winter' ? 1 : 0,
});

type AmbientParticleProbe = Readonly<{
  active: boolean;
  season: SeasonMode;
  position: THREE.Vector3;
}>;

function activeParticles(field: PetalField): AmbientParticleProbe[] {
  return (field as unknown as { petals: AmbientParticleProbe[] }).petals
    .filter((particle) => particle.active);
}

function averageDisplacement(season: SeasonMode, seconds = 0.5): Readonly<{ x: number; y: number }> {
  const field = new PetalField(28);
  field.setSeasonState(weights(season), 0);
  const before = activeParticles(field).map((particle) => particle.position.clone());
  field.update(seconds);
  const after = activeParticles(field);
  const displacement = after.reduce((sum, particle, index) => {
    sum.x += particle.position.x - before[index].x;
    sum.y += particle.position.y - before[index].y;
    return sum;
  }, { x: 0, y: 0 });
  field.dispose();
  return { x: displacement.x / after.length, y: displacement.y / after.length };
}

test('季节切换不会改写已经生成的花瓣季节', () => {
  const field = new PetalField(8);
  field.setSeasonState(weights('spring'), 0);
  const before = field.ambientDiagnostics;
  field.setSeasonState(weights('summer'), 0);
  const after = field.ambientDiagnostics;

  expect(before.seasonCounts.spring).toBe(8);
  expect(after.seasonCounts.spring).toBe(8);
  expect(after.seasonCounts.summer).toBe(0);
  field.dispose();
});

test('首次以非春季进入时不会残留构造阶段的春季花瓣', () => {
  const field = new PetalField(8);
  field.setSeasonState(weights('winter'), 0);
  const initial = field.ambientDiagnostics;

  expect(initial.seasonCounts.spring).toBe(0);
  expect(initial.seasonCounts.winter).toBe(8);
  field.dispose();
});

test('环境粒子只显示所属季节的单一形状，不叠加春季樱花底形', () => {
  const field = new PetalField(8);
  field.setSeasonState(weights('winter'), 0);
  // Existing particles keep their birth season; advance far enough for the
  // first cohort to leave and respawn under the new winter season.
  field.update(14);
  const winter = field.ambientDiagnostics;
  expect(winter.seasonCounts.winter).toBeGreaterThan(0);

  const springMatrix = new THREE.Matrix4();
  const winterMatrix = new THREE.Matrix4();
  field.mesh.getMatrixAt(0, springMatrix);
  field.winterMesh.getMatrixAt(0, winterMatrix);
  const winterScale = new THREE.Vector3();
  winterMatrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), winterScale);
  expect(Math.max(...springMatrix.elements.slice(0, 12).map((value) => Math.abs(value))))
    .toBeLessThan(0.01);
  expect(winterScale.length()).toBeGreaterThan(0.01);
  field.dispose();
});

test('花瓣数量和速度会在基础动画上出现短时随机变化', () => {
  const field = new PetalField(8);
  const samples = [field.ambientDiagnostics];
  for (let index = 0; index < 1_200; index += 1) {
    field.update(1 / 60);
    if (index % 60 === 0) samples.push(field.ambientDiagnostics);
  }

  expect(Math.max(...samples.map((sample) => sample.activeCount)))
    .toBeGreaterThan(Math.min(...samples.map((sample) => sample.activeCount)));
  expect(Math.max(...samples.map((sample) => sample.speedScale)))
    .toBeGreaterThan(Math.min(...samples.map((sample) => sample.speedScale)) + 0.2);
  field.dispose();
});

test('花瓣速度变化是渐进的，不会在单帧跳变', () => {
  const field = new PetalField(8);
  let previous = field.ambientDiagnostics.speedScale;
  let largestFrameDelta = 0;
  for (let index = 0; index < 1_200; index += 1) {
    field.update(1 / 60);
    const current = field.ambientDiagnostics.speedScale;
    largestFrameDelta = Math.max(largestFrameDelta, Math.abs(current - previous));
    previous = current;
  }
  expect(largestFrameDelta).toBeLessThan(0.02);
  field.dispose();
});

test('秋叶与其他季节统一从右向左飘，且下落速度不过快', () => {
  const spring = averageDisplacement('spring');
  const autumn = averageDisplacement('autumn');

  expect(spring.x).toBeLessThan(0);
  expect(autumn.x).toBeLessThan(0);
  expect(Math.abs(autumn.y)).toBeLessThanOrEqual(Math.abs(spring.y) * 1.15);
});

test('冬季雪花比春季更凌冽、更快且视觉尺寸更明显', () => {
  const spring = averageDisplacement('spring');
  const winter = averageDisplacement('winter');
  const field = new PetalField(28);
  field.setSeasonState(weights('winter'), 0);
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  let averageVisualScale = 0;
  activeParticles(field).forEach((_particle, index) => {
    field.winterMesh.getMatrixAt(index, matrix);
    matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
    averageVisualScale += (scale.x + scale.y) * 0.5;
  });
  averageVisualScale /= activeParticles(field).length;

  expect(winter.x).toBeLessThan(spring.x * 1.35);
  expect(Math.abs(winter.y)).toBeGreaterThan(Math.abs(spring.y) * 1.15);
  expect(averageVisualScale).toBeGreaterThan(0.95);
  field.dispose();
});

test('主页刷新首帧不会以中心默认灯笼强度渲染椭圆光斑', async ({ page }) => {
  await page.goto('/?theme=night');
  await page.waitForFunction(() => Boolean(window.__THREE_GAME_DIAGNOSTICS__));
  const firstFrame = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.intensity ?? 1);
  expect(firstFrame).toBeLessThan(0.1);
  await page.waitForTimeout(1_600);
  const delayed = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.theme.lantern.intensity ?? 1);
  expect(delayed).toBeLessThan(0.1);
});
