import type { SkillScreenEffect } from '../style/post';
import type { ApplianceKind } from '../systems/ApplianceCatalog';

export type SkillConnectionShieldVisual = 'bubble' | 'sound-wave' | 'dry-air';

export type SkillConnectionVisualPolicy = Readonly<{
  appliancePerformance: true;
  screenEffect: SkillScreenEffect | null;
  shield: SkillConnectionShieldVisual | null;
}>;

const SCREEN_EFFECTS: Partial<Record<ApplianceKind, SkillScreenEffect>> = {
  humidifier: 'bathroom-steam',
  television: 'television-glitch',
  toaster: 'toaster-heat',
  kettle: 'kettle-thaw-heat',
  'coffee-maker': 'coffee-lock',
  printer: 'printer-scan',
  microwave: 'microwave-heat',
  'desktop-computer': 'blue-screen',
};

const SHIELDS: Partial<Record<ApplianceKind, SkillConnectionShieldVisual>> = {
  'bubble-machine': 'bubble',
  'record-player': 'sound-wave',
  dehumidifier: 'dry-air',
};

/**
 * Visual routing is based on the appliance that was physically connected,
 * never on whether the rules engine accepted or suppressed its skill.
 */
export function skillConnectionVisualPolicy(appliance: ApplianceKind): SkillConnectionVisualPolicy {
  return {
    appliancePerformance: true,
    screenEffect: SCREEN_EFFECTS[appliance] ?? null,
    shield: SHIELDS[appliance] ?? null,
  };
}
