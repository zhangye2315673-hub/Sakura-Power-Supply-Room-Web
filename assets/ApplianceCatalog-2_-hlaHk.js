//#region src/systems/ApplianceCatalog.ts
var ref = (id) => `references/intake/${id}/front.png`;
var APPLIANCE_CATALOG = [
	{
		id: "lamp",
		label: "台灯",
		sizeTier: "M",
		plugStyleId: "round-two-pin",
		targetScreenHeight: .145,
		referencePath: null
	},
	{
		id: "fan",
		label: "风扇",
		sizeTier: "M",
		plugStyleId: "round-two-pin",
		targetScreenHeight: .145,
		referencePath: null
	},
	{
		id: "radio",
		label: "收音机",
		sizeTier: "S",
		plugStyleId: "dc-barrel",
		targetScreenHeight: .105,
		referencePath: null
	},
	{
		id: "television",
		label: "电视机",
		sizeTier: "L",
		plugStyleId: "dc-barrel",
		targetScreenHeight: .2,
		referencePath: null
	},
	{
		id: "humidifier",
		label: "加湿器",
		sizeTier: "M",
		plugStyleId: "usb-c",
		targetScreenHeight: .145,
		referencePath: null
	},
	{
		id: "toaster",
		label: "烤面包机",
		sizeTier: "S",
		plugStyleId: "flat-two-blade",
		targetScreenHeight: .105,
		referencePath: null
	},
	{
		id: "refrigerator",
		label: "冰箱",
		sizeTier: "XL",
		plugStyleId: "three-pin",
		targetScreenHeight: .28,
		referencePath: null
	},
	{
		id: "washer",
		label: "洗衣机",
		sizeTier: "L",
		plugStyleId: "three-pin",
		targetScreenHeight: .2,
		referencePath: null
	},
	{
		id: "microwave",
		label: "微波炉",
		sizeTier: "M",
		plugStyleId: "three-pin",
		targetScreenHeight: .145,
		referencePath: null
	},
	{
		id: "coffee-maker",
		label: "咖啡机",
		sizeTier: "M",
		plugStyleId: "flat-two-blade",
		targetScreenHeight: .145,
		referencePath: null
	},
	{
		id: "kettle",
		label: "电热水壶",
		sizeTier: "S",
		plugStyleId: "grounded-round",
		targetScreenHeight: .105,
		referencePath: null
	},
	{
		id: "rice-cooker",
		label: "电饭煲",
		sizeTier: "M",
		plugStyleId: "grounded-round",
		targetScreenHeight: .145,
		referencePath: null
	},
	{
		id: "phone",
		label: "手机",
		sizeTier: "S",
		plugStyleId: "usb-c",
		targetScreenHeight: .105,
		referencePath: null
	},
	{
		id: "robot-vacuum",
		label: "扫地机器人",
		sizeTier: "S",
		plugStyleId: "magnetic-pogo",
		targetScreenHeight: .105,
		referencePath: null
	},
	{
		id: "bubble-machine",
		label: "泡泡机",
		sizeTier: "M",
		plugStyleId: "round-two-pin",
		targetScreenHeight: .145,
		referencePath: ref("bubble-machine")
	},
	{
		id: "gumball-machine",
		label: "扭蛋机",
		sizeTier: "M",
		plugStyleId: "grounded-round",
		targetScreenHeight: .145,
		referencePath: ref("gumball-machine")
	},
	{
		id: "popcorn-machine",
		label: "爆米花机",
		sizeTier: "L",
		plugStyleId: "three-pin",
		targetScreenHeight: .2,
		referencePath: ref("popcorn-machine")
	},
	{
		id: "alarm-clock",
		label: "闹钟",
		sizeTier: "S",
		plugStyleId: "usb-c",
		targetScreenHeight: .105,
		referencePath: ref("alarm-clock")
	},
	{
		id: "smart-bin",
		label: "智能垃圾桶",
		sizeTier: "M",
		plugStyleId: "usb-c",
		targetScreenHeight: .145,
		referencePath: ref("smart-bin")
	},
	{
		id: "record-player",
		label: "唱片机",
		sizeTier: "M",
		plugStyleId: "flat-two-blade",
		targetScreenHeight: .145,
		referencePath: ref("record-player")
	},
	{
		id: "stand-mixer",
		label: "厨师机",
		sizeTier: "L",
		plugStyleId: "grounded-round",
		targetScreenHeight: .2,
		referencePath: ref("stand-mixer")
	},
	{
		id: "printer",
		label: "打印机",
		sizeTier: "M",
		plugStyleId: "three-pin",
		targetScreenHeight: .145,
		referencePath: ref("printer")
	},
	{
		id: "induction-cooktop",
		label: "电磁炉",
		sizeTier: "M",
		plugStyleId: "three-pin",
		targetScreenHeight: .145,
		referencePath: ref("induction-cooktop")
	},
	{
		id: "blender",
		label: "搅拌机",
		sizeTier: "M",
		plugStyleId: "flat-two-blade",
		targetScreenHeight: .145,
		referencePath: ref("blender")
	},
	{
		id: "dehumidifier",
		label: "除湿机",
		sizeTier: "L",
		plugStyleId: "three-pin",
		targetScreenHeight: .2,
		referencePath: ref("dehumidifier")
	},
	{
		id: "portable-speaker",
		label: "便携音箱",
		sizeTier: "M",
		plugStyleId: "usb-c",
		targetScreenHeight: .145,
		referencePath: ref("portable-speaker")
	},
	{
		id: "hair-dryer",
		label: "吹风机",
		sizeTier: "S",
		plugStyleId: "flat-two-blade",
		targetScreenHeight: .105,
		referencePath: ref("hair-dryer")
	},
	{
		id: "desktop-computer",
		label: "台式电脑",
		sizeTier: "L",
		plugStyleId: "three-pin",
		targetScreenHeight: .2,
		referencePath: ref("desktop-computer")
	},
	{
		id: "game-controller",
		label: "游戏手柄",
		sizeTier: "S",
		plugStyleId: "usb-c",
		targetScreenHeight: .105,
		referencePath: ref("game-controller")
	}
];
var BY_ID = new Map(APPLIANCE_CATALOG.map((definition) => [definition.id, definition]));
var LARGE_POOL = [
	"refrigerator",
	"washer",
	"television",
	"popcorn-machine",
	"stand-mixer",
	"dehumidifier",
	"desktop-computer"
];
var MEDIUM_POOL = [
	"microwave",
	"fan",
	"bubble-machine",
	"lamp",
	"humidifier",
	"coffee-maker",
	"rice-cooker",
	"gumball-machine",
	"smart-bin",
	"record-player",
	"printer",
	"induction-cooktop",
	"blender",
	"portable-speaker"
];
var SMALL_POOL = [
	"radio",
	"toaster",
	"robot-vacuum",
	"kettle",
	"phone",
	"alarm-clock",
	"hair-dryer",
	"game-controller"
];
var TUTORIAL_POOL = [
	"lamp",
	"fan",
	"radio",
	"toaster",
	"kettle"
];
function definition(id) {
	const result = BY_ID.get(id);
	if (!result) throw new Error(`Missing appliance definition: ${id}`);
	return result;
}
function rotatedSelection(pool, start, count) {
	return Array.from({ length: count }, (_, index) => definition(pool[(start + index) % pool.length]));
}
function selectAppliancesForSeed(seed) {
	const normalized = seed >>> 0;
	const largeStart = Math.imul(normalized ^ normalized >>> 16, 73244475) >>> 0;
	const mediumStart = Math.imul(normalized ^ normalized >>> 11, 668265261) >>> 0;
	const smallStart = Math.imul(normalized ^ normalized >>> 7, 374761393) >>> 0;
	return [
		...rotatedSelection(LARGE_POOL, largeStart % LARGE_POOL.length, 2),
		...rotatedSelection(MEDIUM_POOL, mediumStart % MEDIUM_POOL.length, 4),
		...rotatedSelection(SMALL_POOL, smallStart % SMALL_POOL.length, 2)
	];
}
function selectTutorialAppliances(count = TUTORIAL_POOL.length) {
	return TUTORIAL_POOL.slice(0, Math.max(1, Math.min(TUTORIAL_POOL.length, count))).map(definition);
}
function applianceCatalogSummary() {
	return APPLIANCE_CATALOG.map(({ id, sizeTier, plugStyleId }) => ({
		id,
		sizeTier,
		plugStyleId
	}));
}
//#endregion
export { selectTutorialAppliances as i, applianceCatalogSummary as n, selectAppliancesForSeed as r, APPLIANCE_CATALOG as t };
