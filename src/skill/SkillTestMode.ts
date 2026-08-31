import { APPLIANCE_CATALOG, type ApplianceDefinition, type ApplianceKind } from '../systems/ApplianceCatalog';
import { PAL } from '../style/palette';
import type { ArrowDefinition, LevelDefinition, PuzzleDefinition } from '../puzzle/types';
import type { SkillCommand } from './SkillChallengeEngine';

export type SkillTestId = 'lamp' | 'fan' | 'humidifier' | 'radio' | 'television' | 'toaster' | 'refrigerator' | 'washer' | 'microwave' | 'kettle' | 'coffee-maker' | 'rice-cooker' | 'phone' | 'robot-vacuum' | 'bubble-machine' | 'gumball-machine' | 'popcorn-machine' | 'alarm-clock' | 'smart-bin' | 'record-player' | 'stand-mixer' | 'printer' | 'induction-cooktop' | 'blender' | 'dehumidifier' | 'portable-speaker' | 'hair-dryer' | 'desktop-computer' | 'game-controller';

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
const MICROWAVE_TEST_SEED = 0x2a6f2026;
const MICROWAVE_TEST_ACCENT = PAL.red;
const KETTLE_TEST_SEED = 0x0b6f2026;
const KETTLE_TEST_ACCENT = PAL.blue;
const COFFEE_MAKER_TEST_SEED = 0x1b6f2026;
const COFFEE_MAKER_TEST_ACCENT = PAL.orange;
const RICE_COOKER_TEST_SEED = 0x2b6f2026;
const RICE_COOKER_TEST_ACCENT = PAL.yellow;
const PHONE_TEST_SEED = 0x3b6f2026;
const PHONE_TEST_ACCENT = PAL.blossomDeep;
const ROBOT_VACUUM_TEST_SEED = 0x4b6f2026;
const ROBOT_VACUUM_TEST_ACCENT = PAL.teal;
const BUBBLE_MACHINE_TEST_SEED = 0x5b6f2026;
const BUBBLE_MACHINE_TEST_ACCENT = PAL.blue;
const GUMBALL_MACHINE_TEST_SEED = 0x6b6f2026;
const GUMBALL_MACHINE_TEST_ACCENT = PAL.blossomDeep;
const POPCORN_MACHINE_TEST_SEED = 0x7b6f2026;
const POPCORN_MACHINE_TEST_ACCENT = PAL.yellow;
const ALARM_CLOCK_TEST_SEED = 0x8b6f2026;
const ALARM_CLOCK_TEST_ACCENT = PAL.blossomDeep;
const SMART_BIN_TEST_SEED = 0x9b6f2026;
const SMART_BIN_TEST_ACCENT = PAL.teal;
const RECORD_PLAYER_TEST_SEED = 0xab6f2026;
const RECORD_PLAYER_TEST_ACCENT = PAL.blossomDeep;
const STAND_MIXER_TEST_SEED = 0xbb6f2026;
const STAND_MIXER_TEST_ACCENT = PAL.purple;
const PRINTER_TEST_SEED = 0xcb6f2026;
const PRINTER_TEST_ACCENT = PAL.blossomDeep;
const INDUCTION_COOKTOP_TEST_SEED = 0xdb6f2026;
const INDUCTION_COOKTOP_TEST_ACCENT = PAL.orange;
const BLENDER_TEST_SEED = 0xeb6f2026;
const BLENDER_TEST_ACCENT = PAL.purple;
const DEHUMIDIFIER_TEST_SEED = 0xfb6f2026;
const DEHUMIDIFIER_TEST_ACCENT = PAL.blue;
const PORTABLE_SPEAKER_TEST_SEED = 0x0c6f2026;
const PORTABLE_SPEAKER_TEST_ACCENT = PAL.teal;
const HAIR_DRYER_TEST_SEED = 0x1c6f2026;
const HAIR_DRYER_TEST_ACCENT = PAL.orange;
const DESKTOP_COMPUTER_TEST_SEED = 0x2c6f2026;
const DESKTOP_COMPUTER_TEST_ACCENT = PAL.blossomDeep;
const GAME_CONTROLLER_TEST_SEED = 0x3c6f2026;
const GAME_CONTROLLER_TEST_ACCENT = PAL.blue;

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

