import { expect, test } from '@playwright/test';
import { PRINTER_POWERED_ACTIVE_DURATION } from '../src/appliances/poweredAnimation';
import { preferAvailableCablePick } from '../src/game/CablePickPreference';
import {
  printerSkillLockDurationMs,
  skillPresentationStillActive,
} from '../src/skill/skillPresentationTiming';
import { SkillChallengeEngine } from '../src/skill/SkillChallengeEngine';

test('打印机技能在正式流程中锁到最后一张纸完成，固定证据帧仍可快速结算', () => {
  expect(printerSkillLockDurationMs(undefined)).toBe(PRINTER_POWERED_ACTIVE_DURATION * 1_000);
  expect(printerSkillLockDurationMs(0)).toBe(1_400);
});

test('假双头遮挡真实插头时优先选择射线后方仍可抽的真实端点', () => {
  const picked = preferAvailableCablePick([
    { id: 'pink-fake', end: 'tail' },
    { id: 'yellow-real', end: 'head' },
  ], [
    { id: 'yellow-real', end: 'head' },
  ]);
  expect(picked).toEqual({ id: 'yellow-real', end: 'head' });

  expect(preferAvailableCablePick([
    { id: 'pink-fake', end: 'tail' },
  ], [])).toEqual({ id: 'pink-fake', end: 'tail' });
});

test('通用技能时间线或临时特效正常收尾时锁定，但超过视觉保险期限后释放', () => {
  expect(skillPresentationStillActive({
    controllerActiveTimelines: 1,
    transientEffectCount: 0,
  })).toBe(true);
  expect(skillPresentationStillActive({
    controllerActiveTimelines: 0,
    transientEffectCount: 1,
  })).toBe(true);
  expect(skillPresentationStillActive({
    controllerActiveTimelines: 0,
    transientEffectCount: 0,
  })).toBe(false);
  expect(skillPresentationStillActive({
    controllerActiveTimelines: 1,
    transientEffectCount: 2,
    elapsedMs: 2_001,
    maxVisualWaitMs: 2_000,
  })).toBe(false);
});

test('一个技能抽线事务 settle 前拒绝启动第二根普通抽线', () => {
  const engine = new SkillChallengeEngine(20260906);
  expect(engine.beginManualPull('first', 'lamp')).toBe(true);
  expect(engine.state.phase).toBe('manual-exit');
  expect(engine.beginManualPull('second', 'radio')).toBe(false);
  expect(engine.state.phase).toBe('manual-exit');
});
