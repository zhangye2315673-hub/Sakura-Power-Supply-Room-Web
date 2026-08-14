import { expect, test } from '@playwright/test';
import type { ApplianceKind } from '../src/systems/ApplianceCatalog';
import { generatePuzzle } from '../src/puzzle/generator';
import { getSkillChallengeLevel } from '../src/puzzle/levels';
import {
  APPLIANCE_SKILL_REGISTRY,
  DeterministicRng,
  SkillChallengeEngine,
  buildGachaCards,
  gachaPoolIncludesSmartBin,
  type SkillContext,
} from '../src/skill/SkillChallengeEngine';

function context(engine: SkillChallengeEngine, ids: readonly string[]): SkillContext {
  return {
    remainingCables: ids.map((id, index) => ({
      id,
      color: 0xff6688 + index,
      available: true,
      fakePlug: false,
    })),
    availableCableIds: [...ids],
    removalSequence: [...ids],
    routeColors: [0xff6688, 0x56a8ff, 0xffc14d],
    state: engine.state,
  };
}

function pull(
  engine: SkillChallengeEngine,
  cableId: string,
  appliance: ApplianceKind,
  remaining: readonly string[],
  isLastCable = false,
) {
  expect(engine.beginManualPull(cableId, appliance)).toBe(true);
  engine.commitManualRemoval(cableId);
  return engine.resolveConnected(context(engine, remaining), isLastCable);
}

test('技能注册表覆盖 29 台家电，扭蛋收益池保留智能垃圾桶', () => {
  const engine = new SkillChallengeEngine(20260812);
  expect(APPLIANCE_SKILL_REGISTRY.size).toBe(29);
  const skillContext = context(engine, ['a', 'b', 'c', 'd']);
  expect(gachaPoolIncludesSmartBin(skillContext)).toBe(true);
  const cards = buildGachaCards(skillContext, new DeterministicRng(8));
  expect(cards).toHaveLength(3);
  expect(cards.filter((card) => card.tier.endsWith('benefit'))).toHaveLength(2);
  expect(cards.filter((card) => card.tier.endsWith('risk'))).toHaveLength(1);
});

test('技能挑战四档线数都保持 4-8 个初始真实出口', () => {
  for (const seed of [9, 1, 2, 5]) {
    const level = getSkillChallengeLevel(seed);
    const puzzle = generatePuzzle(seed, level.targetCount, {
      shape: level.shape,
      lengthQuota: level.lengthQuota,
      minInitiallyFree: level.minInitiallyFree,
      maxInitiallyFree: level.maxInitiallyFree,
      level,
      mode: 'skill',
    });
    expect([42, 46, 50, 54]).toContain(puzzle.arrows.length);
    expect(puzzle.arrows.length).toBe(level.targetCount);
    expect(puzzle.initiallyFree).toBeGreaterThanOrEqual(4);
    expect(puzzle.initiallyFree).toBeLessThanOrEqual(8);
  }
});

test('干燥护罩抵挡电饭煲时不返回错误的粗线表现', () => {
  const engine = new SkillChallengeEngine(76);
  pull(engine, 'shield', 'dehumidifier', ['rice', 'a', 'b']);
  expect(engine.state.buff?.id).toBe('dry-shield');
  engine.settle();

  const blocked = pull(engine, 'rice', 'rice-cooker', ['a', 'b']);
  expect(engine.state.buff).toBeNull();
  expect(engine.state.debuff).toBeNull();
  expect(blocked.resolution).toBeNull();
});

test('咖啡第 4 次正确抽线仍封锁该次家电技能', () => {
  const engine = new SkillChallengeEngine(17);
  pull(engine, 'coffee', 'coffee-maker', ['a', 'b', 'c', 'd', 'e']);
  expect(engine.state.debuff?.id).toBe('coffee-lock');
  expect(engine.state.debuff?.turnsRemaining).toBe(4);
  engine.settle();

  for (const [index, cableId] of ['a', 'b', 'c', 'd'].entries()) {
    const result = pull(engine, cableId, 'printer', ['e']);
    expect(result.coffeeBlocked).toBe(true);
    expect(result.resolution).toBeNull();
    expect(engine.state.printerCopyReady).toBe(false);
    if (index < 3) engine.settle();
  }
  expect(engine.state.debuff).toBeNull();
});