const MICROWAVE_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: MICROWAVE_TEST_SEED,
  label: '微波炉技能测试',
};

const MICROWAVE_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'microwave-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: MICROWAVE_TEST_ACCENT,
}));

const KETTLE_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: KETTLE_TEST_SEED,
  label: '电热水壶技能测试',
};

const KETTLE_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'kettle-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: KETTLE_TEST_ACCENT,
}));

const COFFEE_MAKER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: COFFEE_MAKER_TEST_SEED,
  label: '咖啡机技能测试',
  difficulty: 'hard',
  targetCount: 7,
  lengthQuota: { short: 0.5, medium: 0.5, long: 0 },
  minInitiallyFree: 4,
  maxInitiallyFree: 7,
  minNeighborRatio: 0.18,
  minDensity: 0.08,
  cameraRadius: 18.8,
  referenceTargetCount: 7,
};

const COFFEE_MAKER_TEST_ARROWS: readonly ArrowDefinition[] = [
  {
    id: 'coffee-maker-test-trigger',
    path: [[3, 2, 2], [2, 2, 2], [1, 2, 2]],
    exitDirection: '-X',
    color: COFFEE_MAKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'coffee-maker-test-lock-1',
    path: [[7, 4, 3], [8, 4, 3], [9, 4, 3]],
    exitDirection: '+X',
    color: COFFEE_MAKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'coffee-maker-test-lock-2',
    path: [[4, 7, 7], [4, 8, 7], [4, 9, 7]],
    exitDirection: '+Y',
    color: COFFEE_MAKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'coffee-maker-test-lock-3',
    path: [[6, 3, 8], [6, 2, 8], [6, 1, 8]],
    exitDirection: '-Y',
    color: COFFEE_MAKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'coffee-maker-test-lock-4',
    path: [[3, 7, 7], [3, 7, 8], [3, 7, 9]],
    exitDirection: '+Z',
    color: COFFEE_MAKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'coffee-maker-test-recovered',
    path: [[7, 3, 3], [7, 3, 2], [7, 3, 1]],
    exitDirection: '-Z',
    color: COFFEE_MAKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'coffee-maker-test-spare',
    path: [[3, 5, 6], [2, 5, 6], [1, 5, 6]],
    exitDirection: '-X',
    color: COFFEE_MAKER_TEST_ACCENT,
    lengthClass: 'short',
  },
];

const RICE_COOKER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: RICE_COOKER_TEST_SEED,
  label: '电饭煲技能测试',
  targetCount: 5,
  lengthQuota: { short: 1, medium: 0, long: 0 },
  minInitiallyFree: 5,
  maxInitiallyFree: 5,
  cameraRadius: 18.2,
  referenceTargetCount: 5,
};

const RICE_COOKER_TEST_ARROWS: readonly ArrowDefinition[] = [
  {
    id: 'rice-cooker-test-trigger',
    path: [[3, 2, 2], [2, 2, 2], [1, 2, 2]],
    exitDirection: '-X',
    color: RICE_COOKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'rice-cooker-test-turn-1',
    path: [[7, 4, 3], [8, 4, 3], [9, 4, 3]],
    exitDirection: '+X',
    color: RICE_COOKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'rice-cooker-test-turn-2',
    path: [[4, 7, 7], [4, 8, 7], [4, 9, 7]],
    exitDirection: '+Y',
    color: RICE_COOKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'rice-cooker-test-turn-3',
    path: [[6, 3, 8], [6, 2, 8], [6, 1, 8]],
    exitDirection: '-Y',
    color: RICE_COOKER_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'rice-cooker-test-recovered',
    path: [[3, 7, 7], [3, 7, 8], [3, 7, 9]],
    exitDirection: '+Z',
    color: RICE_COOKER_TEST_ACCENT,
    lengthClass: 'short',
  },
];

