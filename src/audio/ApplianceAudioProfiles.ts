import type { ApplianceKind } from '../systems/ApplianceCatalog';
import {
  POWERED_ACTIVE_DURATION,
  PRINTER_POWERED_ACTIVE_DURATION,
} from '../appliances/poweredAnimation';

export type ApplianceAudioStage = {
  label: string;
  at: number;
  duration: number;
};

export type ApplianceAudioProfile = {
  character: 'motor' | 'screen' | 'heat' | 'water' | 'mechanical' | 'musical' | 'air';
  baseFrequency: number;
  runGain: number;
  noiseAmount: number;
  pitchVariation: number;
  duration: number;
  stages: readonly [ApplianceAudioStage, ApplianceAudioStage, ApplianceAudioStage, ApplianceAudioStage];
};

const stages = (
  startup: string,
  run: string,
  climax: string,
  finish: string,
  duration: number,
): ApplianceAudioProfile['stages'] => [
  { label: startup, at: 0, duration: 0.42 },
  { label: run, at: 0.36, duration: Math.max(0.12, duration - 1.15) },
  { label: climax, at: duration * 0.6, duration: 0.78 },
  { label: finish, at: duration - 0.64, duration: 0.58 },
];

const audio = (
  character: ApplianceAudioProfile['character'],
  baseFrequency: number,
  runGain: number,
  noiseAmount: number,
  pitchVariation: number,
  labels: readonly [string, string, string, string],
  duration = POWERED_ACTIVE_DURATION,
): ApplianceAudioProfile => ({
  character,
  baseFrequency,
  runGain,
  noiseAmount,
  pitchVariation,
  duration,
  stages: stages(...labels, duration),
});

export const APPLIANCE_AUDIO_PROFILES = {
  lamp: audio('mechanical', 118, 0.12, 0.015, 0.02, ['开关', '关节与轻灯丝鸣', '灯丝升亮', '断电']),
  fan: audio('air', 82, 0.2, 0.34, 0.045, ['开关', '马达升速与风噪', '高速风噪', '降速']),
  radio: audio('musical', 220, 0.12, 0.12, 0.035, ['调谐', '底噪', '短五声音型', '收台']),
  television: audio('screen', 156, 0.16, 0.26, 0.025, ['启动啸声', '换台', '静电', '关机收线']),
  humidifier: audio('water', 96, 0.17, 0.28, 0.04, ['水泵', '雾化嘶声', '云团闷响', '停机']),
  toaster: audio('heat', 105, 0.14, 0.09, 0.025, ['压杆', '加热', '弹起', '吐司落下']),
  refrigerator: audio('motor', 62, 0.16, 0.08, 0.018, ['压缩机', '门封', '内部轻响', '关门']),
  washer: audio('water', 74, 0.2, 0.22, 0.035, ['锁门', '进水', '滚筒', '减速']),
  microwave: audio('heat', 60, 0.17, 0.08, 0.012, ['按键', '继电器', '低频运行', '结束音']),
  'coffee-maker': audio('water', 88, 0.18, 0.24, 0.035, ['开关', '水泵', '滴滤', '蒸汽收尾']),
  kettle: audio('heat', 96, 0.2, 0.3, 0.04, ['开关', '加热嘶声', '沸腾', '跳闸']),
  'rice-cooker': audio('water', 84, 0.17, 0.2, 0.03, ['按键', '轻沸', '蒸汽', '完成提示']),
  phone: audio('screen', 196, 0.11, 0.03, 0.02, ['唤醒', '振动', '来电短句', '回落']),
  'robot-vacuum': audio('motor', 76, 0.18, 0.14, 0.03, ['启动音', '轮刷', '电机', '完成提示']),
  'bubble-machine': audio('air', 92, 0.15, 0.25, 0.04, ['电机', '液体', '送风', '柔和破泡']),
  'gumball-machine': audio('mechanical', 128, 0.13, 0.05, 0.03, ['投入', '摇柄', '滚落', '出奖提示']),
  'popcorn-machine': audio('heat', 102, 0.2, 0.22, 0.045, ['继电器', '加热', '受控随机爆裂', '落料']),
  'alarm-clock': audio('mechanical', 154, 0.11, 0.02, 0.012, ['发条', '走时', '铃铛高潮', '按停']),
  'smart-bin': audio('mechanical', 82, 0.14, 0.08, 0.025, ['感应', '舵机开盖', '空腔声', '合盖']),
  'record-player': audio('musical', 196, 0.13, 0.1, 0.025, ['开盖', '落针', '底噪', '短五声音型']),
  'stand-mixer': audio('motor', 70, 0.19, 0.12, 0.03, ['开关', '马达升速', '搅拌撞击', '停机']),
  printer: audio(
    'mechanical',
    116,
    0.16,
    0.16,
    0.035,
    ['按键', '滚轮', '纸张采样', '完成提示'],
    PRINTER_POWERED_ACTIVE_DURATION,
  ),
  'induction-cooktop': audio('heat', 112, 0.17, 0.15, 0.025, ['触控', '感应嗡鸣', '轻沸', '结束音']),
  blender: audio('motor', 84, 0.23, 0.16, 0.055, ['开关', '分段升速', '食材撞击', '停转']),
  dehumidifier: audio('air', 68, 0.18, 0.2, 0.025, ['风机', '压缩机与进气', '水滴', '停机']),
  'portable-speaker': audio('musical', 110, 0.16, 0.04, 0.025, ['开机音', '低频运行', '短五声音型', '关机']),
  'hair-dryer': audio('air', 92, 0.23, 0.38, 0.04, ['开关', '马达与风噪', '热量升降', '停机']),
  'desktop-computer': audio('screen', 72, 0.18, 0.16, 0.035, ['开机', '风扇与键鼠', '过载警报', '停机']),
  'game-controller': audio('mechanical', 132, 0.13, 0.04, 0.035, ['连接', '按键与摇杆', '震动高潮', '完成音']),
} satisfies Record<ApplianceKind, ApplianceAudioProfile>;
