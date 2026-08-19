import type { ApplianceKind } from '../systems/ApplianceCatalog';

export type SkillChallengePhase =
  | 'idle'
  | 'manual-exit'
  | 'connecting'
  | 'skill-cue'
  | 'skill-commit'
  | 'select-card'
  | 'select-recycle-target'
  | 'pending-auto-remove'
  | 'settling'
  | 'complete'
  | 'failed';

export type SkillStatusId =
  | 'dry-shield'
  | 'iridescent-bubble'
  | 'soothing-record'
  | 'continue'
  | 'induction-reveal'
  | 'bathroom-steam'
  | 'frozen-plug'
  | 'coffee-lock'
  | 'rice-thick-cable'
  | 'overheated-plug'
  | 'fake-double-plug';

export type SkillStatusSlot = 'buff' | 'debuff';

export type StatusInstance = {
  id: SkillStatusId;
  sourceAppliance: ApplianceKind;
  iconId: `buff-${string}` | `debuff-${string}`;
  turnsRemaining: number | null;
  targetCableIds: string[];
  payload: Record<string, unknown>;
  createdBySkillEventIndex: number;
};

export type SkillChallengeState = {
  seed: number;
  skillEventIndex: number;
  phase: SkillChallengePhase;
  currentLives: number;
  maxLives: number;
  buff: StatusInstance | null;
  debuff: StatusInstance | null;
  printerCopyReady: boolean;
  lampHintCableId: string | null;
  popcornHintCableId: string | null;
  reviveUsedThisChallenge: boolean;
};

export type SkillCableSnapshot = Readonly<{
  id: string;
  color: number;
  available: boolean;
  fakePlug: boolean;
}>;

export type SkillContext = Readonly<{
  remainingCables: readonly SkillCableSnapshot[];
  availableCableIds: readonly string[];
  removalSequence: readonly string[];
  routeColors: readonly number[];
  state: Readonly<SkillChallengeState>;
}>;

export type GachaCardTier =
  | 'normal-benefit'
  | 'strong-benefit'
  | 'normal-risk'
  | 'strong-risk';

export type GachaCard = Readonly<{
  appliance: ApplianceKind;
  skillId: string;
  label: string;
  description: string;
  tier: GachaCardTier;
}>;

export type SkillCommand =
  | Readonly<{ type: 'set-status'; slot: SkillStatusSlot; status: StatusInstance }>
  | Readonly<{ type: 'clear-status'; slot: SkillStatusSlot; reason: string }>
  | Readonly<{ type: 'set-hint'; source: 'lamp' | 'popcorn'; cableId: string }>
  | Readonly<{ type: 'auto-remove'; cableIds: string[]; source: ApplianceKind }>
  | Readonly<{ type: 'freeze'; cableIds: string[] }>
  | Readonly<{ type: 'recolor'; changes: Array<{ cableId: string; color: number }> }>
  | Readonly<{ type: 'reconstruct'; cableIds: string[] }>
  | Readonly<{ type: 'swap-ends'; cableIds: string[] }>
  | Readonly<{ type: 'expand'; cableIds: string[] }>
  | Readonly<{ type: 'fake-plugs'; cableIds: string[] }>
  | Readonly<{ type: 'heal'; amount: number }>
  | Readonly<{ type: 'increase-max-lives'; amount: number }>
  | Readonly<{ type: 'set-printer-copy' }>
  | Readonly<{ type: 'advance-timed-statuses'; amount: number }>
  | Readonly<{ type: 'normalize-timed-statuses'; turns: number }>
  | Readonly<{ type: 'damage-or-remove-buff'; amount: number; source: 'desktop-computer' }>
  | Readonly<{ type: 'grant-continue' }>
  | Readonly<{ type: 'request-card-selection'; cards: GachaCard[] }>
  | Readonly<{ type: 'request-recycle-selection' }>;

export type SkillResolution = Readonly<{
  skillId: string;
  appliance: ApplianceKind;
  label: string;
  targetCableIds: string[];
  commands: SkillCommand[];
  requiresSelection: 'card' | 'recycle-cable' | null;
  topologyChanged: boolean;
  presentation: Readonly<{
    cue: string;
    commit: string;
    settle: string;
    assetIds: string[];
  }>;
}>;

export type ApplianceSkillDefinition = Readonly<{
  id: string;
  appliance: ApplianceKind;
  label: string;
  description: string;
  polarity: 'positive' | 'negative' | 'mixed';
  slot: SkillStatusSlot | null;
  canTrigger: (context: SkillContext) => boolean;
  resolve: (context: SkillContext, rng: DeterministicRng) => SkillResolution;
  gachaTier: (context: SkillContext) => GachaCardTier | null;
}>;

type ManualTransaction = {
  cableId: string;
  appliance: ApplianceKind;
  coffeeBlocked: boolean;
  preexistingPrinterCopy: boolean;
  microwavePendingDecrement: boolean;
};

export class DeterministicRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  pick<T>(items: readonly T[]): T | null {
    if (items.length === 0) return null;
    return items[Math.floor(this.next() * items.length)] ?? null;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(this.next() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }
}