const PHONE_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: PHONE_TEST_SEED,
  label: '手机技能测试',
  targetCount: 5,
  lengthQuota: { short: 1, medium: 0, long: 0 },
  minInitiallyFree: 5,
  maxInitiallyFree: 5,
  cameraRadius: 18.2,
  referenceTargetCount: 5,
};

const PHONE_TEST_ARROWS: readonly ArrowDefinition[] = [
  {
    id: 'phone-test-trigger',
    path: [[3, 2, 2], [2, 2, 2], [1, 2, 2]],
    exitDirection: '-X',
    color: PHONE_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'phone-test-disguise-1',
    path: [[7, 4, 3], [8, 4, 3], [9, 4, 3]],
    exitDirection: '+X',
    color: PHONE_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'phone-test-disguise-2',
    path: [[4, 7, 7], [4, 8, 7], [4, 9, 7]],
    exitDirection: '+Y',
    color: PHONE_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'phone-test-disguise-3',
    path: [[6, 3, 8], [6, 2, 8], [6, 1, 8]],
    exitDirection: '-Y',
    color: PHONE_TEST_ACCENT,
    lengthClass: 'short',
  },
  {
    id: 'phone-test-control',
    path: [[3, 7, 7], [3, 7, 8], [3, 7, 9]],
    exitDirection: '+Z',
    color: PHONE_TEST_ACCENT,
    lengthClass: 'short',
  },
];

const ROBOT_VACUUM_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: ROBOT_VACUUM_TEST_SEED,
  label: '扫地机器人技能测试',
  targetCount: 5,
  lengthQuota: { short: 1, medium: 0, long: 0 },
  minInitiallyFree: 4,
  maxInitiallyFree: 4,
  cameraRadius: 18.2,
  referenceTargetCount: 5,
};

const ROBOT_VACUUM_TEST_ARROWS: readonly ArrowDefinition[] = [
  {
    id: 'robot-vacuum-test-trigger',
    path: [[7, 7, 2], [8, 7, 2], [9, 7, 2]],
    exitDirection: '+X',
    color: ROBOT_VACUUM_TEST_ACCENT,
    lengthClass: 'short',
  },
  ...LAMP_TEST_ARROWS.map((arrow) => ({
    ...arrow,
    id: arrow.id.replace('lamp-test-', 'robot-vacuum-test-'),
    path: arrow.path.map((point) => [...point] as typeof point),
    color: ROBOT_VACUUM_TEST_ACCENT,
  })),
];
const BUBBLE_MACHINE_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: BUBBLE_MACHINE_TEST_SEED,
  label: '泡泡机技能测试',
};

const BUBBLE_MACHINE_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'bubble-machine-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: BUBBLE_MACHINE_TEST_ACCENT,
}));

const GUMBALL_MACHINE_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: GUMBALL_MACHINE_TEST_SEED,
  label: '扭蛋机技能测试',
};

const GUMBALL_MACHINE_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'gumball-machine-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: GUMBALL_MACHINE_TEST_ACCENT,
}));

const POPCORN_MACHINE_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: POPCORN_MACHINE_TEST_SEED,
  label: '爆米花机技能测试',
};

const POPCORN_MACHINE_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'popcorn-machine-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: POPCORN_MACHINE_TEST_ACCENT,
}));

const ALARM_CLOCK_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: ALARM_CLOCK_TEST_SEED,
  label: '闹钟技能测试',
};

const ALARM_CLOCK_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'alarm-clock-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: ALARM_CLOCK_TEST_ACCENT,
}));

const SMART_BIN_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: SMART_BIN_TEST_SEED,
  label: '智能垃圾桶技能测试',
};

const SMART_BIN_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'smart-bin-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: SMART_BIN_TEST_ACCENT,
}));

const RECORD_PLAYER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: RECORD_PLAYER_TEST_SEED,
  label: '唱片机技能测试',
};

