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
import { resolveBlenderColorCycle } from '../src/skill/SkillPresentationController';

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
  engine.commitManualRemoval(cableId, remaining.length > 0);
  return engine.resolveConnected(context(engine, remaining), isLastCable);
}

test('技能注册表覆盖 29 台家电，扭蛋收益池保留智能垃圾桶', () => {
  const engine = new SkillChallengeEngine(20260812);
  expect(APPLIANCE_SKILL_REGISTRY.size).toBe(29);
  expect(APPLIANCE_SKILL_REGISTRY.get('microwave')?.description).toBe(
    '随机高亮一根当前可拔的线；必须在接下来两次成功拔线内拔出它，否则失去一格生命。',
  );
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
  expect(APPLIANCE_SKILL_REGISTRY.get('coffee-maker')?.polarity).toBe('negative');
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
  expect(engine.state.debuff?.id).toBe('coffee-lock');
  expect(engine.state.debuff?.turnsRemaining).toBe(0);
  engine.clearExhaustedCoffeeLock();
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

test('厨师机线先推进旧状态一回合再统一设为两回合', () => {
  const engine = new SkillChallengeEngine(20260826);
  engine.primeForSkillTest([{
    type: 'set-status',
    slot: 'debuff',
    status: {
      id: 'rice-thick-cable',
      sourceAppliance: 'rice-cooker',
      iconId: 'debuff-rice-thick-cable',
      turnsRemaining: 5,
      targetCableIds: ['stand-mixer', 'remaining'],
      payload: {},
      createdBySkillEventIndex: 0,
    },
  }]);

  expect(engine.beginManualPull('stand-mixer', 'stand-mixer')).toBe(true);
  engine.commitManualRemoval('stand-mixer', true);
  expect(engine.state.debuff?.turnsRemaining).toBe(4);
  const result = engine.resolveConnected(context(engine, ['remaining']), false);
  expect(result.resolution?.skillId).toBe('normalize-statuses');
  expect(engine.state.debuff?.turnsRemaining).toBe(2);
  expect(engine.state.buff).toBeNull();
});

test('打印机只消费事务开始前已有的复印机会', () => {
  const engine = new SkillChallengeEngine(33);
  const created = pull(engine, 'printer', 'printer', ['a', 'b']);
  expect(created.consumePrinterCopy).toBe(false);
  expect(engine.state.printerCopyReady).toBe(true);
  engine.settle();

  expect(engine.beginManualPull('a', 'printer')).toBe(true);
  expect(engine.commitManualRemoval('a', true)).toBe(true);
  expect(engine.state.printerCopyReady).toBe(false);
  const consumed = engine.resolveConnected(context(engine, ['b']), false);
  expect(consumed.consumePrinterCopy).toBe(true);
  expect(consumed.resolution).toBeNull();
  expect(engine.state.printerCopyReady).toBe(false);
});

test('便携音箱只生成三回合视觉扩距 BUFF，不修改拓扑或可抽规则', () => {
  const engine = new SkillChallengeEngine(20260827);
  const triggered = pull(engine, 'speaker', 'portable-speaker', ['a', 'b', 'c', 'd']);

  expect(triggered.resolution?.skillId).toBe('bass-spacing');
  expect(triggered.resolution?.topologyChanged).toBe(false);
  expect(triggered.resolution?.targetCableIds).toEqual([]);
  expect(triggered.resolution?.commands.some((command) => command.type === 'expand')).toBe(false);
  expect(engine.state.buff?.id).toBe('bass-spacing');
  expect(engine.state.buff?.turnsRemaining).toBe(3);

  engine.settle();
  pull(engine, 'a', 'lamp', ['b', 'c', 'd']);
  expect(engine.state.buff?.turnsRemaining).toBe(2);
  engine.settle();
  pull(engine, 'b', 'lamp', ['c', 'd']);
  expect(engine.state.buff?.turnsRemaining).toBe(1);
  engine.settle();
  pull(engine, 'c', 'lamp', ['d']);
  expect(engine.state.buff).toBeNull();
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

test('搅拌机在 40 根多色线中保持颜色总量并覆盖全部剩余线', () => {
  const engine = new SkillChallengeEngine(20260827);
  const palette = [0xff6688, 0x56a8ff, 0xffc14d, 0x45c9b0] as const;
  const remainingCables = Array.from({ length: 40 }, (_, index) => ({
    id: `blender-${index + 1}`,
    color: palette[index % palette.length],
    available: true,
    fakePlug: false,
  }));
  const definition = APPLIANCE_SKILL_REGISTRY.get('blender')!;
  const result = definition.resolve({
    remainingCables,
    availableCableIds: remainingCables.map(({ id }) => id),
    removalSequence: remainingCables.map(({ id }) => id),
    routeColors: [...palette],
    state: engine.state,
  }, new DeterministicRng(20260827));
  const recolor = result.commands.find((command) => command.type === 'recolor');
  expect(recolor?.type).toBe('recolor');
  if (!recolor || recolor.type !== 'recolor') throw new Error('搅拌机没有生成换色命令');

  const countColors = (colors: readonly number[]): Record<string, number> => colors.reduce(
    (counts, color) => ({ ...counts, [color]: (counts[color] ?? 0) + 1 }),
    {} as Record<string, number>,
  );
  expect(recolor.changes).toHaveLength(40);
  expect(new Set(recolor.changes.map(({ cableId }) => cableId))).toEqual(
    new Set(remainingCables.map(({ id }) => id)),
  );
  expect(countColors(recolor.changes.map(({ color }) => color))).toEqual(
    countColors(remainingCables.map(({ color }) => color)),
  );
  expect(recolor.changes.filter(({ cableId, color }) => (
    remainingCables.find(({ id }) => id === cableId)?.color !== color
  )).length).toBeGreaterThanOrEqual(2);

  const slowCycle = resolveBlenderColorCycle(0.2);
  const fastCycle = resolveBlenderColorCycle(0.8);
  expect(fastCycle.position).toBeGreaterThan(slowCycle.position);
  expect(fastCycle.speed).toBeGreaterThan(slowCycle.speed * 3);
  expect(resolveBlenderColorCycle(1).position).toBe(22);
});

test('手机假插头扣血，并在三个目标线移除后自动解除', () => {
  const engine = new SkillChallengeEngine(20260824);
  pull(engine, 'phone', 'phone', ['a', 'b', 'c', 'control']);
  expect(engine.state.debuff?.id).toBe('fake-double-plug');
  expect(engine.state.debuff?.targetCableIds).toHaveLength(3);
  expect(engine.handleBlockedAttempt(true)).toMatchObject({ protected: false, lives: 2, failed: false });
  engine.settle();

  const targets = [...(engine.state.debuff?.targetCableIds ?? [])];
  const control = ['a', 'b', 'c', 'control'].find((id) => !targets.includes(id));
  expect(control).toBeTruthy();
  engine.notifyAutoRemoved(control!);
  expect(engine.state.debuff?.targetCableIds).toEqual(targets);
  for (const [index, cableId] of targets.entries()) {
    engine.notifyAutoRemoved(cableId);
    expect(engine.state.debuff?.targetCableIds.length ?? 0).toBe(Math.max(0, 2 - index));
  }
  expect(engine.state.debuff).toBeNull();
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