const status = (
  id: SkillStatusId,
  sourceAppliance: ApplianceKind,
  turnsRemaining: number | null,
  targetCableIds: string[],
  skillEventIndex: number,
  payload: Record<string, unknown> = {},
): StatusInstance => ({
  id,
  sourceAppliance,
  iconId: `${id === 'bathroom-steam' || id === 'frozen-plug' || id === 'coffee-lock'
    || id === 'rice-thick-cable' || id === 'overheated-plug' || id === 'fake-double-plug'
    ? 'debuff' : 'buff'}-${id}` as StatusInstance['iconId'],
  turnsRemaining,
  targetCableIds: [...targetCableIds],
  payload: { ...payload },
  createdBySkillEventIndex: skillEventIndex,
});

function resolution(
  definition: Pick<ApplianceSkillDefinition, 'id' | 'appliance' | 'label'>,
  commands: SkillCommand[],
  targetCableIds: string[] = [],
  options: Partial<Pick<SkillResolution, 'requiresSelection' | 'topologyChanged'>> = {},
): SkillResolution {
  return {
    skillId: definition.id,
    appliance: definition.appliance,
    label: definition.label,
    targetCableIds,
    commands,
    requiresSelection: options.requiresSelection ?? null,
    topologyChanged: options.topologyChanged ?? false,
    presentation: {
      cue: `${definition.id}:cue`,
      commit: `${definition.id}:commit`,
      settle: `${definition.id}:settle`,
      assetIds: [],
    },
  };
}

const available = (context: SkillContext): SkillCableSnapshot[] =>
  context.remainingCables.filter((cable) => context.availableCableIds.includes(cable.id));

const remainingIds = (context: SkillContext): string[] =>
  context.remainingCables.map((cable) => cable.id);

const timed = (instance: StatusInstance | null): boolean =>
  instance?.turnsRemaining !== null && instance !== null;

const hasDebuff = (context: SkillContext, id?: SkillStatusId): boolean =>
  id ? context.state.debuff?.id === id : context.state.debuff !== null;

const noDebuff = (context: SkillContext): boolean => !context.state.debuff;
const noBuff = (context: SkillContext): boolean => !context.state.buff;

function basicDefinition(
  appliance: ApplianceKind,
  id: string,
  label: string,
  description: string,
  polarity: ApplianceSkillDefinition['polarity'],
  slot: SkillStatusSlot | null,
  canTrigger: ApplianceSkillDefinition['canTrigger'],
  resolveSkill: ApplianceSkillDefinition['resolve'],
  tier: ApplianceSkillDefinition['gachaTier'],
): ApplianceSkillDefinition {
  return { appliance, id, label, description, polarity, slot, canTrigger, resolve: resolveSkill, gachaTier: tier };
}