const RECORD_PLAYER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'record-player-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: RECORD_PLAYER_TEST_ACCENT,
}));

const STAND_MIXER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: STAND_MIXER_TEST_SEED,
  label: '厨师机技能测试',
};

const STAND_MIXER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'stand-mixer-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: STAND_MIXER_TEST_ACCENT,
}));

const PRINTER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: PRINTER_TEST_SEED,
  label: '打印机技能测试',
};

const PRINTER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'printer-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: PRINTER_TEST_ACCENT,
}));

const INDUCTION_COOKTOP_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: INDUCTION_COOKTOP_TEST_SEED,
  label: '电磁炉技能测试',
};

const INDUCTION_COOKTOP_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'induction-cooktop-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: INDUCTION_COOKTOP_TEST_ACCENT,
}));

const BLENDER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: BLENDER_TEST_SEED,
  label: '搅拌机技能测试',
};

const BLENDER_TEST_COLORS = [PAL.red, PAL.yellow, PAL.teal, PAL.blue] as const;
const BLENDER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow, index) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'blender-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: BLENDER_TEST_COLORS[index] ?? BLENDER_TEST_ACCENT,
}));

const DEHUMIDIFIER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: DEHUMIDIFIER_TEST_SEED,
  label: '除湿机技能测试',
};

const DEHUMIDIFIER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'dehumidifier-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: DEHUMIDIFIER_TEST_ACCENT,
}));

const PORTABLE_SPEAKER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: PORTABLE_SPEAKER_TEST_SEED,
  label: '便携音箱技能测试',
};

const PORTABLE_SPEAKER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'portable-speaker-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: PORTABLE_SPEAKER_TEST_ACCENT,
}));

const HAIR_DRYER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: HAIR_DRYER_TEST_SEED,
  label: '吹风机技能测试',
};

const HAIR_DRYER_TEST_COLORS = [
  HAIR_DRYER_TEST_ACCENT,
  PAL.blue,
  HAIR_DRYER_TEST_ACCENT,
  PAL.teal,
] as const;
const HAIR_DRYER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow, index) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'hair-dryer-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: HAIR_DRYER_TEST_COLORS[index] ?? HAIR_DRYER_TEST_ACCENT,
}));

const DESKTOP_COMPUTER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: DESKTOP_COMPUTER_TEST_SEED,
  label: '台式电脑技能测试',
};

const DESKTOP_COMPUTER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'desktop-computer-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: DESKTOP_COMPUTER_TEST_ACCENT,
}));

const GAME_CONTROLLER_TEST_LEVEL: LevelDefinition = {
  ...LAMP_TEST_LEVEL,
  seed: GAME_CONTROLLER_TEST_SEED,
  label: '游戏手柄技能测试',
};

