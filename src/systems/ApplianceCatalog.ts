import type { PlugStyleId } from '../render/PlugParts';

export type ApplianceState = 'idle' | 'connected' | 'active' | 'inflating' | 'hidden' | 'spawning';
export type ApplianceSizeTier = 'S' | 'M' | 'L' | 'XL';
export type ApplianceKind =
  | 'lamp' | 'fan' | 'radio' | 'television' | 'humidifier' | 'toaster'
  | 'refrigerator' | 'washer' | 'microwave' | 'coffee-maker' | 'kettle'
  | 'rice-cooker' | 'phone' | 'robot-vacuum'
  | 'bubble-machine' | 'gumball-machine' | 'popcorn-machine'
  | 'alarm-clock' | 'smart-bin' | 'record-player' | 'stand-mixer'
  | 'printer' | 'induction-cooktop' | 'blender' | 'dehumidifier'
  | 'portable-speaker' | 'hair-dryer' | 'desktop-computer' | 'game-controller';

export type ApplianceDefinition = {
  id: ApplianceKind;
  label: string;
  sizeTier: ApplianceSizeTier;
  plugStyleId: PlugStyleId;
  targetScreenHeight: number;
  referencePath: string | null;
};

export type ActiveApplianceLayout = {
  definition: ApplianceDefinition;
  color: number;
  side: 'left' | 'right';
  screen: readonly [number, number];
};

const ref = (id: string): string => `references/intake/${id}/front.png`;

export const APPLIANCE_CATALOG: readonly ApplianceDefinition[] = [
  { id: 'lamp', label: '\u53f0\u706f', sizeTier: 'M', plugStyleId: 'round-two-pin', targetScreenHeight: 0.145, referencePath: null },
  { id: 'fan', label: '\u98ce\u6247', sizeTier: 'M', plugStyleId: 'round-two-pin', targetScreenHeight: 0.145, referencePath: null },
  { id: 'radio', label: '\u6536\u97f3\u673a', sizeTier: 'S', plugStyleId: 'dc-barrel', targetScreenHeight: 0.105, referencePath: null },
  { id: 'television', label: '\u7535\u89c6\u673a', sizeTier: 'L', plugStyleId: 'dc-barrel', targetScreenHeight: 0.2, referencePath: null },
  { id: 'humidifier', label: '\u52a0\u6e7f\u5668', sizeTier: 'M', plugStyleId: 'usb-c', targetScreenHeight: 0.145, referencePath: null },
  { id: 'toaster', label: '\u70e4\u9762\u5305\u673a', sizeTier: 'S', plugStyleId: 'flat-two-blade', targetScreenHeight: 0.105, referencePath: null },
  { id: 'refrigerator', label: '\u51b0\u7bb1', sizeTier: 'XL', plugStyleId: 'three-pin', targetScreenHeight: 0.28, referencePath: null },
  { id: 'washer', label: '\u6d17\u8863\u673a', sizeTier: 'L', plugStyleId: 'three-pin', targetScreenHeight: 0.2, referencePath: null },
  { id: 'microwave', label: '\u5fae\u6ce2\u7089', sizeTier: 'M', plugStyleId: 'three-pin', targetScreenHeight: 0.145, referencePath: null },
  { id: 'coffee-maker', label: '\u5496\u5561\u673a', sizeTier: 'M', plugStyleId: 'flat-two-blade', targetScreenHeight: 0.145, referencePath: null },
  { id: 'kettle', label: '\u7535\u70ed\u6c34\u58f6', sizeTier: 'S', plugStyleId: 'grounded-round', targetScreenHeight: 0.105, referencePath: null },
  { id: 'rice-cooker', label: '\u7535\u996d\u7172', sizeTier: 'M', plugStyleId: 'grounded-round', targetScreenHeight: 0.145, referencePath: null },
  { id: 'phone', label: '\u624b\u673a', sizeTier: 'S', plugStyleId: 'usb-c', targetScreenHeight: 0.105, referencePath: null },
  { id: 'robot-vacuum', label: '\u626b\u5730\u673a\u5668\u4eba', sizeTier: 'S', plugStyleId: 'magnetic-pogo', targetScreenHeight: 0.105, referencePath: null },
  { id: 'bubble-machine', label: '\u6ce1\u6ce1\u673a', sizeTier: 'M', plugStyleId: 'round-two-pin', targetScreenHeight: 0.145, referencePath: ref('bubble-machine') },
  { id: 'gumball-machine', label: '\u626d\u86cb\u673a', sizeTier: 'M', plugStyleId: 'grounded-round', targetScreenHeight: 0.145, referencePath: ref('gumball-machine') },
  { id: 'popcorn-machine', label: '\u7206\u7c73\u82b1\u673a', sizeTier: 'L', plugStyleId: 'three-pin', targetScreenHeight: 0.2, referencePath: ref('popcorn-machine') },
  { id: 'alarm-clock', label: '\u95f9\u949f', sizeTier: 'S', plugStyleId: 'usb-c', targetScreenHeight: 0.105, referencePath: ref('alarm-clock') },
  { id: 'smart-bin', label: '\u667a\u80fd\u5783\u573e\u6876', sizeTier: 'M', plugStyleId: 'usb-c', targetScreenHeight: 0.145, referencePath: ref('smart-bin') },
  { id: 'record-player', label: '\u5531\u7247\u673a', sizeTier: 'M', plugStyleId: 'flat-two-blade', targetScreenHeight: 0.145, referencePath: ref('record-player') },
  { id: 'stand-mixer', label: '\u53a8\u5e08\u673a', sizeTier: 'L', plugStyleId: 'grounded-round', targetScreenHeight: 0.2, referencePath: ref('stand-mixer') },
  { id: 'printer', label: '\u6253\u5370\u673a', sizeTier: 'M', plugStyleId: 'three-pin', targetScreenHeight: 0.145, referencePath: ref('printer') },
  { id: 'induction-cooktop', label: '\u7535\u78c1\u7089', sizeTier: 'M', plugStyleId: 'three-pin', targetScreenHeight: 0.145, referencePath: ref('induction-cooktop') },
  { id: 'blender', label: '\u6405\u62cc\u673a', sizeTier: 'M', plugStyleId: 'flat-two-blade', targetScreenHeight: 0.145, referencePath: ref('blender') },
  { id: 'dehumidifier', label: '\u9664\u6e7f\u673a', sizeTier: 'L', plugStyleId: 'three-pin', targetScreenHeight: 0.2, referencePath: ref('dehumidifier') },
  { id: 'portable-speaker', label: '\u4fbf\u643a\u97f3\u7bb1', sizeTier: 'M', plugStyleId: 'usb-c', targetScreenHeight: 0.145, referencePath: ref('portable-speaker') },
  { id: 'hair-dryer', label: '\u5439\u98ce\u673a', sizeTier: 'S', plugStyleId: 'flat-two-blade', targetScreenHeight: 0.105, referencePath: ref('hair-dryer') },
  { id: 'desktop-computer', label: '\u53f0\u5f0f\u7535\u8111', sizeTier: 'L', plugStyleId: 'three-pin', targetScreenHeight: 0.2, referencePath: ref('desktop-computer') },
  { id: 'game-controller', label: '\u6e38\u620f\u624b\u67c4', sizeTier: 'S', plugStyleId: 'usb-c', targetScreenHeight: 0.105, referencePath: ref('game-controller') },
];