test('微波炉非目标线先结算厨师机再提交基础递减', () => {
  const engine = new SkillChallengeEngine(91);
  pull(engine, 'microwave', 'microwave', ['hot', 'safe-a', 'safe-b']);
  const hot = engine.state.debuff?.targetCableIds[0];
  expect(engine.state.debuff?.id).toBe('overheated-plug');
  expect(hot).toBeTruthy();
  engine.settle();

  const safe = ['hot', 'safe-a', 'safe-b'].find((id) => id !== hot)!;
  const result = pull(engine, safe, 'stand-mixer', ['remaining']);
  expect(result.resolution?.skillId).toBe('normalize-statuses');
  expect(engine.state.debuff?.id).toBe('overheated-plug');
  expect(engine.state.debuff?.turnsRemaining).toBe(1);
});

test('打印机只消费事务开始前已有的复印机会', () => {
  const engine = new SkillChallengeEngine(33);
  const created = pull(engine, 'printer', 'printer', ['a', 'b']);
  expect(created.consumePrinterCopy).toBe(false);
  expect(engine.state.printerCopyReady).toBe(true);
  engine.settle();

  const consumed = pull(engine, 'a', 'lamp', ['b']);
  expect(consumed.consumePrinterCopy).toBe(true);
  expect(engine.state.printerCopyReady).toBe(false);
});

test('最后一根线不提交家电技能或伤害', () => {
  const engine = new SkillChallengeEngine(49);
  const result = pull(engine, 'last', 'desktop-computer', [], true);
  expect(result.resolution).toBeNull();
  expect(engine.state.currentLives).toBe(3);
  expect(engine.state.phase).toBe('complete');
});

test('自动清线只清理附着状态，不推进咖啡回合', () => {
  const engine = new SkillChallengeEngine(72);
  pull(engine, 'coffee', 'coffee-maker', ['a', 'b', 'c']);
  expect(engine.state.debuff?.turnsRemaining).toBe(4);
  engine.settle();
  engine.notifyAutoRemoved('a');
  expect(engine.state.debuff?.turnsRemaining).toBe(4);
});

test('泡泡保护抵挡一次受阻点击且不扣生命', () => {
  const engine = new SkillChallengeEngine(84);
  pull(engine, 'bubble', 'bubble-machine', ['a', 'b']);
  expect(engine.state.buff?.id).toBe('iridescent-bubble');
  engine.settle();
  const result = engine.handleBlockedAttempt();
  expect(result.protected).toBe(true);
  expect(result.lives).toBe(3);
  expect(engine.state.buff).toBeNull();
});

test('收音机冻结三步顺序，扫地机器人冻结触发快照', () => {
  const radioEngine = new SkillChallengeEngine(73);
  const radio = pull(radioEngine, 'radio', 'radio', ['a', 'b', 'c', 'd']).resolution;
  expect(radio?.skillId).toBe('route-broadcast');
  expect(radio?.targetCableIds).toEqual(['a', 'b', 'c']);

  const vacuumEngine = new SkillChallengeEngine(74);
  const definition = APPLIANCE_SKILL_REGISTRY.get('robot-vacuum')!;
  const vacuum = definition.resolve({
    ...context(vacuumEngine, ['a', 'b', 'c', 'd']),
    availableCableIds: ['a', 'c'],
  }, new DeterministicRng(4));
  expect(vacuum.targetCableIds).toEqual(['a', 'c']);
  expect(vacuum.commands).toEqual([
    { type: 'auto-remove', cableIds: ['a', 'c'], source: 'robot-vacuum' },
  ]);
});

test('电饭煲粗线维持三个正确抽线回合，自动清线不扣回合', () => {
  const engine = new SkillChallengeEngine(75);
  pull(engine, 'rice', 'rice-cooker', ['a', 'b', 'c', 'd']);
  expect(engine.state.debuff?.id).toBe('rice-thick-cable');
  expect(engine.state.debuff?.turnsRemaining).toBe(3);
  engine.settle();
  engine.notifyAutoRemoved('d');
  expect(engine.state.debuff?.turnsRemaining).toBe(3);
  for (const [index, cableId] of ['a', 'b', 'c'].entries()) {
    pull(engine, cableId, 'radio', ['remaining']);
    expect(engine.state.debuff?.turnsRemaining ?? null).toBe(index < 2 ? 2 - index : null);
    if (index < 2) engine.settle();
  }
});