const GAME_CONTROLLER_TEST_ARROWS: readonly ArrowDefinition[] = LAMP_TEST_ARROWS.map((arrow) => ({
  ...arrow,
  id: arrow.id.replace('lamp-test-', 'game-controller-test-'),
  path: arrow.path.map((point) => [...point] as typeof point),
  color: GAME_CONTROLLER_TEST_ACCENT,
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
const microwaveDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'microwave');
if (!microwaveDefinition) throw new Error('Microwave appliance definition is missing.');
const kettleDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'kettle');
if (!kettleDefinition) throw new Error('Kettle appliance definition is missing.');
const coffeeMakerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'coffee-maker');
if (!coffeeMakerDefinition) throw new Error('Coffee maker appliance definition is missing.');
const riceCookerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'rice-cooker');
if (!riceCookerDefinition) throw new Error('Rice cooker appliance definition is missing.');
const phoneDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'phone');
if (!phoneDefinition) throw new Error('Phone appliance definition is missing.');
const robotVacuumDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'robot-vacuum');
if (!robotVacuumDefinition) throw new Error('Robot vacuum appliance definition is missing.');
const bubbleMachineDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'bubble-machine');
if (!bubbleMachineDefinition) throw new Error('Bubble machine appliance definition is missing.');
const gumballMachineDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'gumball-machine');
if (!gumballMachineDefinition) throw new Error('Gumball machine appliance definition is missing.');
const popcornMachineDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'popcorn-machine');
if (!popcornMachineDefinition) throw new Error('Popcorn machine appliance definition is missing.');
const alarmClockDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'alarm-clock');
if (!alarmClockDefinition) throw new Error('Alarm clock appliance definition is missing.');
const smartBinDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'smart-bin');
if (!smartBinDefinition) throw new Error('Smart bin appliance definition is missing.');
const recordPlayerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'record-player');
if (!recordPlayerDefinition) throw new Error('Record player appliance definition is missing.');
const standMixerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'stand-mixer');
if (!standMixerDefinition) throw new Error('Stand mixer appliance definition is missing.');
const printerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'printer');
if (!printerDefinition) throw new Error('Printer appliance definition is missing.');
const inductionCooktopDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'induction-cooktop');
if (!inductionCooktopDefinition) throw new Error('Induction cooktop appliance definition is missing.');
const blenderDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'blender');
if (!blenderDefinition) throw new Error('Blender appliance definition is missing.');
const dehumidifierDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'dehumidifier');
if (!dehumidifierDefinition) throw new Error('Dehumidifier appliance definition is missing.');
const portableSpeakerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'portable-speaker');
if (!portableSpeakerDefinition) throw new Error('Portable speaker appliance definition is missing.');
const hairDryerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'hair-dryer');
if (!hairDryerDefinition) throw new Error('Hair dryer appliance definition is missing.');
const desktopComputerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'desktop-computer');
if (!desktopComputerDefinition) throw new Error('Desktop computer appliance definition is missing.');
const gameControllerDefinition = APPLIANCE_CATALOG.find((definition) => definition.id === 'game-controller');
if (!gameControllerDefinition) throw new Error('Game controller appliance definition is missing.');

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

const KETTLE_INITIAL_COMMANDS = [{
  type: 'set-status',
  slot: 'debuff',
  status: {
    id: 'frozen-plug',
    sourceAppliance: 'refrigerator',
    iconId: 'debuff-frozen-plug',
    turnsRemaining: 3,
    targetCableIds: [
      'kettle-test-blocked',
      'kettle-test-side',
      'kettle-test-depth',
    ],
    payload: {},
    createdBySkillEventIndex: 0,
  },
}] satisfies readonly SkillCommand[];

const HAIR_DRYER_INITIAL_COMMANDS = [{
  type: 'set-status',
  slot: 'debuff',
  status: {
    id: 'frozen-plug',
    sourceAppliance: 'refrigerator',
    iconId: 'debuff-frozen-plug',
    turnsRemaining: 3,
    targetCableIds: [
      'hair-dryer-test-blocked',
      'hair-dryer-test-key',
      'hair-dryer-test-depth',
    ],
    payload: {},
    createdBySkillEventIndex: 0,
  },
}] satisfies readonly SkillCommand[];

const STAND_MIXER_INITIAL_COMMANDS = [{
  type: 'set-status',
  slot: 'debuff',
  status: {
    id: 'rice-thick-cable',
    sourceAppliance: 'rice-cooker',
    iconId: 'debuff-rice-thick-cable',
    turnsRemaining: 5,
    targetCableIds: STAND_MIXER_TEST_ARROWS.map((arrow) => arrow.id),
    payload: {},
    createdBySkillEventIndex: 0,
  },
}] satisfies readonly SkillCommand[];

const DESKTOP_COMPUTER_INITIAL_COMMANDS = [{
  type: 'grant-continue',
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

export const MICROWAVE_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'microwave',
  appliance: 'microwave',
  accent: MICROWAVE_TEST_ACCENT,
  level: MICROWAVE_TEST_LEVEL,
  applianceDefinition: microwaveDefinition,
  initialCommands: [],
});