const BY_ID = new Map(APPLIANCE_CATALOG.map((definition) => [definition.id, definition]));
const LARGE_POOL: readonly ApplianceKind[] = ['refrigerator', 'washer', 'television', 'popcorn-machine', 'stand-mixer', 'dehumidifier', 'desktop-computer'];
const MEDIUM_POOL: readonly ApplianceKind[] = ['microwave', 'fan', 'bubble-machine', 'lamp', 'humidifier', 'coffee-maker', 'rice-cooker', 'gumball-machine', 'smart-bin', 'record-player', 'printer', 'induction-cooktop', 'blender', 'portable-speaker'];
const SMALL_POOL: readonly ApplianceKind[] = ['radio', 'toaster', 'robot-vacuum', 'kettle', 'phone', 'alarm-clock', 'hair-dryer', 'game-controller'];
const TUTORIAL_POOL: readonly ApplianceKind[] = ['lamp', 'fan', 'radio', 'toaster', 'kettle'];

function definition(id: ApplianceKind): ApplianceDefinition {
  const result = BY_ID.get(id);
  if (!result) throw new Error(`Missing appliance definition: ${id}`);
  return result;
}

function rotatedSelection(pool: readonly ApplianceKind[], start: number, count: number): ApplianceDefinition[] {
  return Array.from({ length: count }, (_, index) => definition(pool[(start + index) % pool.length]));
}

export function selectAppliancesForSeed(seed: number): ApplianceDefinition[] {
  const normalized = seed >>> 0;
  const largeStart = Math.imul(normalized ^ (normalized >>> 16), 0x45d9f3b) >>> 0;
  const mediumStart = Math.imul(normalized ^ (normalized >>> 11), 0x27d4eb2d) >>> 0;
  const smallStart = Math.imul(normalized ^ (normalized >>> 7), 0x165667b1) >>> 0;
  return [
    ...rotatedSelection(LARGE_POOL, largeStart % LARGE_POOL.length, 2),
    ...rotatedSelection(MEDIUM_POOL, mediumStart % MEDIUM_POOL.length, 4),
    ...rotatedSelection(SMALL_POOL, smallStart % SMALL_POOL.length, 2),
  ];
}

export function selectTutorialAppliances(count = TUTORIAL_POOL.length): ApplianceDefinition[] {
  return TUTORIAL_POOL.slice(0, Math.max(1, Math.min(TUTORIAL_POOL.length, count))).map(definition);
}

export function applianceCatalogSummary(): Array<{ id: ApplianceKind; sizeTier: ApplianceSizeTier; plugStyleId: PlugStyleId }> {
  return APPLIANCE_CATALOG.map(({ id, sizeTier, plugStyleId }) => ({ id, sizeTier, plugStyleId }));
}

/** An authored cast of appliances for each campaign chapter. */
export function selectCampaignAppliances(ids: readonly ApplianceKind[], count: number): ApplianceDefinition[] {
  return ids.slice(0, Math.max(1, Math.min(ids.length, count))).map(definition);
}