const APPLIANCE_SKILL_DEFINITIONS: readonly ApplianceSkillDefinition[] = [
  basicDefinition('lamp', 'lamp-hint', '照明提示', '持续标记一根真实可抽线。', 'positive', null,
    (ctx) => available(ctx).length > 0,
    (ctx, rng) => {
      const target = rng.pick(available(ctx))!;
      return resolution({ id: 'lamp-hint', appliance: 'lamp', label: '照明提示' }, [
        { type: 'set-hint', source: 'lamp', cableId: target.id },
      ], [target.id]);
    }, () => 'normal-benefit'),
  basicDefinition('humidifier', 'bathroom-steam', '浴室蒸汽', '三次正确抽线后擦除的蒸汽遮罩。', 'negative', 'debuff',
    noDebuff,
    (ctx) => resolution({ id: 'bathroom-steam', appliance: 'humidifier', label: '浴室蒸汽' }, [{
      type: 'set-status', slot: 'debuff', status: status('bathroom-steam', 'humidifier', 3, [], ctx.state.skillEventIndex),
    }]),
    (ctx) => noDebuff(ctx) ? 'normal-risk' : null),
  basicDefinition('fan', 'clear-steam', '吹散蒸汽', '提前清除浴室蒸汽。', 'positive', null,
    (ctx) => hasDebuff(ctx, 'bathroom-steam'),
    () => resolution({ id: 'clear-steam', appliance: 'fan', label: '吹散蒸汽' }, [
      { type: 'clear-status', slot: 'debuff', reason: 'fan' },
    ]),
    (ctx) => hasDebuff(ctx, 'bathroom-steam') ? 'normal-benefit' : null),
  basicDefinition('dehumidifier', 'dehumidify', '净化与干燥护罩', '清除负面状态；无负面状态时生成护罩。', 'positive', 'buff',
    () => true,
    (ctx) => hasDebuff(ctx)
      ? resolution({ id: 'dehumidify', appliance: 'dehumidifier', label: '净化与干燥护罩' }, [
          { type: 'clear-status', slot: 'debuff', reason: 'dehumidifier' },
        ])
      : resolution({ id: 'dehumidify', appliance: 'dehumidifier', label: '净化与干燥护罩' }, [{
          type: 'set-status', slot: 'buff', status: status('dry-shield', 'dehumidifier', 3, [], ctx.state.skillEventIndex),
        }]),
    (ctx) => hasDebuff(ctx) || noBuff(ctx) ? 'normal-benefit' : null),
  basicDefinition('refrigerator', 'freeze-plugs', '急冻封头', '冻结约一半当前出口三回合。', 'negative', 'debuff',
    (ctx) => noDebuff(ctx) && available(ctx).length > 1,
    (ctx, rng) => {
      const candidates = rng.shuffle(available(ctx));
      const count = Math.min(candidates.length - 1, Math.ceil(candidates.length / 2));
      const targets = candidates.slice(0, count).map((cable) => cable.id);
      return resolution({ id: 'freeze-plugs', appliance: 'refrigerator', label: '急冻封头' }, [
        { type: 'freeze', cableIds: targets },
        { type: 'set-status', slot: 'debuff', status: status('frozen-plug', 'refrigerator', 3, targets, ctx.state.skillEventIndex) },
      ], targets);
    }, (ctx) => noDebuff(ctx) && available(ctx).length > 1 ? 'strong-risk' : null),
  basicDefinition('hair-dryer', 'hair-dryer-branch', '解冻或热风改色', '优先解冻，否则把一根线改为有效橙红路由。', 'mixed', null,
    (ctx) => hasDebuff(ctx, 'frozen-plug') || (ctx.routeColors.length > 0 && ctx.remainingCables.length > 0),
    (ctx, rng) => {
      if (hasDebuff(ctx, 'frozen-plug')) {
        return resolution({ id: 'hair-dryer-branch', appliance: 'hair-dryer', label: '解冻或热风改色' }, [
          { type: 'clear-status', slot: 'debuff', reason: 'hair-dryer' },
        ]);
      }
      const routeColors = ctx.routeColors.slice(0, 2);
      const candidates = ctx.remainingCables.filter((cable) => !routeColors.includes(cable.color));
      const target = rng.pick(candidates);
      const color = rng.pick(routeColors);
      return target && color !== null
        ? resolution({ id: 'hair-dryer-branch', appliance: 'hair-dryer', label: '解冻或热风改色' }, [
            { type: 'recolor', changes: [{ cableId: target.id, color }] },
          ], [target.id])
        : resolution({ id: 'hair-dryer-branch', appliance: 'hair-dryer', label: '解冻或热风改色' }, []);
    }, (ctx) => hasDebuff(ctx, 'frozen-plug') ? 'normal-benefit' : ctx.routeColors.length > 0 ? 'normal-risk' : null),
  basicDefinition('washer', 'spin-remove', '脱水甩线', '从全部剩余线中甩出最多两根。', 'positive', null,
    (ctx) => ctx.remainingCables.length > 0,
    (ctx, rng) => {
      const targets = rng.shuffle(remainingIds(ctx)).slice(0, 2);
      return resolution({ id: 'spin-remove', appliance: 'washer', label: '脱水甩线' }, [
        { type: 'auto-remove', cableIds: targets, source: 'washer' },
      ], targets, { topologyChanged: true });
    }, (ctx) => ctx.remainingCables.length > 0 ? 'strong-benefit' : null),
  basicDefinition('bubble-machine', 'bubble-shield', '虹膜泡泡', '五回合内抵挡一次受阻点击。', 'positive', 'buff',
    () => true,
    (ctx) => resolution({ id: 'bubble-shield', appliance: 'bubble-machine', label: '虹膜泡泡' }, [{
      type: 'set-status', slot: 'buff', status: status('iridescent-bubble', 'bubble-machine', 5, [], ctx.state.skillEventIndex),
    }]),
    (ctx) => noBuff(ctx) ? 'strong-benefit' : null),
  basicDefinition('television', 'glitch-reconstruct', '故障重构', '重构最多三根线的空间路径。', 'mixed', null,
    (ctx) => ctx.remainingCables.length > 1,
    (ctx, rng) => {
      const targets = rng.shuffle(remainingIds(ctx)).slice(0, 3);
      return resolution({ id: 'glitch-reconstruct', appliance: 'television', label: '故障重构' }, [
        { type: 'reconstruct', cableIds: targets },
      ], targets, { topologyChanged: true });
    }, (ctx) => ctx.remainingCables.length > 1 ? 'normal-risk' : null),
  basicDefinition('radio', 'route-broadcast', '三步路线广播', '持续标记接下来三根可抽线路，当前目标会脉冲提示。', 'positive', null,
    (ctx) => ctx.removalSequence.length > 0,
    (ctx) => {
      const targets = ctx.removalSequence.slice(0, 3);
      return resolution({ id: 'route-broadcast', appliance: 'radio', label: '三步路线广播' }, [], targets);
    }, (ctx) => ctx.removalSequence.length > 0 ? 'normal-benefit' : null),
  basicDefinition('toaster', 'swap-ends', '双面翻烤', '交换最多两根线的插头端与尾端。', 'mixed', null,
    (ctx) => ctx.remainingCables.some((cable) => !cable.fakePlug),
    (ctx, rng) => {
      const targets = rng.shuffle(ctx.remainingCables.filter((cable) => !cable.fakePlug).map((cable) => cable.id)).slice(0, 2);
      return resolution({ id: 'swap-ends', appliance: 'toaster', label: '双面翻烤' }, [
        { type: 'swap-ends', cableIds: targets },
      ], targets, { topologyChanged: true });
    }, (ctx) => ctx.remainingCables.some((cable) => !cable.fakePlug) ? 'normal-risk' : null),
  basicDefinition('kettle', 'steam-thaw', '高温蒸汽解冻', '立即融化全部急冻冰壳。', 'positive', null,
    (ctx) => hasDebuff(ctx, 'frozen-plug'),
    () => resolution({ id: 'steam-thaw', appliance: 'kettle', label: '高温蒸汽解冻' }, [
      { type: 'clear-status', slot: 'debuff', reason: 'kettle' },
    ]),
    (ctx) => hasDebuff(ctx, 'frozen-plug') ? 'normal-benefit' : null),
  basicDefinition('coffee-maker', 'coffee-lock', '咖啡封技', '遮蔽线色并封锁后续四次家电技能。', 'negative', 'debuff',
    (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0,
    (ctx) => resolution({ id: 'coffee-lock', appliance: 'coffee-maker', label: '咖啡封技' }, [{
      type: 'set-status', slot: 'debuff', status: status('coffee-lock', 'coffee-maker', 4, [], ctx.state.skillEventIndex),
    }]),
    (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0 ? 'strong-risk' : null),
  basicDefinition('robot-vacuum', 'snapshot-sweep', '快照清线', '清除触发瞬间全部真实可抽线。', 'positive', null,
    (ctx) => available(ctx).length > 0,
    (ctx) => {
      const targets = [...ctx.availableCableIds];
      return resolution({ id: 'snapshot-sweep', appliance: 'robot-vacuum', label: '快照清线' }, [
        { type: 'auto-remove', cableIds: targets, source: 'robot-vacuum' },
      ], targets, { topologyChanged: true });
    }, (ctx) => available(ctx).length > 0 ? 'strong-benefit' : null),
  basicDefinition('rice-cooker', 'rice-thick-cable', '米饭膨胀粗线', '三回合视觉粗线，不改变真实碰撞。', 'negative', 'debuff',
    (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0,
    (ctx) => resolution({ id: 'rice-thick-cable', appliance: 'rice-cooker', label: '米饭膨胀粗线' }, [{
      type: 'set-status', slot: 'debuff', status: status('rice-thick-cable', 'rice-cooker', 3, [], ctx.state.skillEventIndex),
    }]),
    (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0 ? 'normal-risk' : null),
  basicDefinition('blender', 'color-shuffle', '全线色彩搅拌', '保持颜色总量不变地重新分配全部线色。', 'mixed', null,
    (ctx) => new Set(ctx.remainingCables.map((cable) => cable.color)).size > 1,
    (ctx, rng) => {
      const colors = ctx.remainingCables.map((cable) => cable.color);
      let shuffled = rng.shuffle(colors);
      if (shuffled.every((color, index) => color === colors[index])) shuffled = [...colors.slice(1), colors[0]];
      const changes = ctx.remainingCables.map((cable, index) => ({ cableId: cable.id, color: shuffled[index] }));
      return resolution({ id: 'color-shuffle', appliance: 'blender', label: '全线色彩搅拌' }, [
        { type: 'recolor', changes },
      ], changes.filter((change, index) => change.color !== colors[index]).map((change) => change.cableId));
    }, (ctx) => new Set(ctx.remainingCables.map((cable) => cable.color)).size > 1 ? 'normal-risk' : null),
  basicDefinition('printer', 'printer-copy', '抽线动作复印', '下一次正确抽线后自动抽出第二根。', 'positive', null,
    (ctx) => !ctx.state.printerCopyReady && ctx.remainingCables.length > 0,
    () => resolution({ id: 'printer-copy', appliance: 'printer', label: '抽线动作复印' }, [
      { type: 'set-printer-copy' },
    ]),
    (ctx) => !ctx.state.printerCopyReady && ctx.remainingCables.length > 0 ? 'strong-benefit' : null),
  basicDefinition('gumball-machine', 'sakura-gacha', '樱花三选一', '两张收益卡与一张风险卡的单次选择。', 'mixed', null,
    (ctx) => buildGachaCandidates(ctx).benefits.length >= 2 && buildGachaCandidates(ctx).risks.length >= 1,
    (ctx, rng) => {
      const cards = buildGachaCards(ctx, rng);
      return resolution({ id: 'sakura-gacha', appliance: 'gumball-machine', label: '樱花三选一' }, [
        { type: 'request-card-selection', cards },
      ], [], { requiresSelection: 'card' });
    }, () => null),
  basicDefinition('record-player', 'soothing-record', '安心旋律', '恢复一格生命并抵挡一次受阻点击。', 'positive', 'buff',
    () => true,
    (ctx) => resolution({ id: 'soothing-record', appliance: 'record-player', label: '安心旋律' }, [
      { type: 'heal', amount: 1 },
      { type: 'set-status', slot: 'buff', status: status('soothing-record', 'record-player', null, [], ctx.state.skillEventIndex) },
    ]),
    (ctx) => noBuff(ctx) ? 'strong-benefit' : null),
  basicDefinition('alarm-clock', 'time-fast-forward', '时间快进', '所有限回合状态额外推进一回合。', 'mixed', null,
    (ctx) => timed(ctx.state.buff) || timed(ctx.state.debuff),
    () => resolution({ id: 'time-fast-forward', appliance: 'alarm-clock', label: '时间快进' }, [
      { type: 'advance-timed-statuses', amount: 1 },
    ]),
    (ctx) => timed(ctx.state.debuff) && !timed(ctx.state.buff)
      ? 'normal-benefit'
      : timed(ctx.state.buff) || timed(ctx.state.debuff) ? 'normal-risk' : null),
  basicDefinition('popcorn-machine', 'popcorn-meal', '爆米花加餐与出口提示', '增加生命上限并标记一个出口。', 'positive', null,
    (ctx) => ctx.remainingCables.length > 0,
    (ctx, rng) => {
      const target = rng.pick(available(ctx));
      const commands: SkillCommand[] = [{ type: 'increase-max-lives', amount: 1 }];
      if (target) commands.push({ type: 'set-hint', source: 'popcorn', cableId: target.id });
      return resolution({ id: 'popcorn-meal', appliance: 'popcorn-machine', label: '爆米花加餐与出口提示' }, commands, target ? [target.id] : []);
    }, (ctx) => ctx.remainingCables.length > 0 ? 'strong-benefit' : null),
  basicDefinition('stand-mixer', 'normalize-statuses', '搅拌均匀', '把仍存在的限回合状态统一设为两回合。', 'mixed', null,
    (ctx) => timed(ctx.state.buff) || timed(ctx.state.debuff),
    () => resolution({ id: 'normalize-statuses', appliance: 'stand-mixer', label: '搅拌均匀' }, [
      { type: 'normalize-timed-statuses', turns: 2 },
    ]),
    (ctx) => {
      const buff = ctx.state.buff?.turnsRemaining;
      const debuff = ctx.state.debuff?.turnsRemaining;
      if (buff === null && debuff === null) return null;
      const positive = typeof debuff === 'number' && debuff > 2 && !(typeof buff === 'number' && buff > 2);
      return positive ? 'normal-benefit' : 'normal-risk';
    }),
  basicDefinition('game-controller', 'continue-game', '继续游戏', '获得一次复活，重复触发升级恢复量。', 'positive', 'buff',
    () => true,
    () => resolution({ id: 'continue-game', appliance: 'game-controller', label: '继续游戏' }, [
      { type: 'grant-continue' },
    ]),
    (ctx) => noBuff(ctx) || ctx.state.buff?.id === 'continue' || ctx.state.reviveUsedThisChallenge ? 'strong-benefit' : null),
  basicDefinition('microwave', 'timed-meal', '限时取餐', '标记一根真实出口并给出两次处理机会。', 'negative', 'debuff',
    (ctx) => noDebuff(ctx) && available(ctx).length > 0,
    (ctx, rng) => {
      const target = rng.pick(available(ctx))!;
      return resolution({ id: 'timed-meal', appliance: 'microwave', label: '限时取餐' }, [{
        type: 'set-status', slot: 'debuff', status: status('overheated-plug', 'microwave', 2, [target.id], ctx.state.skillEventIndex),
      }], [target.id]);
    }, (ctx) => noDebuff(ctx) && available(ctx).length > 0 ? 'strong-risk' : null),
  basicDefinition('desktop-computer', 'blue-screen', '蓝屏崩溃', '删除当前 BUFF；没有 BUFF 时扣除一格生命。', 'negative', null,
    () => true,
    () => resolution({ id: 'blue-screen', appliance: 'desktop-computer', label: '蓝屏崩溃' }, [
      { type: 'damage-or-remove-buff', amount: 1, source: 'desktop-computer' },
    ]),
    () => 'strong-risk'),
  basicDefinition('induction-cooktop', 'induction-reveal', '感应显线', '三回合持续标记全部真实出口。', 'positive', 'buff',
    (ctx) => ctx.remainingCables.length > 0,
    (ctx) => resolution({ id: 'induction-reveal', appliance: 'induction-cooktop', label: '感应显线' }, [{
      type: 'set-status', slot: 'buff', status: status('induction-reveal', 'induction-cooktop', 3, [], ctx.state.skillEventIndex),
    }]),
    (ctx) => noBuff(ctx) && ctx.remainingCables.length > 0 ? 'normal-benefit' : null),
  basicDefinition('portable-speaker', 'bass-expand', '低音扩圈', '把最多三根空间受阻线移动到可抽外圈。', 'positive', null,
    (ctx) => ctx.remainingCables.some((cable) => !cable.available),
    (ctx, rng) => {
      const targets = rng.shuffle(ctx.remainingCables.filter((cable) => !cable.available).map((cable) => cable.id)).slice(0, 3);
      return resolution({ id: 'bass-expand', appliance: 'portable-speaker', label: '低音扩圈' }, [
        { type: 'expand', cableIds: targets },
      ], targets, { topologyChanged: true });
    }, (ctx) => ctx.remainingCables.some((cable) => !cable.available) ? 'strong-benefit' : null),
  basicDefinition('smart-bin', 'recycle-cable', '指定回收', '直接选择并回收任意一根剩余线。', 'positive', null,
    (ctx) => ctx.remainingCables.length > 0,
    () => resolution({ id: 'recycle-cable', appliance: 'smart-bin', label: '指定回收' }, [
      { type: 'request-recycle-selection' },
    ], [], { requiresSelection: 'recycle-cable' }),
    (ctx) => ctx.remainingCables.length > 0 ? 'strong-benefit' : null),
  basicDefinition('phone', 'fake-double-plug', '双头伪装', '最多三根线的普通尾端生成永久假插头。', 'negative', 'debuff',
    (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0,
    (ctx, rng) => {
      const targets = rng.shuffle(remainingIds(ctx)).slice(0, 3);
      return resolution({ id: 'fake-double-plug', appliance: 'phone', label: '双头伪装' }, [
        { type: 'fake-plugs', cableIds: targets },
        { type: 'set-status', slot: 'debuff', status: status('fake-double-plug', 'phone', null, targets, ctx.state.skillEventIndex) },
      ], targets);
    }, (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0 ? 'strong-risk' : null),
];

export const APPLIANCE_SKILL_REGISTRY: ReadonlyMap<ApplianceKind, ApplianceSkillDefinition> = new Map(
  APPLIANCE_SKILL_DEFINITIONS.map((definition) => [definition.appliance, definition] as const),
);

function buildGachaCandidates(context: SkillContext): {
  benefits: Array<{ definition: ApplianceSkillDefinition; tier: GachaCardTier }>;
  risks: Array<{ definition: ApplianceSkillDefinition; tier: GachaCardTier }>;
} {
  const benefits: Array<{ definition: ApplianceSkillDefinition; tier: GachaCardTier }> = [];
  const risks: Array<{ definition: ApplianceSkillDefinition; tier: GachaCardTier }> = [];
  for (const definition of APPLIANCE_SKILL_REGISTRY.values()) {
    if (definition.appliance === 'gumball-machine' || !definition.canTrigger(context)) continue;
    const tier = definition.gachaTier(context);
    if (!tier) continue;
    (tier.endsWith('benefit') ? benefits : risks).push({ definition, tier });
  }
  return { benefits, risks };
}

function pickTiered(
  rng: DeterministicRng,
  candidates: Array<{ definition: ApplianceSkillDefinition; tier: GachaCardTier }>,
  strongChance: number,
  excluded: ReadonlySet<ApplianceKind>,
): { definition: ApplianceSkillDefinition; tier: GachaCardTier } | null {
  const availableCandidates = candidates.filter(({ definition }) => !excluded.has(definition.appliance));
  const wantStrong = rng.next() < strongChance;
  const desired = availableCandidates.filter(({ tier }) => tier.startsWith(wantStrong ? 'strong' : 'normal'));
  return rng.pick(desired.length > 0 ? desired : availableCandidates);
}

export function buildGachaCards(context: SkillContext, rng: DeterministicRng): GachaCard[] {
  const candidates = buildGachaCandidates(context);
  const excluded = new Set<ApplianceKind>();
  const selected: Array<{ definition: ApplianceSkillDefinition; tier: GachaCardTier }> = [];
  for (let index = 0; index < 2; index += 1) {
    const picked = pickTiered(rng, candidates.benefits, 0.25, excluded);
    if (picked) {
      selected.push(picked);
      excluded.add(picked.definition.appliance);
    }
  }
  const risk = pickTiered(rng, candidates.risks, 0.15, excluded);
  if (risk) selected.push(risk);
  return rng.shuffle(selected).map(({ definition, tier }) => ({
    appliance: definition.appliance,
    skillId: definition.id,
    label: definition.label,
    description: definition.description,
    tier,
  }));
}

export function gachaPoolIncludesSmartBin(context: SkillContext): boolean {
  return buildGachaCandidates(context).benefits.some(({ definition }) => definition.appliance === 'smart-bin');
}

export class SkillChallengeEngine {
  private stateValue: SkillChallengeState;
  private transaction: ManualTransaction | null = null;
  private pendingCards: GachaCard[] = [];

  constructor(seed: number) {
    this.stateValue = this.createInitialState(seed);
  }

  get state(): Readonly<SkillChallengeState> {
    return this.stateValue;
  }

  get cards(): readonly GachaCard[] {
    return this.pendingCards;
  }

  reset(seed = this.stateValue.seed): void {
    this.stateValue = this.createInitialState(seed);
    this.transaction = null;
    this.pendingCards = [];
  }

  primeForSkillTest(commands: readonly SkillCommand[]): void {
    if (this.stateValue.phase !== 'idle' || this.transaction || this.stateValue.skillEventIndex !== 0) {
      throw new Error('Skill test state can only be primed before its first transaction.');
    }
    this.applyCommands(commands);
  }

  beginManualPull(cableId: string, appliance: ApplianceKind): boolean {
    if (this.stateValue.phase !== 'idle') return false;
    this.transaction = {
      cableId,
      appliance,
      coffeeBlocked: this.stateValue.debuff?.id === 'coffee-lock',
      preexistingPrinterCopy: this.stateValue.printerCopyReady,
      microwavePendingDecrement: false,
    };
    this.stateValue.phase = 'manual-exit';
    return true;
  }

  commitManualRemoval(cableId: string): void {
    if (!this.transaction || this.transaction.cableId !== cableId) return;
    if (this.stateValue.debuff?.id === 'overheated-plug') {
      if (this.stateValue.debuff.targetCableIds.includes(cableId)) {
        this.stateValue.debuff = null;
      } else {
        this.transaction.microwavePendingDecrement = true;
      }
    }
    this.removeCableReferences(cableId);
    this.advanceExistingTurnStates(1, true);
    this.stateValue.phase = 'connecting';
  }

  resolveConnected(context: SkillContext, isLastCable: boolean): {
    resolution: SkillResolution | null;
    consumePrinterCopy: boolean;
    coffeeBlocked: boolean;
  } {
    if (!this.transaction) return { resolution: null, consumePrinterCopy: false, coffeeBlocked: false };
    const transaction = this.transaction;
    this.stateValue.phase = 'skill-cue';
    let resolved: SkillResolution | null = null;
    if (!isLastCable && !transaction.coffeeBlocked) {
      const definition = APPLIANCE_SKILL_REGISTRY.get(transaction.appliance);
      if (definition?.canTrigger(context)) {
        const rng = new DeterministicRng(this.derivedSeed(this.stateValue.skillEventIndex));
        resolved = definition.resolve(context, rng);
        this.stateValue.phase = 'skill-commit';
        this.applyCommands(resolved.commands);
        if (
          resolved.appliance === 'rice-cooker'
          && this.stateValue.debuff?.id !== 'rice-thick-cable'
        ) resolved = null;
        this.stateValue.skillEventIndex += 1;
      }
    }
    if (transaction.microwavePendingDecrement && this.stateValue.debuff?.id === 'overheated-plug') {
      this.advanceMicrowave(1);
    }
    const consumePrinterCopy = transaction.preexistingPrinterCopy && context.remainingCables.length > 0;
    if (consumePrinterCopy) this.stateValue.printerCopyReady = false;
    if (this.stateValue.currentLives === 0) {
      // Damage is committed before presentation settles. Never let the
      // presentation phase overwrite a terminal rules result.
    } else if (resolved?.requiresSelection === 'card') this.stateValue.phase = 'select-card';
    else if (resolved?.requiresSelection === 'recycle-cable') this.stateValue.phase = 'select-recycle-target';
    else this.stateValue.phase = isLastCable ? 'complete' : 'settling';
    this.transaction = null;
    return { resolution: resolved, consumePrinterCopy, coffeeBlocked: transaction.coffeeBlocked };
  }

  selectCard(index: number, context: SkillContext): SkillResolution | null {
    if (this.stateValue.phase !== 'select-card') return null;
    const card = this.pendingCards[index];
    const definition = card ? APPLIANCE_SKILL_REGISTRY.get(card.appliance) : null;
    if (!definition || !definition.canTrigger(context)) return null;
    const rng = new DeterministicRng(this.derivedSeed(this.stateValue.skillEventIndex + index + 1));
    const resolved = definition.resolve(context, rng);
    this.stateValue.phase = 'skill-commit';
    this.applyCommands(resolved.commands);
    this.stateValue.skillEventIndex += 1;
    this.pendingCards = [];
    this.stateValue.phase = resolved.requiresSelection === 'recycle-cable'
      ? 'select-recycle-target'
      : 'settling';
    return resolved;
  }

  commitRecycleSelection(cableId: string): void {
    if (this.stateValue.phase !== 'select-recycle-target') return;
    this.removeCableReferences(cableId);
    this.stateValue.phase = 'pending-auto-remove';
  }

  settle(): void {
    if (this.stateValue.phase === 'complete' || this.stateValue.phase === 'failed') return;
    this.stateValue.phase = 'idle';
  }

  notifyAutoRemoved(cableId: string): void {
    this.removeCableReferences(cableId);
    if (this.stateValue.debuff?.id === 'overheated-plug'
      && this.stateValue.debuff.targetCableIds.includes(cableId)) {
      this.stateValue.debuff = null;
    }
  }

  handleBlockedAttempt(fakePlug = false): { protected: boolean; lives: number; failed: boolean; revived: boolean } {
    void fakePlug;
    const buff = this.stateValue.buff;
    if (buff?.id === 'iridescent-bubble' || buff?.id === 'soothing-record') {
      this.stateValue.buff = null;
      return { protected: true, lives: this.stateValue.currentLives, failed: false, revived: false };
    }
    const result = this.damage(1);
    return { protected: false, ...result };
  }

  getFrozenCableIds(): readonly string[] {
    return this.stateValue.debuff?.id === 'frozen-plug'
      ? this.stateValue.debuff.targetCableIds
      : [];
  }

  getFakePlugCableIds(): readonly string[] {
    return this.stateValue.debuff?.id === 'fake-double-plug'
      ? this.stateValue.debuff.targetCableIds
      : [];
  }

  private createInitialState(seed: number): SkillChallengeState {
    return {
      seed: seed >>> 0,
      skillEventIndex: 0,
      phase: 'idle',
      currentLives: 3,
      maxLives: 3,
      buff: null,
      debuff: null,
      printerCopyReady: false,
      lampHintCableId: null,
      popcornHintCableId: null,
      reviveUsedThisChallenge: false,
    };
  }

  private derivedSeed(index: number): number {
    return Math.imul((this.stateValue.seed + index + 1) >>> 0, 0x9e3779b1) >>> 0;
  }

  private applyCommands(commands: readonly SkillCommand[]): void {
    for (const command of commands) {
      switch (command.type) {
        case 'set-status':
          this.setStatus(command.slot, command.status);
          break;
        case 'clear-status':
          this.stateValue[command.slot] = null;
          break;
        case 'set-hint':
          if (command.source === 'lamp') this.stateValue.lampHintCableId = command.cableId;
          else this.stateValue.popcornHintCableId = command.cableId;
          break;
        case 'heal':
          this.stateValue.currentLives = Math.min(this.stateValue.maxLives, this.stateValue.currentLives + command.amount);
          break;
        case 'increase-max-lives': {
          const previous = this.stateValue.maxLives;
          this.stateValue.maxLives = Math.min(6, this.stateValue.maxLives + command.amount);
          this.stateValue.currentLives = Math.min(
            this.stateValue.maxLives,
            this.stateValue.currentLives + Math.max(1, this.stateValue.maxLives - previous),
          );
          break;
        }
        case 'set-printer-copy':
          this.stateValue.printerCopyReady = true;
          break;
        case 'advance-timed-statuses':
          this.advanceExistingTurnStates(command.amount, false);
          break;
        case 'normalize-timed-statuses':
          if (timed(this.stateValue.buff)) this.stateValue.buff!.turnsRemaining = command.turns;
          if (timed(this.stateValue.debuff)) this.stateValue.debuff!.turnsRemaining = command.turns;
          break;
        case 'damage-or-remove-buff':
          if (this.stateValue.buff) this.stateValue.buff = null;
          else this.damage(command.amount);
          break;
        case 'grant-continue':
          this.grantContinue();
          break;
        case 'request-card-selection':
          this.pendingCards = [...command.cards];
          break;
        default:
          break;
      }
    }
  }

  private setStatus(slot: SkillStatusSlot, next: StatusInstance): void {
    if (slot === 'debuff') {
      if (this.stateValue.debuff) return;
      if (this.stateValue.buff?.id === 'dry-shield') {
        this.stateValue.buff = null;
        return;
      }
      this.stateValue.debuff = { ...next, targetCableIds: [...next.targetCableIds], payload: { ...next.payload } };
      return;
    }
    if (next.id === 'continue' && this.stateValue.buff?.id === 'continue') {
      const current = Number(this.stateValue.buff.payload.restoreLives ?? 1);
      this.stateValue.buff.payload.restoreLives = Math.min(this.stateValue.maxLives, current + 1);
      return;
    }
    this.stateValue.buff = { ...next, targetCableIds: [...next.targetCableIds], payload: { ...next.payload } };
  }

  private grantContinue(): void {
    if (this.stateValue.reviveUsedThisChallenge) {
      this.stateValue.currentLives = Math.min(this.stateValue.maxLives, this.stateValue.currentLives + 1);
      return;
    }
    if (this.stateValue.buff?.id === 'continue') {
      const restoreLives = Number(this.stateValue.buff.payload.restoreLives ?? 1);
      this.stateValue.buff.payload.restoreLives = Math.min(this.stateValue.maxLives, restoreLives + 1);
      return;
    }
    this.stateValue.buff = status('continue', 'game-controller', null, [], this.stateValue.skillEventIndex, {
      restoreLives: 1,
    });
  }

  private advanceExistingTurnStates(amount: number, deferMicrowave: boolean): void {
    this.stateValue.buff = this.advanceStatus(this.stateValue.buff, amount);
    if (!(deferMicrowave && this.stateValue.debuff?.id === 'overheated-plug')) {
      this.stateValue.debuff = this.advanceStatus(this.stateValue.debuff, amount);
    }
  }

  private advanceStatus(instance: StatusInstance | null, amount: number): StatusInstance | null {
    if (!instance || instance.turnsRemaining === null) return instance;
    const nextTurns = Math.max(0, instance.turnsRemaining - amount);
    return nextTurns === 0 ? null : { ...instance, turnsRemaining: nextTurns };
  }

  private advanceMicrowave(amount: number): void {
    const microwave = this.stateValue.debuff;
    if (microwave?.id !== 'overheated-plug' || microwave.turnsRemaining === null) return;
    const remaining = microwave.turnsRemaining - amount;
    if (remaining > 0) {
      microwave.turnsRemaining = remaining;
      return;
    }
    this.stateValue.debuff = null;
    this.damage(1);
  }

  private damage(amount: number): { lives: number; failed: boolean; revived: boolean } {
    this.stateValue.currentLives = Math.max(0, this.stateValue.currentLives - amount);
    if (this.stateValue.currentLives > 0) {
      return { lives: this.stateValue.currentLives, failed: false, revived: false };
    }
    if (this.stateValue.buff?.id === 'continue' && !this.stateValue.reviveUsedThisChallenge) {
      const restoreLives = Math.max(1, Number(this.stateValue.buff.payload.restoreLives ?? 1));
      this.stateValue.buff = null;
      this.stateValue.reviveUsedThisChallenge = true;
      this.stateValue.currentLives = Math.min(this.stateValue.maxLives, restoreLives);
      return { lives: this.stateValue.currentLives, failed: false, revived: true };
    }
    this.stateValue.phase = 'failed';
    return { lives: 0, failed: true, revived: false };
  }

  private removeCableReferences(cableId: string): void {
    if (this.stateValue.lampHintCableId === cableId) this.stateValue.lampHintCableId = null;
    if (this.stateValue.popcornHintCableId === cableId) this.stateValue.popcornHintCableId = null;
    if (!this.stateValue.debuff?.targetCableIds.includes(cableId)) return;
    const targets = this.stateValue.debuff.targetCableIds.filter((id) => id !== cableId);
    if (this.stateValue.debuff.id === 'fake-double-plug' && targets.length === 0) {
      this.stateValue.debuff = null;
      return;
    }
    this.stateValue.debuff = { ...this.stateValue.debuff, targetCableIds: targets };
  }
}