export const KETTLE_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'kettle',
  appliance: 'kettle',
  accent: KETTLE_TEST_ACCENT,
  level: KETTLE_TEST_LEVEL,
  applianceDefinition: kettleDefinition,
  initialCommands: KETTLE_INITIAL_COMMANDS,
});

export const COFFEE_MAKER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'coffee-maker',
  appliance: 'coffee-maker',
  accent: COFFEE_MAKER_TEST_ACCENT,
  level: COFFEE_MAKER_TEST_LEVEL,
  applianceDefinition: coffeeMakerDefinition,
  initialCommands: [],
});

export const RICE_COOKER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'rice-cooker',
  appliance: 'rice-cooker',
  accent: RICE_COOKER_TEST_ACCENT,
  level: RICE_COOKER_TEST_LEVEL,
  applianceDefinition: riceCookerDefinition,
  initialCommands: [],
});

export const PHONE_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'phone',
  appliance: 'phone',
  accent: PHONE_TEST_ACCENT,
  level: PHONE_TEST_LEVEL,
  applianceDefinition: phoneDefinition,
  initialCommands: [],
});

export const ROBOT_VACUUM_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'robot-vacuum',
  appliance: 'robot-vacuum',
  accent: ROBOT_VACUUM_TEST_ACCENT,
  level: ROBOT_VACUUM_TEST_LEVEL,
  applianceDefinition: robotVacuumDefinition,
  initialCommands: [],
});

export const BUBBLE_MACHINE_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'bubble-machine',
  appliance: 'bubble-machine',
  accent: BUBBLE_MACHINE_TEST_ACCENT,
  level: BUBBLE_MACHINE_TEST_LEVEL,
  applianceDefinition: bubbleMachineDefinition,
  initialCommands: [],
});

export const GUMBALL_MACHINE_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'gumball-machine',
  appliance: 'gumball-machine',
  accent: GUMBALL_MACHINE_TEST_ACCENT,
  level: GUMBALL_MACHINE_TEST_LEVEL,
  applianceDefinition: gumballMachineDefinition,
  initialCommands: [],
});

export const POPCORN_MACHINE_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'popcorn-machine',
  appliance: 'popcorn-machine',
  accent: POPCORN_MACHINE_TEST_ACCENT,
  level: POPCORN_MACHINE_TEST_LEVEL,
  applianceDefinition: popcornMachineDefinition,
  initialCommands: [],
});

export const ALARM_CLOCK_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'alarm-clock',
  appliance: 'alarm-clock',
  accent: ALARM_CLOCK_TEST_ACCENT,
  level: ALARM_CLOCK_TEST_LEVEL,
  applianceDefinition: alarmClockDefinition,
  initialCommands: FAN_INITIAL_COMMANDS,
});

export const SMART_BIN_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'smart-bin',
  appliance: 'smart-bin',
  accent: SMART_BIN_TEST_ACCENT,
  level: SMART_BIN_TEST_LEVEL,
  applianceDefinition: smartBinDefinition,
  initialCommands: [],
});

export const RECORD_PLAYER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'record-player',
  appliance: 'record-player',
  accent: RECORD_PLAYER_TEST_ACCENT,
  level: RECORD_PLAYER_TEST_LEVEL,
  applianceDefinition: recordPlayerDefinition,
  initialCommands: [],
});

export const STAND_MIXER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'stand-mixer',
  appliance: 'stand-mixer',
  accent: STAND_MIXER_TEST_ACCENT,
  level: STAND_MIXER_TEST_LEVEL,
  applianceDefinition: standMixerDefinition,
  initialCommands: STAND_MIXER_INITIAL_COMMANDS,
});

export const PRINTER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'printer',
  appliance: 'printer',
  accent: PRINTER_TEST_ACCENT,
  level: PRINTER_TEST_LEVEL,
  applianceDefinition: printerDefinition,
  initialCommands: [],
});

export const INDUCTION_COOKTOP_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'induction-cooktop',
  appliance: 'induction-cooktop',
  accent: INDUCTION_COOKTOP_TEST_ACCENT,
  level: INDUCTION_COOKTOP_TEST_LEVEL,
  applianceDefinition: inductionCooktopDefinition,
  initialCommands: [],
});

