import { expect, test } from '@playwright/test';
import { RefrigeratorFreezePresentation } from '../src/skill/RefrigeratorFreezePresentation';

function advance(frost: RefrigeratorFreezePresentation, duration: number): void {
  let remaining = duration;
  while (remaining > 0) {
    const step = Math.min(0.05, remaining);
    frost.update(step);
    remaining -= step;
  }
}

test('refrigerator freeze color completes in 5.2 seconds, persists, then thaws after status removal', () => {
  const frost = new RefrigeratorFreezePresentation();
  frost.activate(['cable-a', 'cable-b']);

  advance(frost, 0.35);
  expect(frost.diagnostics.phase).toBe('freezing');
  expect(frost.cableProgress).toBeGreaterThan(0);
  expect(frost.cableProgress).toBeLessThan(0.05);

  advance(frost, 3.1);
  expect(frost.cableProgress).toBeCloseTo(1, 6);
  expect(frost.environmentAmount).toBeCloseTo(1, 6);

  frost.syncStatus(['cable-a', 'cable-b']);
  advance(frost, 1.75);
  expect(frost.diagnostics.phase).toBe('persistent');
  expect(frost.environmentAmount).toBeGreaterThan(0.8);
  expect(frost.cableAmount).toBe(1);
  expect(frost.hasTarget('cable-a')).toBe(true);

  advance(frost, 8);
  expect(frost.diagnostics.phase).toBe('persistent');
  expect(frost.cableAmount).toBe(1);

  frost.syncStatus([]);
  advance(frost, 0.5);
  expect(frost.diagnostics.phase).toBe('thawing');
  expect(frost.cableAmount).toBeGreaterThan(0);
  expect(frost.cableAmount).toBeLessThan(1);

  advance(frost, 0.55);
  expect(frost.diagnostics.phase).toBe('idle');
  expect(frost.environmentAmount).toBe(0);
  expect(frost.cableAmount).toBe(0);
  expect(frost.diagnostics.targetCableIds).toEqual([]);
});
