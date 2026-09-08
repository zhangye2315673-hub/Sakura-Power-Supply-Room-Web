import { t as APPLIANCE_CATALOG } from "./ApplianceCatalog-2_-hlaHk.js";
//#region src/skill/SkillChallengeEngine.ts
var DeterministicRng = class {
	state;
	constructor(seed) {
		this.state = seed >>> 0;
	}
	next() {
		this.state = Math.imul(this.state, 1664525) + 1013904223 >>> 0;
		return this.state / 4294967296;
	}
	pick(items) {
		if (items.length === 0) return null;
		return items[Math.floor(this.next() * items.length)] ?? null;
	}
	shuffle(items) {
		const result = [...items];
		for (let index = result.length - 1; index > 0; index -= 1) {
			const swap = Math.floor(this.next() * (index + 1));
			[result[index], result[swap]] = [result[swap], result[index]];
		}
		return result;
	}
};
var status = (id, sourceAppliance, turnsRemaining, targetCableIds, skillEventIndex, payload = {}) => ({
	id,
	sourceAppliance,
	iconId: `${id === "bathroom-steam" || id === "frozen-plug" || id === "coffee-lock" || id === "rice-thick-cable" || id === "overheated-plug" || id === "fake-double-plug" ? "debuff" : "buff"}-${id}`,
	turnsRemaining,
	targetCableIds: [...targetCableIds],
	payload: { ...payload },
	createdBySkillEventIndex: skillEventIndex
});
function resolution(definition, commands, targetCableIds = [], options = {}) {
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
			assetIds: []
		}
	};
}
var available = (context) => context.remainingCables.filter((cable) => context.availableCableIds.includes(cable.id));
var remainingIds = (context) => context.remainingCables.map((cable) => cable.id);
function pickPrinterCopyCableId(context) {
	const availableIds = new Set(context.availableCableIds);
	return context.removalSequence.find((id) => availableIds.has(id)) ?? context.availableCableIds[0] ?? null;
}
var timed = (instance) => instance?.turnsRemaining !== null && instance !== null;
var hasDebuff = (context, id) => id ? context.state.debuff?.id === id : context.state.debuff !== null;
var noDebuff = (context) => !context.state.debuff;
var noBuff = (context) => !context.state.buff;
var hairDryerRecolorCandidates = (context) => {
	const routeColors = context.routeColors.slice(0, 2);
	return routeColors.length > 0 ? context.remainingCables.filter((cable) => !routeColors.includes(cable.color)) : [];
};
var topologyLockedCableIds = (context) => {
	const status = context.state.debuff;
	if (!status || status.id !== "frozen-plug" && status.id !== "overheated-plug") return /* @__PURE__ */ new Set();
	return new Set(status.targetCableIds);
};
var toasterCandidates = (context) => {
	const locked = topologyLockedCableIds(context);
	return context.remainingCables.filter((cable) => !cable.fakePlug && !locked.has(cable.id));
};
var televisionReconstructionCandidates = (context) => {
	const topologyLockedIds = context.state.debuff?.id === "frozen-plug" || context.state.debuff?.id === "overheated-plug" ? new Set(context.state.debuff.targetCableIds) : /* @__PURE__ */ new Set();
	return context.remainingCables.filter((cable) => !topologyLockedIds.has(cable.id));
};
function basicDefinition(appliance, id, label, description, polarity, slot, canTrigger, resolveSkill, tier) {
	return {
		appliance,
		id,
		label,
		description,
		polarity,
		slot,
		canTrigger,
		resolve: resolveSkill,
		gachaTier: tier
	};
}
var APPLIANCE_SKILL_DEFINITIONS = [
	basicDefinition("lamp", "lamp-hint", "照明提示", "持续标记一根真实可抽线。", "positive", null, (ctx) => available(ctx).length > 0, (ctx, rng) => {
		const target = rng.pick(available(ctx));
		return resolution({
			id: "lamp-hint",
			appliance: "lamp",
			label: "照明提示"
		}, [{
			type: "set-hint",
			source: "lamp",
			cableId: target.id
		}], [target.id]);
	}, () => "normal-benefit"),
	basicDefinition("humidifier", "bathroom-steam", "浴室蒸汽", "三次正确抽线后擦除的蒸汽遮罩。", "negative", "debuff", noDebuff, (ctx) => resolution({
		id: "bathroom-steam",
		appliance: "humidifier",
		label: "浴室蒸汽"
	}, [{
		type: "set-status",
		slot: "debuff",
		status: status("bathroom-steam", "humidifier", 3, [], ctx.state.skillEventIndex)
	}]), (ctx) => noDebuff(ctx) ? "normal-risk" : null),
	basicDefinition("fan", "clear-steam", "吹散蒸汽", "提前清除浴室蒸汽。", "positive", null, (ctx) => hasDebuff(ctx, "bathroom-steam"), () => resolution({
		id: "clear-steam",
		appliance: "fan",
		label: "吹散蒸汽"
	}, [{
		type: "clear-status",
		slot: "debuff",
		reason: "fan"
	}]), (ctx) => hasDebuff(ctx, "bathroom-steam") ? "normal-benefit" : null),
	basicDefinition("dehumidifier", "dehumidify", "净化与干燥护罩", "清除负面状态；无负面状态时生成护罩。", "positive", "buff", () => true, (ctx) => hasDebuff(ctx) ? resolution({
		id: "dehumidify",
		appliance: "dehumidifier",
		label: "净化与干燥护罩"
	}, [{
		type: "clear-status",
		slot: "debuff",
		reason: "dehumidifier"
	}]) : resolution({
		id: "dehumidify",
		appliance: "dehumidifier",
		label: "净化与干燥护罩"
	}, [{
		type: "set-status",
		slot: "buff",
		status: status("dry-shield", "dehumidifier", 3, [], ctx.state.skillEventIndex)
	}]), (ctx) => hasDebuff(ctx) || noBuff(ctx) ? "normal-benefit" : null),
	basicDefinition("refrigerator", "freeze-plugs", "急冻封头", "冻结约一半当前出口三回合。", "negative", "debuff", (ctx) => noDebuff(ctx) && available(ctx).length > 1, (ctx, rng) => {
		const candidates = rng.shuffle(available(ctx));
		const count = Math.min(candidates.length - 1, Math.ceil(candidates.length / 2));
		const targets = candidates.slice(0, count).map((cable) => cable.id);
		return resolution({
			id: "freeze-plugs",
			appliance: "refrigerator",
			label: "急冻封头"
		}, [{
			type: "freeze",
			cableIds: targets
		}, {
			type: "set-status",
			slot: "debuff",
			status: status("frozen-plug", "refrigerator", 3, targets, ctx.state.skillEventIndex)
		}], targets);
	}, (ctx) => noDebuff(ctx) && available(ctx).length > 1 ? "strong-risk" : null),
	basicDefinition("hair-dryer", "hair-dryer-branch", "解冻或热风改色", "优先解冻，否则把一根线改为当前前两种有效路线色之一。", "mixed", null, (ctx) => hasDebuff(ctx, "frozen-plug") || hairDryerRecolorCandidates(ctx).length > 0, (ctx, rng) => {
		if (hasDebuff(ctx, "frozen-plug")) return resolution({
			id: "hair-dryer-branch",
			appliance: "hair-dryer",
			label: "解冻或热风改色"
		}, [{
			type: "clear-status",
			slot: "debuff",
			reason: "hair-dryer"
		}]);
		const routeColors = ctx.routeColors.slice(0, 2);
		const candidates = hairDryerRecolorCandidates(ctx);
		const target = rng.pick(candidates);
		const color = rng.pick(routeColors);
		return target && color !== null ? resolution({
			id: "hair-dryer-branch",
			appliance: "hair-dryer",
			label: "解冻或热风改色"
		}, [{
			type: "recolor",
			changes: [{
				cableId: target.id,
				color
			}]
		}], [target.id]) : resolution({
			id: "hair-dryer-branch",
			appliance: "hair-dryer",
			label: "解冻或热风改色"
		}, []);
	}, (ctx) => hasDebuff(ctx, "frozen-plug") ? "normal-benefit" : hairDryerRecolorCandidates(ctx).length > 0 ? "normal-risk" : null),
	basicDefinition("washer", "spin-remove", "脱水甩线", "从全部剩余线中甩出最多两根。", "positive", null, (ctx) => ctx.remainingCables.length > 0, (ctx, rng) => {
		const targets = rng.shuffle(remainingIds(ctx)).slice(0, 2);
		return resolution({
			id: "spin-remove",
			appliance: "washer",
			label: "脱水甩线"
		}, [{
			type: "auto-remove",
			cableIds: targets,
			source: "washer"
		}], targets, { topologyChanged: true });
	}, (ctx) => ctx.remainingCables.length > 0 ? "strong-benefit" : null),
	basicDefinition("bubble-machine", "bubble-shield", "虹膜泡泡", "五回合内抵挡一次受阻点击。", "positive", "buff", () => true, (ctx) => resolution({
		id: "bubble-shield",
		appliance: "bubble-machine",
		label: "虹膜泡泡"
	}, [{
		type: "set-status",
		slot: "buff",
		status: status("iridescent-bubble", "bubble-machine", 5, [], ctx.state.skillEventIndex)
	}]), (ctx) => noBuff(ctx) ? "strong-benefit" : null),
	basicDefinition("television", "glitch-reconstruct", "故障重构", "重构最多三根线的空间路径。", "mixed", null, (ctx) => televisionReconstructionCandidates(ctx).length > 1, (ctx, rng) => {
		const targets = rng.shuffle(televisionReconstructionCandidates(ctx).map((cable) => cable.id)).slice(0, 3);
		return resolution({
			id: "glitch-reconstruct",
			appliance: "television",
			label: "故障重构"
		}, [{
			type: "reconstruct",
			cableIds: targets
		}], targets, { topologyChanged: true });
	}, (ctx) => televisionReconstructionCandidates(ctx).length > 1 ? "normal-risk" : null),
	basicDefinition("radio", "route-broadcast", "三步路线广播", "持续标记接下来三根可抽线路，当前目标会脉冲提示。", "positive", null, (ctx) => ctx.removalSequence.some((id) => ctx.availableCableIds.includes(id)), (ctx) => {
		return resolution({
			id: "route-broadcast",
			appliance: "radio",
			label: "三步路线广播"
		}, [], ctx.removalSequence.filter((id) => ctx.availableCableIds.includes(id)).slice(0, 3));
	}, (ctx) => ctx.removalSequence.some((id) => ctx.availableCableIds.includes(id)) ? "normal-benefit" : null),
	basicDefinition("toaster", "swap-ends", "双面翻烤", "交换最多两根线的插头端与尾端。", "mixed", null, (ctx) => toasterCandidates(ctx).length > 0, (ctx, rng) => {
		const targets = rng.shuffle(toasterCandidates(ctx).map((cable) => cable.id)).slice(0, 2);
		return resolution({
			id: "swap-ends",
			appliance: "toaster",
			label: "双面翻烤"
		}, [{
			type: "swap-ends",
			cableIds: targets
		}], targets, { topologyChanged: true });
	}, (ctx) => toasterCandidates(ctx).length > 0 ? "normal-risk" : null),
	basicDefinition("kettle", "steam-thaw", "高温蒸汽解冻", "立即融化全部急冻冰壳。", "positive", null, (ctx) => hasDebuff(ctx, "frozen-plug"), () => resolution({
		id: "steam-thaw",
		appliance: "kettle",
		label: "高温蒸汽解冻"
	}, [{
		type: "clear-status",
		slot: "debuff",
		reason: "kettle"
	}]), (ctx) => hasDebuff(ctx, "frozen-plug") ? "normal-benefit" : null),
	basicDefinition("coffee-maker", "coffee-lock", "咖啡封技", "咖啡覆盖线色，并封锁后续三次家电技能；连接与普通动画照常。", "negative", "debuff", (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0, (ctx) => resolution({
		id: "coffee-lock",
		appliance: "coffee-maker",
		label: "咖啡封技"
	}, [{
		type: "set-status",
		slot: "debuff",
		status: status("coffee-lock", "coffee-maker", 3, [], ctx.state.skillEventIndex)
	}]), (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0 ? "strong-risk" : null),
	basicDefinition("robot-vacuum", "snapshot-sweep", "快照清线", "清除触发瞬间全部真实可抽线。", "positive", null, (ctx) => available(ctx).length > 0, (ctx) => {
		const targets = [...ctx.availableCableIds];
		return resolution({
			id: "snapshot-sweep",
			appliance: "robot-vacuum",
			label: "快照清线"
		}, [{
			type: "auto-remove",
			cableIds: targets,
			source: "robot-vacuum"
		}], targets, { topologyChanged: true });
	}, (ctx) => available(ctx).length > 0 ? "strong-benefit" : null),
	basicDefinition("rice-cooker", "rice-thick-cable", "米饭膨胀粗线", "三回合视觉粗线，不改变真实碰撞。", "negative", "debuff", (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0, (ctx) => resolution({
		id: "rice-thick-cable",
		appliance: "rice-cooker",
		label: "米饭膨胀粗线"
	}, [{
		type: "set-status",
		slot: "debuff",
		status: status("rice-thick-cable", "rice-cooker", 3, [], ctx.state.skillEventIndex)
	}]), (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0 ? "normal-risk" : null),
	basicDefinition("blender", "color-shuffle", "全线色彩搅拌", "保持颜色总量不变地重新分配全部线色。", "mixed", null, (ctx) => new Set(ctx.remainingCables.map((cable) => cable.color)).size > 1, (ctx, rng) => {
		const colors = ctx.remainingCables.map((cable) => cable.color);
		let shuffled = rng.shuffle(colors);
		if (shuffled.every((color, index) => color === colors[index])) shuffled = [...colors.slice(1), colors[0]];
		const changes = ctx.remainingCables.map((cable, index) => ({
			cableId: cable.id,
			color: shuffled[index]
		}));
		return resolution({
			id: "color-shuffle",
			appliance: "blender",
			label: "全线色彩搅拌"
		}, [{
			type: "recolor",
			changes
		}], changes.filter((change, index) => change.color !== colors[index]).map((change) => change.cableId));
	}, (ctx) => new Set(ctx.remainingCables.map((cable) => cable.color)).size > 1 ? "normal-risk" : null),
	basicDefinition("printer", "printer-copy", "抽线动作复印", "下一次正确抽线后自动抽出第二根。", "positive", null, (ctx) => !ctx.state.printerCopyReady && ctx.remainingCables.length > 0, () => resolution({
		id: "printer-copy",
		appliance: "printer",
		label: "抽线动作复印"
	}, [{ type: "set-printer-copy" }]), (ctx) => !ctx.state.printerCopyReady && ctx.remainingCables.length > 0 ? "strong-benefit" : null),
	basicDefinition("gumball-machine", "sakura-gacha", "樱花三选一", "两张收益卡与一张风险卡的单次选择。", "mixed", null, (ctx) => buildGachaCandidates(ctx).benefits.length >= 2 && buildGachaCandidates(ctx).risks.length >= 1, (ctx, rng) => {
		return resolution({
			id: "sakura-gacha",
			appliance: "gumball-machine",
			label: "樱花三选一"
		}, [{
			type: "request-card-selection",
			cards: buildGachaCards(ctx, rng)
		}], [], { requiresSelection: "card" });
	}, () => null),
	basicDefinition("record-player", "soothing-record", "安心旋律", "恢复一格生命并抵挡一次受阻点击。", "positive", "buff", () => true, (ctx) => resolution({
		id: "soothing-record",
		appliance: "record-player",
		label: "安心旋律"
	}, [{
		type: "heal",
		amount: 1
	}, {
		type: "set-status",
		slot: "buff",
		status: status("soothing-record", "record-player", null, [], ctx.state.skillEventIndex)
	}]), (ctx) => noBuff(ctx) ? "strong-benefit" : null),
	basicDefinition("alarm-clock", "time-fast-forward", "时间快进", "所有限回合状态额外推进一回合。", "mixed", null, (ctx) => timed(ctx.state.buff) || timed(ctx.state.debuff), () => resolution({
		id: "time-fast-forward",
		appliance: "alarm-clock",
		label: "时间快进"
	}, [{
		type: "advance-timed-statuses",
		amount: 1
	}]), (ctx) => timed(ctx.state.debuff) && !timed(ctx.state.buff) ? "normal-benefit" : timed(ctx.state.buff) || timed(ctx.state.debuff) ? "normal-risk" : null),
	basicDefinition("popcorn-machine", "popcorn-meal", "爆米花加餐与出口提示", "生命上限 +1，并用跳动爆米花标记一个当前可抽插头。", "positive", null, (ctx) => ctx.remainingCables.length > 0, (ctx, rng) => {
		const target = rng.pick(available(ctx));
		const commands = [{
			type: "increase-max-lives",
			amount: 1
		}];
		if (target) commands.push({
			type: "set-hint",
			source: "popcorn",
			cableId: target.id
		});
		return resolution({
			id: "popcorn-meal",
			appliance: "popcorn-machine",
			label: "爆米花加餐与出口提示"
		}, commands, target ? [target.id] : []);
	}, (ctx) => ctx.remainingCables.length > 0 ? "strong-benefit" : null),
	basicDefinition("stand-mixer", "normalize-statuses", "搅拌均匀", "先正常推进 1 回合，再把仍存在的限回合 BUFF／DEBUFF 统一整理为 2 回合。", "mixed", null, (ctx) => timed(ctx.state.buff) || timed(ctx.state.debuff), () => resolution({
		id: "normalize-statuses",
		appliance: "stand-mixer",
		label: "搅拌均匀"
	}, [{
		type: "normalize-timed-statuses",
		turns: 2
	}]), (ctx) => {
		const buff = ctx.state.buff?.turnsRemaining;
		const debuff = ctx.state.debuff?.turnsRemaining;
		if (buff === null && debuff === null) return null;
		return typeof debuff === "number" && debuff > 2 && !(typeof buff === "number" && buff > 2) ? "normal-benefit" : "normal-risk";
	}),
	basicDefinition("game-controller", "continue-game", "继续游戏", "获得一次复活，重复触发升级恢复量。", "positive", "buff", () => true, () => resolution({
		id: "continue-game",
		appliance: "game-controller",
		label: "继续游戏"
	}, [{ type: "grant-continue" }]), (ctx) => noBuff(ctx) || ctx.state.buff?.id === "continue" || ctx.state.reviveUsedThisChallenge ? "strong-benefit" : null),
	basicDefinition("microwave", "timed-meal", "限时取餐", "随机高亮一根当前可拔的线；必须在接下来两次成功拔线内拔出它，否则失去一格生命。", "negative", "debuff", (ctx) => noDebuff(ctx) && available(ctx).length > 0, (ctx, rng) => {
		const target = rng.pick(available(ctx));
		return resolution({
			id: "timed-meal",
			appliance: "microwave",
			label: "限时取餐"
		}, [{
			type: "set-status",
			slot: "debuff",
			status: status("overheated-plug", "microwave", 2, [target.id], ctx.state.skillEventIndex)
		}], [target.id]);
	}, (ctx) => noDebuff(ctx) && available(ctx).length > 0 ? "strong-risk" : null),
	basicDefinition("desktop-computer", "blue-screen", "蓝屏崩溃", "删除当前 BUFF；没有 BUFF 时扣除一格生命。", "negative", null, () => true, () => resolution({
		id: "blue-screen",
		appliance: "desktop-computer",
		label: "蓝屏崩溃"
	}, [{
		type: "damage-or-remove-buff",
		amount: 1,
		source: "desktop-computer"
	}]), () => "strong-risk"),
	basicDefinition("induction-cooktop", "induction-reveal", "感应显线", "三回合持续标记全部真实出口。", "positive", "buff", (ctx) => ctx.remainingCables.length > 0, (ctx) => resolution({
		id: "induction-reveal",
		appliance: "induction-cooktop",
		label: "感应显线"
	}, [{
		type: "set-status",
		slot: "buff",
		status: status("induction-reveal", "induction-cooktop", 3, [], ctx.state.skillEventIndex)
	}]), (ctx) => noBuff(ctx) && ctx.remainingCables.length > 0 ? "normal-benefit" : null),
	basicDefinition("portable-speaker", "bass-spacing", "节拍扩距", "线组随音乐逐拍压缩、膨胀，最终让线与线外轮廓之间的净空约为原来的 2 倍，持续 3 回合；不改变可抽判定。", "positive", "buff", (ctx) => ctx.remainingCables.length > 1, (ctx) => resolution({
		id: "bass-spacing",
		appliance: "portable-speaker",
		label: "节拍扩距"
	}, [{
		type: "set-status",
		slot: "buff",
		status: status("bass-spacing", "portable-speaker", 3, [], ctx.state.skillEventIndex)
	}]), (ctx) => noBuff(ctx) && ctx.remainingCables.length > 1 ? "normal-benefit" : null),
	basicDefinition("smart-bin", "recycle-cable", "指定回收", "直接选择并回收任意一根剩余线。", "positive", null, (ctx) => ctx.remainingCables.length > 0, () => resolution({
		id: "recycle-cable",
		appliance: "smart-bin",
		label: "指定回收"
	}, [{ type: "request-recycle-selection" }], [], { requiresSelection: "recycle-cable" }), (ctx) => ctx.remainingCables.length > 0 ? "strong-benefit" : null),
	basicDefinition("phone", "fake-double-plug", "双头伪装", "最多三根线的普通尾端生成永久假插头。", "negative", "debuff", (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0, (ctx, rng) => {
		const targets = rng.shuffle(remainingIds(ctx)).slice(0, 3);
		return resolution({
			id: "fake-double-plug",
			appliance: "phone",
			label: "双头伪装"
		}, [{
			type: "fake-plugs",
			cableIds: targets
		}, {
			type: "set-status",
			slot: "debuff",
			status: status("fake-double-plug", "phone", null, targets, ctx.state.skillEventIndex)
		}], targets);
	}, (ctx) => noDebuff(ctx) && ctx.remainingCables.length > 0 ? "strong-risk" : null)
];
var APPLIANCE_SKILL_REGISTRY = new Map(APPLIANCE_SKILL_DEFINITIONS.map((definition) => [definition.appliance, definition]));
function buildGachaCandidates(context) {
	const benefits = [];
	const risks = [];
	for (const definition of APPLIANCE_SKILL_REGISTRY.values()) {
		if (definition.appliance === "gumball-machine" || !definition.canTrigger(context)) continue;
		const tier = definition.gachaTier(context);
		if (!tier) continue;
		(tier.endsWith("benefit") ? benefits : risks).push({
			definition,
			tier
		});
	}
	return {
		benefits,
		risks
	};
}
function pickTiered(rng, candidates, strongChance, excluded) {
	const availableCandidates = candidates.filter(({ definition }) => !excluded.has(definition.appliance));
	const wantStrong = rng.next() < strongChance;
	const desired = availableCandidates.filter(({ tier }) => tier.startsWith(wantStrong ? "strong" : "normal"));
	return rng.pick(desired.length > 0 ? desired : availableCandidates);
}
function buildGachaCards(context, rng) {
	const candidates = buildGachaCandidates(context);
	const excluded = /* @__PURE__ */ new Set();
	const selected = [];
	for (let index = 0; index < 2; index += 1) {
		const picked = pickTiered(rng, candidates.benefits, .25, excluded);
		if (picked) {
			selected.push(picked);
			excluded.add(picked.definition.appliance);
		}
	}
	const risk = pickTiered(rng, candidates.risks, .15, excluded);
	if (risk) selected.push(risk);
	return rng.shuffle(selected).map(({ definition, tier }) => ({
		appliance: definition.appliance,
		skillId: definition.id,
		label: definition.label,
		description: definition.description,
		tier
	}));
}
var SkillChallengeEngine = class {
	stateValue;
	transaction = null;
	pendingCards = [];
	pendingDryShieldBlock = false;
	constructor(seed) {
		this.stateValue = this.createInitialState(seed);
	}
	get state() {
		return this.stateValue;
	}
	get cards() {
		return this.pendingCards;
	}
	reset(seed = this.stateValue.seed) {
		this.stateValue = this.createInitialState(seed);
		this.transaction = null;
		this.pendingCards = [];
		this.pendingDryShieldBlock = false;
	}
	primeForSkillTest(commands) {
		if (this.stateValue.phase !== "idle" || this.transaction || this.stateValue.skillEventIndex !== 0) throw new Error("Skill test state can only be primed before its first transaction.");
		this.applyCommands(commands);
	}
	beginManualPull(cableId, appliance, wasLastCableAtPullStart = false) {
		if (this.stateValue.phase !== "idle") return false;
		this.transaction = {
			cableId,
			appliance,
			coffeeBlocked: this.stateValue.debuff?.id === "coffee-lock",
			preexistingPrinterCopy: this.stateValue.printerCopyReady,
			printerCopyConsumedOnExit: false,
			microwavePendingDecrement: false,
			wasLastCableAtPullStart
		};
		this.stateValue.phase = "manual-exit";
		return true;
	}
	commitManualRemoval(cableId, hasRemainingCables = true) {
		if (!this.transaction || this.transaction.cableId !== cableId) return false;
		if (this.stateValue.debuff?.id === "overheated-plug") if (this.stateValue.debuff.targetCableIds.includes(cableId)) this.stateValue.debuff = null;
		else this.transaction.microwavePendingDecrement = true;
		this.removeCableReferences(cableId);
		this.advanceExistingTurnStates(1, true);
		const consumePrinterCopy = this.transaction.preexistingPrinterCopy && hasRemainingCables;
		if (consumePrinterCopy) {
			this.stateValue.printerCopyReady = false;
			this.transaction.printerCopyConsumedOnExit = true;
		}
		this.stateValue.phase = "connecting";
		return consumePrinterCopy;
	}
	resolveConnected(context, isLastCable) {
		if (!this.transaction) return {
			resolution: null,
			consumePrinterCopy: false,
			coffeeBlocked: false,
			blockedByDryShield: false,
			buffPreserved: false,
			buffFallback: null,
			debuffSuppressed: false,
			damage: null
		};
		const transaction = this.transaction;
		this.stateValue.phase = "skill-cue";
		let resolved = null;
		const printerAlreadyCopiedThisPull = transaction.appliance === "printer" && transaction.preexistingPrinterCopy;
		let blockedByDryShield = false;
		let buffPreserved = false;
		let buffFallback = null;
		let debuffSuppressed = false;
		if (!transaction.wasLastCableAtPullStart && !transaction.coffeeBlocked && !printerAlreadyCopiedThisPull) {
			const definition = APPLIANCE_SKILL_REGISTRY.get(transaction.appliance);
			if (definition?.slot === "debuff" && this.stateValue.debuff) {
				this.stateValue.phase = "skill-commit";
				debuffSuppressed = true;
				this.stateValue.skillEventIndex += 1;
			} else if (definition?.canTrigger(context)) {
				const rng = new DeterministicRng(this.derivedSeed(this.stateValue.skillEventIndex));
				resolved = definition.resolve(context, rng);
				this.stateValue.phase = "skill-commit";
				const commandOutcome = this.applyCommands(resolved.commands);
				blockedByDryShield = commandOutcome.blockedByDryShield;
				buffPreserved = commandOutcome.buffPreserved;
				buffFallback = commandOutcome.buffFallback;
				if (blockedByDryShield) resolved = null;
				this.stateValue.skillEventIndex += 1;
			}
		}
		let damage = null;
		if (transaction.microwavePendingDecrement && this.stateValue.debuff?.id === "overheated-plug") damage = this.advanceMicrowave(1);
		const consumePrinterCopy = transaction.printerCopyConsumedOnExit;
		if (this.stateValue.currentLives === 0) {} else if (resolved?.requiresSelection === "card") this.stateValue.phase = "select-card";
		else if (resolved?.requiresSelection === "recycle-cable") this.stateValue.phase = "select-recycle-target";
		else this.stateValue.phase = isLastCable ? "complete" : "settling";
		this.transaction = null;
		return {
			resolution: resolved,
			consumePrinterCopy,
			coffeeBlocked: transaction.coffeeBlocked,
			blockedByDryShield,
			buffPreserved,
			buffFallback,
			debuffSuppressed,
			damage
		};
	}
	selectCard(index, context) {
		if (this.stateValue.phase !== "select-card") return null;
		const card = this.pendingCards[index];
		const definition = card ? APPLIANCE_SKILL_REGISTRY.get(card.appliance) : null;
		if (!definition || !definition.canTrigger(context)) return null;
		const rng = new DeterministicRng(this.derivedSeed(this.stateValue.skillEventIndex + index + 1));
		const resolved = definition.resolve(context, rng);
		this.stateValue.phase = "skill-commit";
		const commandOutcome = this.applyCommands(resolved.commands);
		this.stateValue.skillEventIndex += 1;
		this.pendingCards = [];
		if (commandOutcome.blockedByDryShield) {
			this.stateValue.phase = "settling";
			return null;
		}
		this.stateValue.phase = resolved.requiresSelection === "recycle-cable" ? "select-recycle-target" : "settling";
		return resolved;
	}
	commitRecycleSelection(cableId) {
		if (this.stateValue.phase !== "select-recycle-target") return;
		this.removeCableReferences(cableId);
		this.stateValue.phase = "pending-auto-remove";
	}
	settle() {
		if (this.stateValue.phase === "complete" || this.stateValue.phase === "failed") return;
		this.stateValue.phase = "idle";
	}
	clearExhaustedCoffeeLock() {
		if (this.stateValue.debuff?.id === "coffee-lock" && this.stateValue.debuff.turnsRemaining === 0) this.stateValue.debuff = null;
	}
	notifyAutoRemoved(cableId, hasRemainingCables = true) {
		const removedMicrowaveTarget = this.stateValue.debuff?.id === "overheated-plug" && this.stateValue.debuff.targetCableIds.includes(cableId);
		this.removeCableReferences(cableId);
		if (removedMicrowaveTarget) this.stateValue.debuff = null;
		if (!hasRemainingCables) this.stateValue.phase = "complete";
	}
	reselectInvalidHints(context) {
		const physicallyAvailable = available(context);
		const remainingIds = new Set(context.remainingCables.map((cable) => cable.id));
		const visibleCandidates = physicallyAvailable.filter((cable) => {
			const status = context.state.debuff;
			return !(status?.id === "overheated-plug" && status.targetCableIds.includes(cable.id));
		});
		const candidates = visibleCandidates.length > 0 ? visibleCandidates : physicallyAvailable;
		const pickHint = (current, offset) => {
			if (current && candidates.some((cable) => cable.id === current)) return current;
			if (!current || !remainingIds.has(current)) return null;
			if (candidates.length === 0) return null;
			return new DeterministicRng(this.derivedSeed(this.stateValue.skillEventIndex + offset)).pick(candidates)?.id ?? null;
		};
		this.stateValue.lampHintCableId = pickHint(this.stateValue.lampHintCableId, 17);
		this.stateValue.popcornHintCableId = pickHint(this.stateValue.popcornHintCableId, 19);
	}
	clearFrozenDeadlock() {
		if (this.stateValue.debuff?.id !== "frozen-plug") return false;
		this.stateValue.debuff = null;
		return true;
	}
	consumeDryShieldBlock() {
		const blocked = this.pendingDryShieldBlock;
		this.pendingDryShieldBlock = false;
		return blocked;
	}
	handleBlockedAttempt(fakePlug = false) {
		const buff = this.stateValue.buff;
		if (buff?.id === "iridescent-bubble" || buff?.id === "soothing-record") {
			const extraBlocks = Math.max(0, Number(buff.payload.extraBlocks ?? 0));
			if (extraBlocks > 0) buff.payload.extraBlocks = extraBlocks - 1;
			else this.stateValue.buff = null;
			return {
				protected: true,
				lives: this.stateValue.currentLives,
				failed: false,
				revived: false
			};
		}
		return {
			protected: false,
			...this.damage(1)
		};
	}
	getFrozenCableIds() {
		return this.stateValue.debuff?.id === "frozen-plug" ? this.stateValue.debuff.targetCableIds : [];
	}
	getFakePlugCableIds() {
		return this.stateValue.debuff?.id === "fake-double-plug" ? this.stateValue.debuff.targetCableIds : [];
	}
	createInitialState(seed) {
		return {
			seed: seed >>> 0,
			skillEventIndex: 0,
			phase: "idle",
			currentLives: 3,
			maxLives: 3,
			buff: null,
			debuff: null,
			printerCopyReady: false,
			lampHintCableId: null,
			popcornHintCableId: null,
			reviveUsedThisChallenge: false
		};
	}
	derivedSeed(index) {
		return Math.imul(this.stateValue.seed + index + 1 >>> 0, 2654435761) >>> 0;
	}
	applyCommands(commands) {
		let blockedByDryShield = false;
		let buffPreserved = false;
		let buffFallback = null;
		let immediateBenefitProvided = false;
		for (const command of commands) switch (command.type) {
			case "set-status": {
				const outcome = this.setStatus(command.slot, command.status, immediateBenefitProvided);
				blockedByDryShield = outcome.blockedByDryShield || blockedByDryShield;
				buffPreserved = outcome.buffPreserved || buffPreserved;
				buffFallback = outcome.buffFallback ?? buffFallback;
				break;
			}
			case "clear-status":
				this.stateValue[command.slot] = null;
				break;
			case "set-hint":
				if (command.source === "lamp") this.stateValue.lampHintCableId = command.cableId;
				else this.stateValue.popcornHintCableId = command.cableId;
				break;
			case "heal":
				this.stateValue.currentLives = Math.min(this.stateValue.maxLives, this.stateValue.currentLives + command.amount);
				immediateBenefitProvided = true;
				break;
			case "increase-max-lives": {
				const previous = this.stateValue.maxLives;
				this.stateValue.maxLives = Math.min(6, this.stateValue.maxLives + command.amount);
				this.stateValue.currentLives = Math.min(this.stateValue.maxLives, this.stateValue.currentLives + Math.max(1, this.stateValue.maxLives - previous));
				immediateBenefitProvided = true;
				break;
			}
			case "set-printer-copy":
				this.stateValue.printerCopyReady = true;
				break;
			case "advance-timed-statuses":
				this.advanceExistingTurnStates(command.amount, false);
				break;
			case "normalize-timed-statuses":
				if (timed(this.stateValue.buff)) this.stateValue.buff.turnsRemaining = command.turns;
				if (timed(this.stateValue.debuff)) this.stateValue.debuff.turnsRemaining = command.turns;
				break;
			case "damage-or-remove-buff":
				if (this.stateValue.buff) this.stateValue.buff = null;
				else this.damage(command.amount);
				break;
			case "grant-continue":
				{
					const outcome = this.grantContinue();
					buffPreserved = outcome.buffPreserved || buffPreserved;
					buffFallback = outcome.buffFallback ?? buffFallback;
				}
				break;
			case "request-card-selection": this.pendingCards = [...command.cards];
		}
		if (blockedByDryShield) this.pendingDryShieldBlock = true;
		return {
			blockedByDryShield,
			buffPreserved,
			buffFallback
		};
	}
	setStatus(slot, next, immediateBenefitProvided = false) {
		if (slot === "debuff") {
			if (this.stateValue.debuff) return {
				blockedByDryShield: false,
				buffPreserved: false,
				buffFallback: null
			};
			if (this.stateValue.buff?.id === "dry-shield") {
				this.stateValue.buff = null;
				return {
					blockedByDryShield: true,
					buffPreserved: false,
					buffFallback: null
				};
			}
			this.stateValue.debuff = {
				...next,
				targetCableIds: [...next.targetCableIds],
				payload: { ...next.payload }
			};
			return {
				blockedByDryShield: false,
				buffPreserved: false,
				buffFallback: null
			};
		}
		if (next.id === "continue" && this.stateValue.buff?.id === "continue") {
			const current = Number(this.stateValue.buff.payload.restoreLives ?? 1);
			this.stateValue.buff.payload.restoreLives = Math.min(this.stateValue.maxLives, current + 1);
			return {
				blockedByDryShield: false,
				buffPreserved: false,
				buffFallback: null
			};
		}
		if (this.stateValue.buff) return {
			blockedByDryShield: false,
			buffPreserved: true,
			buffFallback: this.rewardPreservedBuff(!immediateBenefitProvided)
		};
		this.stateValue.buff = {
			...next,
			targetCableIds: [...next.targetCableIds],
			payload: { ...next.payload }
		};
		return {
			blockedByDryShield: false,
			buffPreserved: false,
			buffFallback: null
		};
	}
	grantContinue() {
		if (this.stateValue.reviveUsedThisChallenge) {
			this.stateValue.currentLives = Math.min(this.stateValue.maxLives, this.stateValue.currentLives + 1);
			return {
				buffPreserved: false,
				buffFallback: null
			};
		}
		if (this.stateValue.buff?.id === "continue") {
			const restoreLives = Number(this.stateValue.buff.payload.restoreLives ?? 1);
			this.stateValue.buff.payload.restoreLives = Math.min(this.stateValue.maxLives, restoreLives + 1);
			return {
				buffPreserved: false,
				buffFallback: null
			};
		}
		if (this.stateValue.buff) return {
			buffPreserved: true,
			buffFallback: this.rewardPreservedBuff(true)
		};
		this.stateValue.buff = status("continue", "game-controller", null, [], this.stateValue.skillEventIndex, { restoreLives: 1 });
		return {
			buffPreserved: false,
			buffFallback: null
		};
	}
	rewardPreservedBuff(allowHeal) {
		const current = this.stateValue.buff;
		if (current.turnsRemaining !== null) {
			current.turnsRemaining += 1;
			return {
				type: "extend-buff",
				amount: 1
			};
		}
		if (current.id === "continue") {
			const restoreLives = Number(current.payload.restoreLives ?? 1);
			current.payload.restoreLives = Math.min(this.stateValue.maxLives, restoreLives + 1);
			return {
				type: "upgrade-continue",
				amount: 1
			};
		}
		if (!allowHeal) return {
			type: "heal",
			amount: 0
		};
		const extraBlocks = Math.max(0, Number(current.payload.extraBlocks ?? 0));
		current.payload.extraBlocks = extraBlocks + 1;
		return {
			type: "add-shield-charge",
			amount: 1
		};
	}
	advanceExistingTurnStates(amount, deferMicrowave) {
		this.stateValue.buff = this.advanceStatus(this.stateValue.buff, amount);
		if (!(deferMicrowave && this.stateValue.debuff?.id === "overheated-plug")) this.stateValue.debuff = this.advanceStatus(this.stateValue.debuff, amount);
	}
	advanceStatus(instance, amount) {
		if (!instance || instance.turnsRemaining === null) return instance;
		const nextTurns = Math.max(0, instance.turnsRemaining - amount);
		if (instance.id === "coffee-lock" && nextTurns === 0) return {
			...instance,
			turnsRemaining: 0
		};
		return nextTurns === 0 ? null : {
			...instance,
			turnsRemaining: nextTurns
		};
	}
	advanceMicrowave(amount) {
		const microwave = this.stateValue.debuff;
		if (microwave?.id !== "overheated-plug" || microwave.turnsRemaining === null) return null;
		const remaining = microwave.turnsRemaining - amount;
		if (remaining > 0) {
			microwave.turnsRemaining = remaining;
			return null;
		}
		this.stateValue.debuff = null;
		return {
			source: "microwave",
			amount: 1,
			...this.damage(1)
		};
	}
	damage(amount) {
		this.stateValue.currentLives = Math.max(0, this.stateValue.currentLives - amount);
		if (this.stateValue.currentLives > 0) return {
			lives: this.stateValue.currentLives,
			failed: false,
			revived: false
		};
		if (this.stateValue.buff?.id === "continue" && !this.stateValue.reviveUsedThisChallenge) {
			const restoreLives = Math.max(1, Number(this.stateValue.buff.payload.restoreLives ?? 1));
			this.stateValue.buff = null;
			this.stateValue.reviveUsedThisChallenge = true;
			this.stateValue.currentLives = Math.min(this.stateValue.maxLives, restoreLives);
			return {
				lives: this.stateValue.currentLives,
				failed: false,
				revived: true
			};
		}
		this.stateValue.phase = "failed";
		return {
			lives: 0,
			failed: true,
			revived: false
		};
	}
	removeCableReferences(cableId) {
		if (this.stateValue.lampHintCableId === cableId) this.stateValue.lampHintCableId = null;
		if (this.stateValue.popcornHintCableId === cableId) this.stateValue.popcornHintCableId = null;
		if (!this.stateValue.debuff?.targetCableIds.includes(cableId)) return;
		const targets = this.stateValue.debuff.targetCableIds.filter((id) => id !== cableId);
		if ((this.stateValue.debuff.id === "fake-double-plug" || this.stateValue.debuff.id === "frozen-plug" || this.stateValue.debuff.id === "overheated-plug") && targets.length === 0) {
			this.stateValue.debuff = null;
			return;
		}
		this.stateValue.debuff = {
			...this.stateValue.debuff,
			targetCableIds: targets
		};
	}
};
//#endregion
//#region src/skill/SkillCardPresentation.ts
var SKILL_CARD_VISUALS = {
	"lamp-hint": {
		icon: "hint",
		palette: [
			"#ffd86f",
			"#ff9fb5",
			"#fff7dc"
		]
	},
	"bathroom-steam": {
		icon: "steam",
		palette: [
			"#91b8d8",
			"#c9b3db",
			"#f5f1ef"
		]
	},
	"clear-steam": {
		icon: "wind",
		palette: [
			"#77dcd5",
			"#96bfff",
			"#fff7dc"
		]
	},
	dehumidify: {
		icon: "shield",
		palette: [
			"#65d4d2",
			"#7ca8ff",
			"#e8fff9"
		]
	},
	"freeze-plugs": {
		icon: "freeze",
		palette: [
			"#87c9ff",
			"#a9e9ef",
			"#f4ffff"
		]
	},
	"hair-dryer-branch": {
		icon: "heat-branch",
		palette: [
			"#ff8f67",
			"#86cfff",
			"#fff0ba"
		]
	},
	"spin-remove": {
		icon: "spin",
		palette: [
			"#74ddd3",
			"#ff9fbd",
			"#fff0c9"
		]
	},
	"bubble-shield": {
		icon: "bubble",
		palette: [
			"#77ddd8",
			"#f8a5cf",
			"#fff08c"
		]
	},
	"glitch-reconstruct": {
		icon: "glitch",
		palette: [
			"#f47ca9",
			"#68d4d0",
			"#fff073"
		]
	},
	"route-broadcast": {
		icon: "route",
		palette: [
			"#f49ab8",
			"#6ed7d0",
			"#fff1a8"
		]
	},
	"swap-ends": {
		icon: "swap",
		palette: [
			"#f7a064",
			"#75d1d0",
			"#ffe3a0"
		]
	},
	"steam-thaw": {
		icon: "thaw",
		palette: [
			"#ff9f72",
			"#7fd9e0",
			"#fff2bc"
		]
	},
	"coffee-lock": {
		icon: "coffee",
		palette: [
			"#9a5c3d",
			"#d98a55",
			"#ffe3b8"
		]
	},
	"snapshot-sweep": {
		icon: "sweep",
		palette: [
			"#6fd8d1",
			"#ef8fb5",
			"#fff3be"
		]
	},
	"rice-thick-cable": {
		icon: "thick",
		palette: [
			"#fff0b1",
			"#d8a96b",
			"#fffaf0"
		]
	},
	"color-shuffle": {
		icon: "shuffle",
		palette: [
			"#f88bac",
			"#73d6cf",
			"#ffd96d"
		]
	},
	"printer-copy": {
		icon: "copy",
		palette: [
			"#8ac4ff",
			"#f39ab8",
			"#fff3cf"
		]
	},
	"soothing-record": {
		icon: "record",
		palette: [
			"#f58dab",
			"#83d9d2",
			"#fff0a6"
		]
	},
	"time-fast-forward": {
		icon: "fast-forward",
		palette: [
			"#ffb36b",
			"#8eb7ff",
			"#fff0b5"
		]
	},
	"popcorn-meal": {
		icon: "popcorn",
		palette: [
			"#ffd76b",
			"#f48da9",
			"#fff5d7"
		]
	},
	"normalize-statuses": {
		icon: "normalize",
		palette: [
			"#d995d5",
			"#76d4cc",
			"#fff1aa"
		]
	},
	"continue-game": {
		icon: "continue",
		palette: [
			"#8ab6ff",
			"#f08fb9",
			"#fff1b4"
		]
	},
	"timed-meal": {
		icon: "timer",
		palette: [
			"#ff866f",
			"#ffd36d",
			"#fff0c5"
		]
	},
	"blue-screen": {
		icon: "blue-screen",
		palette: [
			"#5d82da",
			"#8eb8ff",
			"#e5f2ff"
		]
	},
	"induction-reveal": {
		icon: "reveal",
		palette: [
			"#71d9d0",
			"#ffd570",
			"#eefcff"
		]
	},
	"bass-spacing": {
		icon: "bass",
		palette: [
			"#81b9ff",
			"#6ed8d0",
			"#fff09e"
		]
	},
	"recycle-cable": {
		icon: "recycle",
		palette: [
			"#70d4b6",
			"#ffd56c",
			"#eafff7"
		]
	},
	"fake-double-plug": {
		icon: "double-plug",
		palette: [
			"#af7ad9",
			"#f39cbf",
			"#f6ebff"
		]
	}
};
var ICON_ART = {
	hint: "<circle class=\"skill-icon-fill skill-icon-primary\" cx=\"80\" cy=\"78\" r=\"34\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"80\" cy=\"78\" r=\"14\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M80 26v14M80 116v16M28 78h14M118 78h14\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"m80 17 7 13 15 3-11 10 2 15-13-7-13 7 2-15-11-10 15-3Z\"/>",
	steam: "<path class=\"skill-icon-line\" d=\"M43 118c-19-23 18-29 1-53-10-15 1-27 12-34M79 122c-18-25 20-31 2-58-9-14 0-27 12-37M113 115c-15-20 17-28 3-49-8-12-1-22 8-30\"/>",
	wind: "<path class=\"skill-icon-line\" d=\"M25 55h69c25 0 25-31 3-31-12 0-18 7-19 15M31 82h90c26 0 25 32 1 32-13 0-20-8-20-17M23 108h51\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"29\" cy=\"82\" r=\"8\"/>",
	shield: "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M80 20c20 15 37 16 49 19v35c0 35-21 54-49 67-28-13-49-32-49-67V39c12-3 29-4 49-19Z\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M80 51c15 19 20 27 20 37a20 20 0 0 1-40 0c0-10 5-18 20-37Z\"/>",
	freeze: "<path class=\"skill-icon-line\" d=\"M80 18v124M27 49l106 62M27 111l106-62M64 31l16 14 16-14M64 129l16-14 16 14M31 69l21-6-5-21M129 91l-21 6 5 21M31 91l21 6-5 21M129 69l-21-6 5-21\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"80\" cy=\"80\" r=\"14\"/>",
	"heat-branch": "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M52 132c-19-15-18-35-4-49 8-8 11-17 8-32 24 14 38 35 34 53-4 21-21 35-38 28Z\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M101 31v58M76 45l50 30M76 75l50-30\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"m100 30 1 14 11-8M101 89l-1-14-11 8\"/>",
	spin: "<path class=\"skill-icon-line\" d=\"M36 68c7-25 31-40 56-35 12 2 21 8 28 16\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"m116 34 18 20-27 4Z\"/><path class=\"skill-icon-line\" d=\"M124 93c-8 24-32 38-57 33-11-2-20-7-27-15\"/><path class=\"skill-icon-fill skill-icon-primary\" d=\"m43 126-18-20 27-4Z\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"60\" cy=\"78\" r=\"12\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"101\" cy=\"83\" r=\"12\"/>",
	glitch: "<path class=\"skill-icon-line skill-icon-heavy\" d=\"M28 119 52 92l23 12 22-42 35-19\"/><path class=\"skill-icon-fill skill-icon-primary\" d=\"M18 107h25v27H18zM63 91h26v27H63zM116 28h27v28h-27z\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"m92 42 20 7-14 16Z\"/>",
	route: "<path class=\"skill-icon-line\" d=\"M29 116c18-33 39-7 55-34 14-24 30-14 47-40\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"29\" cy=\"116\" r=\"12\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"83\" cy=\"83\" r=\"12\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"131\" cy=\"42\" r=\"12\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M18 88c12-10 26-10 38 0M9 72c18-17 41-17 59 0\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"m123 25 27 9-21 19Z\"/>",
	swap: "<path class=\"skill-icon-line\" d=\"M29 55h76l-15-15M105 55 90 70M131 105H55l15 15M55 105l15-15\"/><path class=\"skill-icon-fill skill-icon-primary\" d=\"M19 43h17v24H19z\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M124 93h17v24h-17z\"/>",
	thaw: "<circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"79\" cy=\"96\" r=\"34\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"m64 78 14 15-8 11 18 15M46 48c-13-17 13-22 2-39M78 48c-13-17 13-22 2-39M110 48c-13-17 13-22 2-39\"/>",
	coffee: "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M35 100c-12-24 7-49 31-46 7-23 39-26 51-7 24-5 39 18 28 38 13 24-11 47-34 36-15 20-45 14-51-8-12 7-27 1-25-13Z\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"31\" cy=\"54\" r=\"10\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"121\" cy=\"25\" r=\"8\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"141\" cy=\"116\" r=\"11\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M57 73h47v46H57z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M67 73V60c0-18 27-18 27 0v13\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"80\" cy=\"94\" r=\"6\"/>",
	sweep: "<path class=\"skill-icon-line skill-icon-thin\" d=\"M24 52V29h25M136 52V29h-25M24 108v23h25M136 108v23h-25\"/><path class=\"skill-icon-line skill-icon-heavy\" d=\"M31 92c26 25 61 28 92 8\"/><path class=\"skill-icon-fill skill-icon-primary\" d=\"m113 83 32 11-24 24Z\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"48\" cy=\"68\" r=\"10\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"75\" cy=\"77\" r=\"8\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"99\" cy=\"71\" r=\"6\"/>",
	thick: "<path class=\"skill-icon-line skill-icon-heavy\" d=\"M31 102c7-42 38-62 71-41 20 13 18 39 35 48\"/><path class=\"skill-icon-fill skill-icon-primary\" d=\"M17 88h29v35H17z\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M122 94h23v31h-23z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M24 77v11M38 77v11M129 83v11M140 83v11\"/>",
	shuffle: "<path class=\"skill-icon-line\" d=\"M45 43h70l-8 82H53Z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M58 78c18-17 47-8 47 12 0 18-24 27-38 15-12-10-5-27 8-28 10-1 16 10 10 17\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"51\" cy=\"27\" r=\"12\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"82\" cy=\"23\" r=\"12\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"113\" cy=\"28\" r=\"12\"/>",
	copy: "<path class=\"skill-icon-fill skill-icon-secondary\" d=\"M39 28h66v80H39z\"/><path class=\"skill-icon-fill skill-icon-primary\" d=\"M57 50h66v80H57z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M72 75h34M72 92h34M72 109h22\"/><path class=\"skill-icon-line\" d=\"m31 120 18 14 18-14\"/>",
	record: "<circle class=\"skill-icon-fill skill-icon-primary\" cx=\"75\" cy=\"79\" r=\"52\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"75\" cy=\"79\" r=\"18\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"75\" cy=\"79\" r=\"7\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M119 43c17-18 42 7 13 33-29-26-4-51 13-33Z\"/>",
	"fast-forward": "<circle class=\"skill-icon-fill skill-icon-primary\" cx=\"72\" cy=\"82\" r=\"52\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M72 49v35l23 16\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"m105 55 24 25-24 25zM128 55l24 25-24 25z\"/>",
	popcorn: "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M48 68h65l-8 67H56Z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M64 72l7 59M96 72l-6 59\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"52\" cy=\"57\" r=\"20\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"79\" cy=\"47\" r=\"23\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"105\" cy=\"57\" r=\"20\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M128 24v31M113 39h30\"/>",
	normalize: "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M22 35h27v23H22zM22 69h43v23H22zM22 103h61v23H22z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M86 46h20M86 80h20M86 114h20\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"m98 32 24 14-24 14Zm0 34 24 14-24 14Zm0 34 24 14-24 14Z\"/><path class=\"skill-icon-fill skill-icon-highlight\" d=\"M124 35h20v22h-20zM124 69h20v22h-20zM124 103h20v22h-20z\"/>",
	continue: "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M80 132C23 96 25 51 52 43c18-6 28 7 28 7s10-13 28-7c27 8 29 53-28 89Z\"/><path class=\"skill-icon-line\" d=\"M80 104V60M61 79l19-19 19 19\"/>",
	timer: "<circle class=\"skill-icon-fill skill-icon-primary\" cx=\"80\" cy=\"82\" r=\"51\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M80 82V52M80 82l25 17M62 18h36\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M33 105h20v26H33z\"/>",
	"blue-screen": "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M24 31h112v82H24z\"/><path class=\"skill-icon-line\" d=\"m53 55 54 38M107 55 53 93M57 132h46\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"41\" cy=\"46\" r=\"6\"/>",
	reveal: "<circle class=\"skill-icon-line\" cx=\"80\" cy=\"80\" r=\"54\"/><circle class=\"skill-icon-line skill-icon-thin\" cx=\"80\" cy=\"80\" r=\"35\"/><circle class=\"skill-icon-fill skill-icon-primary\" cx=\"80\" cy=\"80\" r=\"12\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"80\" cy=\"26\" r=\"8\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"127\" cy=\"106\" r=\"8\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"33\" cy=\"106\" r=\"8\"/>",
	bass: "<circle class=\"skill-icon-fill skill-icon-primary\" cx=\"55\" cy=\"80\" r=\"28\"/><circle class=\"skill-icon-fill skill-icon-highlight\" cx=\"55\" cy=\"80\" r=\"10\"/><path class=\"skill-icon-line\" d=\"M91 54c19 15 19 37 0 52M111 37c34 26 34 60 0 86\"/><circle class=\"skill-icon-fill skill-icon-secondary\" cx=\"143\" cy=\"80\" r=\"9\"/>",
	recycle: "<path class=\"skill-icon-fill skill-icon-primary\" d=\"M48 65h64l-7 66H55Z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M42 53h76M64 53l7-18h18l7 18M69 78v34M91 78v34\"/><path class=\"skill-icon-line skill-icon-heavy\" d=\"M20 39c24 3 43 14 55 31\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"m68 54 22 20-29 6Z\"/><path class=\"skill-icon-fill skill-icon-highlight\" d=\"M13 25h25v24H13z\"/>",
	"double-plug": "<path class=\"skill-icon-line skill-icon-heavy\" d=\"M40 80c23-25 57-25 80 0\"/><path class=\"skill-icon-fill skill-icon-primary\" d=\"M14 63h32v34H14z\"/><path class=\"skill-icon-fill skill-icon-secondary\" d=\"M114 63h32v34h-32z\"/><path class=\"skill-icon-line skill-icon-thin\" d=\"M20 51v12M38 51v12M122 51v12M140 51v12\"/>"
};
var FALLBACK_VISUAL = {
	icon: "hint",
	palette: [
		"#ffd86f",
		"#ff9fb5",
		"#fff7dc"
	]
};
var APPLIANCE_LABELS = new Map(APPLIANCE_CATALOG.map((definition) => [definition.id, definition.label]));
var GACHA_TIER_LABELS = {
	"normal-benefit": "收益卡",
	"strong-benefit": "强收益",
	"normal-risk": "风险卡",
	"strong-risk": "强风险"
};
function getSkillCardVisual(skillId) {
	return SKILL_CARD_VISUALS[skillId] ?? FALLBACK_VISUAL;
}
function getApplianceCardLabel(appliance) {
	return APPLIANCE_LABELS.get(appliance) ?? appliance;
}
function getSkillCardStyle(skillId) {
	const [primary, secondary, highlight] = getSkillCardVisual(skillId).palette;
	return `--skill-symbol-primary:${primary};--skill-symbol-secondary:${secondary};--skill-symbol-highlight:${highlight}`;
}
function renderSkillCardSymbol(skillId) {
	const visual = getSkillCardVisual(skillId);
	if (visual.icon === "bubble") return "<span class=\"skill-card-bubble\"><span class=\"skill-card-bubble__glint\"></span><span class=\"skill-card-bubble__orbit\"></span></span>";
	return `<svg class="skill-card-symbol-svg skill-card-symbol-svg--${visual.icon}" viewBox="0 0 160 160" aria-hidden="true">${ICON_ART[visual.icon]}</svg>`;
}
function getSkillCardPreviewDefinitions() {
	return [...APPLIANCE_SKILL_REGISTRY.values()].filter((definition) => definition.appliance !== "gumball-machine").map((definition) => ({
		skillId: definition.id,
		appliance: definition.appliance,
		applianceLabel: getApplianceCardLabel(definition.appliance),
		label: definition.label,
		description: definition.description,
		polarity: definition.polarity
	}));
}
//#endregion
export { renderSkillCardSymbol as a, pickPrinterCopyCableId as c, getSkillCardStyle as i, getApplianceCardLabel as n, APPLIANCE_SKILL_REGISTRY as o, getSkillCardPreviewDefinitions as r, SkillChallengeEngine as s, GACHA_TIER_LABELS as t };