export const BLENDER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'blender',
  appliance: 'blender',
  accent: BLENDER_TEST_ACCENT,
  level: BLENDER_TEST_LEVEL,
  applianceDefinition: blenderDefinition,
  initialCommands: [],
});

export const DEHUMIDIFIER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'dehumidifier',
  appliance: 'dehumidifier',
  accent: DEHUMIDIFIER_TEST_ACCENT,
  level: DEHUMIDIFIER_TEST_LEVEL,
  applianceDefinition: dehumidifierDefinition,
  initialCommands: [],
});

export const PORTABLE_SPEAKER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'portable-speaker',
  appliance: 'portable-speaker',
  accent: PORTABLE_SPEAKER_TEST_ACCENT,
  level: PORTABLE_SPEAKER_TEST_LEVEL,
  applianceDefinition: portableSpeakerDefinition,
  initialCommands: [],
});

export const HAIR_DRYER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'hair-dryer',
  appliance: 'hair-dryer',
  accent: HAIR_DRYER_TEST_ACCENT,
  level: HAIR_DRYER_TEST_LEVEL,
  applianceDefinition: hairDryerDefinition,
  initialCommands: HAIR_DRYER_INITIAL_COMMANDS,
});

export const DESKTOP_COMPUTER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'desktop-computer',
  appliance: 'desktop-computer',
  accent: DESKTOP_COMPUTER_TEST_ACCENT,
  level: DESKTOP_COMPUTER_TEST_LEVEL,
  applianceDefinition: desktopComputerDefinition,
  initialCommands: DESKTOP_COMPUTER_INITIAL_COMMANDS,
});

export const GAME_CONTROLLER_SKILL_TEST: SkillTestDefinition = Object.freeze({
  id: 'game-controller',
  appliance: 'game-controller',
  accent: GAME_CONTROLLER_TEST_ACCENT,
  level: GAME_CONTROLLER_TEST_LEVEL,
  applianceDefinition: gameControllerDefinition,
  initialCommands: [],
});

export const DEFAULT_SKILL_TEST = GAME_CONTROLLER_SKILL_TEST;

export function getSkillTestDefinition(id: string | null): SkillTestDefinition | null {
  if (id === 'lamp') return LAMP_SKILL_TEST;
  if (id === 'fan') return FAN_SKILL_TEST;
  if (id === 'humidifier') return HUMIDIFIER_SKILL_TEST;
  if (id === 'radio') return RADIO_SKILL_TEST;
  if (id === 'television') return TELEVISION_SKILL_TEST;
  if (id === 'toaster') return TOASTER_SKILL_TEST;
  if (id === 'refrigerator') return REFRIGERATOR_SKILL_TEST;
  if (id === 'washer') return WASHER_SKILL_TEST;
  if (id === 'microwave') return MICROWAVE_SKILL_TEST;
  if (id === 'kettle') return KETTLE_SKILL_TEST;
  if (id === 'coffee-maker') return COFFEE_MAKER_SKILL_TEST;
  if (id === 'rice-cooker') return RICE_COOKER_SKILL_TEST;
  if (id === 'phone') return PHONE_SKILL_TEST;
  if (id === 'robot-vacuum') return ROBOT_VACUUM_SKILL_TEST;
  if (id === 'bubble-machine') return BUBBLE_MACHINE_SKILL_TEST;
  if (id === 'gumball-machine') return GUMBALL_MACHINE_SKILL_TEST;
  if (id === 'popcorn-machine') return POPCORN_MACHINE_SKILL_TEST;
  if (id === 'alarm-clock') return ALARM_CLOCK_SKILL_TEST;
  if (id === 'smart-bin') return SMART_BIN_SKILL_TEST;
  if (id === 'record-player') return RECORD_PLAYER_SKILL_TEST;
  if (id === 'stand-mixer') return STAND_MIXER_SKILL_TEST;
  if (id === 'printer') return PRINTER_SKILL_TEST;
  if (id === 'induction-cooktop') return INDUCTION_COOKTOP_SKILL_TEST;
  if (id === 'blender') return BLENDER_SKILL_TEST;
  if (id === 'dehumidifier') return DEHUMIDIFIER_SKILL_TEST;
  if (id === 'portable-speaker') return PORTABLE_SPEAKER_SKILL_TEST;
  if (id === 'hair-dryer') return HAIR_DRYER_SKILL_TEST;
  if (id === 'desktop-computer') return DESKTOP_COMPUTER_SKILL_TEST;
  if (id === 'game-controller') return GAME_CONTROLLER_SKILL_TEST;
  return null;
}

