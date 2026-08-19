import { APPLIANCE_CATALOG, type ApplianceDefinition, type ApplianceKind } from '../systems/ApplianceCatalog';
import { PAL } from '../style/palette';
import type { ArrowDefinition, LevelDefinition, PuzzleDefinition } from '../puzzle/types';
import type { SkillCommand } from './SkillChallengeEngine';

export type SkillTestId = 'lamp' | 'fan' | 'humidifier' | 'radio' | 'television' | 'toaster' | 'refrigerator' | 'washer';

export type SkillTestDefinition = Readonly<{
  id: SkillTestId;
  appliance: ApplianceKind;
  accent: number;
  level: LevelDefinition;
  applianceDefinition: ApplianceDefinition;
  initialCommands: readonly SkillCommand[];
}>;

const LAMP_TEST_SEED = 0x1a6f2026;
const LAMP_TEST_ACCENT = PAL.blue;
const FAN_TEST_SEED = 0xfa6f2026;
const FAN_TEST_ACCENT = PAL.teal;
const HUMIDIFIER_TEST_SEED = 0x8a6f2026;
const HUMIDIFIER_TEST_ACCENT = PAL.teal;
const RADIO_TEST_SEED = 0x7a6f2026;
const RADIO_TEST_ACCENT = PAL.blossomDeep;
const TELEVISION_TEST_SEED = 0x6a6f2026;
const TELEVISION_TEST_ACCENT = PAL.red;
const TOASTER_TEST_SEED = 0x5a6f2026;
const TOASTER_TEST_ACCENT = PAL.orange;
const REFRIGERATOR_TEST_SEED = 0x4a6f2026;
const REFRIGERATOR_TEST_ACCENT = PAL.blue;
const WASHER_TEST_SEED = 0x3a6f2026;
const WASHER_TEST_ACCENT = PAL.teal;

const LAMP_TEST_LEVEL: LevelDefinition = {
  id: 0,
  seed: LAMP_TEST_SEED,
  label: '台灯技能测试',
  shape: 'cube',
  difficulty: 'easy',
  targetCount: 4,
  lengthQuota: { short: 1, medium: 0, long: 0 },
  minInitiallyFree: 3,
  maxInitiallyFree: 3,
  boundaryHeadRatio: 0,
  halfExtents: [5, 5, 5],
  minSpans: [4, 4, 4],
  minNeighborRatio: 0,
  minDensity: 0,
  cameraRadius: 17.8,
  challengeKind: 'standard',
  referenceTargetCount: 4,
};

const LAMP_TEST_ARROWS: readonly ArrowDefinition[] = [
  {
    id: 'lamp-test-blocked',
    path: [[2, 5, 5], [3, 5, 5], [4, 5, 5]],
    exitDirection: '+X',
    color: LAMP_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'lamp-test-key',
    path: [[6, 4, 5], [6, 5, 5], [6, 6, 5]],
    exitDirection: '+Y',
    color: LAMP_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'lamp-test-side',
    path: [[3, 2, 2], [4, 2, 2], [5, 2, 2]],
    exitDirection: '+X',
    color: LAMP_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'lamp-test-depth',
    path: [[8, 8, 8], [8, 8, 7], [8, 8, 6]],
    exitDirection: '-Z',
    color: LAMP_TEST_ACCENT,
    lengthClass: 'short',
  },
];

const FAN_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: FAN_TEST_SEED,
  label: '风扇技能测试',
};

const FAN_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'fan-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: FAN_TEST_ACCENT,
}));

const HUMIDIFIER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: HUMIDIFIER_TEST_SEED,
  label: '加湿器技能测试',
};

const HUMIDIFIER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'humidifier-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: HUMIDIFIER_TEST_ACCENT,
}));

const RADIO_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: RADIO_TEST_SEED,
  label: '收音机技能测试',
};

const RADIO_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'radio-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: RADIO_TEST_ACCENT,
}));

const TELEVISION_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: TELEVISION_TEST_SEED,
  label: '电视机技能测试',
};

const TELEVISION_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'television-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: TELEVISION_TEST_ACCENT,
}));

const TOASTER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: TOASTER_TEST_SEED,
  label: '烤面包机技能测试',
};

const TOASTER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'toaster-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: TOASTER_TEST_ACCENT,
}));

const REFRIGERATOR_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: REFRIGERATOR_TEST_SEED,
  label: '冰箱技能测试',
};

const REFRIGERATOR_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'refrigerator-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: REFRIGERATOR_TEST_ACCENT,
}));

const WASHER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: WASHER_TEST_SEED,
  label: '洗衣机技能测试',
};

const WASHER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'washer-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: WASHER_TEST_ACCENT,
}));

const lampDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'lamp');
if (!lampDefinition) throw new Error('Lamp appliance definition is missing.');
const fanDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'fan');
if (!fanDefinition) throw new Error('Fan appliance definition is missing.');
const humidifierDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'humidifier');
if (!humidifierDefinition) throw new Error('Humidifier appliance definition is missing.');
const radioDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'radio');
if (!radioDefinition) throw new Error('Radio appliance definition is missing.');
const televisionDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'television');
if (!televisionDefinition) throw new Error('Television appliance definition is missing.');
const toasterDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'toaster');
if (!toasterDefinition) throw new Error('Toaster appliance definition is missing.');
const refrigeratorDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'refrigerator');
if (!refrigeratorDefinition) throw new Error('Refrigerator appliance definition is missing.');
const washerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'washer');
if (!washerDefinition) throw new Error('Washer appliance definition is missing.');

const FAN_INITIAL_COMMANDS = [{
  type: 'set-status',
  slot: 'debuff',
  status: {
    id: 'bathroom-steam',
    sourceAppliance: 'humidifier',
    iconId: 'debuff-bathroom-steam',
    turnsRemaining: 3,
    targetCableIds: [],
    payload: {},
    createdBySkillEventIndex: 0,
  },
}] satisfies readonly SkillCommand[];

export const LAMP_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'lamp',
  appliance: 'lamp',
  accent: LAMP_TEST_ACCENT,
  level: LAMP_TEST_LEVEL,
  applianceDefinition: lampDefinition,
  initialCommands: [],
});

export const FAN_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'fan',
  appliance: 'fan',
  accent: FAN_TEST_ACCENT,
  level: FAN_TEST_LEVEL,
  applianceDefinition: fanDefinition,
  initialCommands: FAN_INITIAL_COMMANDS,
});

export const HUMIDIFIER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'humidifier',
  appliance: 'humidifier',
  accent: HUMIDIFIER_TEST_ACCENT,
  level: HUMIDIFIER_TEST_LEVEL,
  applianceDefinition: humidifierDefinition,
  initialCommands: [],
});

export const RADIO_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'radio',
  appliance: 'radio',
  accent: RADIO_TEST_ACCENT,
  level: RADIO_TEST_LEVEL,
  applianceDefinition: radioDefinition,
  initialCommands: [],
});

export const TELEVISION_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'television',
  appliance: 'television',
  accent: TELEVISION_TEST_ACCENT,
  level: TELEVISION_TEST_LEVEL,
  applianceDefinition: televisionDefinition,
  initialCommands: [],
});

export const TOASTER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'toaster',
  appliance: 'toaster',
  accent: TOASTER_TEST_ACCENT,
  level: TOASTER_TEST_LEVEL,
  applianceDefinition: toasterDefinition,
  initialCommands: [],
});

export const REFRIGERATOR_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'refrigerator',
  appliance: 'refrigerator',
  accent: REFRIGERATOR_TEST_ACCENT,
  level: REFRIGERATOR_TEST_LEVEL,
  applianceDefinition: refrigeratorDefinition,
  initialCommands: [],
});

export const WASHER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'washer',
  appliance: 'washer',
  accent: WASHER_TEST_ACCENT,
  level: WASHER_TEST_LEVEL,
  applianceDefinition: washerDefinition,
  initialCommands: [],
});

export const DEFAULT_SKILL_TEST = WASHER_SKILL_TEST;

export function getSkillTestDefinition(id: string | null): SkillTestDefinition | null {
  if (id === 'lamp') return LAMP_SKILL_TEST;
  if (id === 'fan') return FAN_SKILL_TEST;
  if (id === 'humidifier') return HUMIDIFIER_SKILL_TEST;
  if (id === 'radio') return RADIO_SKILL_TEST;
  if (id === 'television') return TELEVISION_SKILL_TEST;
  if (id === 'toaster') return TOASTER_SKILL_TEST;
  if (id === 'refrigerator') return REFRIGERATOR_SKILL_TEST;
  if (id === 'washer') return WASHER_SKILL_TEST;
  return null;
}

export function buildSkillTestPuzzle(test: SkillTestDefinition): PuzzleDefinition {
  const arrowsByTest: Record<SkillTestId, readonly ArrowDefinition[]> = {
    lamp: LAMP_TEST_ARROWS,
    fan: FAN_TEST_ARROWS,
    humidifier: HUMIDIFIER_TEST_ARROWS,
    radio: RADIO_TEST_ARROWS,
    television: TELEVISION_TEST_ARROWS,
    toaster: TOASTER_TEST_ARROWS,
    refrigerator: REFRIGERATOR_TEST_ARROWS,
    washer: WASHER_TEST_ARROWS,
  };
  const arrows = arrowsByTest[test.id];
  const prefix = `${test.id}-test-`;
  return {
    seed: test.level.seed,
    arrows: arrows.map((arrow) => ({
      ...arrow,
      path: arrow.path.map((point) => [...point] as typeof point),
    })),
    solution: [`${prefix}key`, `${prefix}blocked`, `${prefix}side`, `${prefix}depth`],
    initiallyFree: 3,
    level: test.level,
    mode: 'skill',
    challengeKind: 'standard',
  };
}