export function buildSkillTestPuzzle(
  test: SkillTestDefinition,
  seed = test.level.seed,
): PuzzleDefinition {
  const arrowsByTest: Record<SkillTestId, readonly ArrowDefinition[]> = {
    lamp: LAMP_TEST_ARROWS,
    fan: FAN_TEST_ARROWS,
    humidifier: HUMIDIFIER_TEST_ARROWS,
    radio: RADIO_TEST_ARROWS,
    television: TELEVISION_TEST_ARROWS,
    toaster: TOASTER_TEST_ARROWS,
    refrigerator: REFRIGERATOR_TEST_ARROWS,
    washer: WASHER_TEST_ARROWS,
    microwave: MICROWAVE_TEST_ARROWS,
    kettle: KETTLE_TEST_ARROWS,
    'coffee-maker': COFFEE_MAKER_TEST_ARROWS,
    'rice-cooker': RICE_COOKER_TEST_ARROWS,
    phone: PHONE_TEST_ARROWS,
    'robot-vacuum': ROBOT_VACUUM_TEST_ARROWS,
    'bubble-machine': BUBBLE_MACHINE_TEST_ARROWS,
    'gumball-machine': GUMBALL_MACHINE_TEST_ARROWS,
    'popcorn-machine': POPCORN_MACHINE_TEST_ARROWS,
    'alarm-clock': ALARM_CLOCK_TEST_ARROWS,
    'smart-bin': SMART_BIN_TEST_ARROWS,
    'record-player': RECORD_PLAYER_TEST_ARROWS,
    'stand-mixer': STAND_MIXER_TEST_ARROWS,
    printer: PRINTER_TEST_ARROWS,
    'induction-cooktop': INDUCTION_COOKTOP_TEST_ARROWS,
    blender: BLENDER_TEST_ARROWS,
    dehumidifier: DEHUMIDIFIER_TEST_ARROWS,
    'portable-speaker': PORTABLE_SPEAKER_TEST_ARROWS,
    'hair-dryer': HAIR_DRYER_TEST_ARROWS,
    'desktop-computer': DESKTOP_COMPUTER_TEST_ARROWS,
    'game-controller': GAME_CONTROLLER_TEST_ARROWS,
  };
  const arrows = arrowsByTest[test.id];
  const prefix = `${test.id}-test-`;
  return {
    seed,
    arrows: arrows.map((arrow) => ({
      ...arrow,
      path: arrow.path.map((point) => [...point] as typeof point),
    })),
    solution: test.id === 'robot-vacuum'
      ? [`${prefix}trigger`, `${prefix}key`, `${prefix}blocked`, `${prefix}side`, `${prefix}depth`]
      : test.id === 'coffee-maker' || test.id === 'rice-cooker' || test.id === 'phone'
        ? arrows.map((arrow) => arrow.id)
        : [`${prefix}key`, `${prefix}blocked`, `${prefix}side`, `${prefix}depth`],
    initiallyFree: test.id === 'robot-vacuum'
      ? 4
      : test.id === 'coffee-maker' || test.id === 'rice-cooker' || test.id === 'phone'
        ? arrows.length
        : 3,
    level: { ...test.level, seed },
    mode: 'skill',
    challengeKind: 'standard',
  };
}
