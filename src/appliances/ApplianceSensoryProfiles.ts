import type { ApplianceKind } from '../systems/ApplianceCatalog';

export type ApplianceLightRole =
  | 'lamp'
  | 'status'
  | 'screen'
  | 'heat'
  | 'interior'
  | 'mist'
  | 'reflective'
  | 'output';

export type ApplianceSensoryProfile = {
  lightRole: ApplianceLightRole;
  lightColor: number;
  spill: number;
  radius: number;
  activeGain: number;
  standbyBrightness: number;
  nodeHints: readonly string[];
};

const profile = (
  lightRole: ApplianceLightRole,
  lightColor: number,
  spill: number,
  radius: number,
  activeGain: number,
  nodeHints: readonly string[],
): ApplianceSensoryProfile => ({
  lightRole,
  lightColor,
  spill,
  radius,
  activeGain,
  standbyBrightness: 0.4,
  nodeHints,
});

export const APPLIANCE_SENSORY_PROFILES = {
  lamp: profile('lamp', 0xffd8a4, 1, 3.8, 2.25, ['shade', 'bulb', 'beam', 'light']),
  fan: profile('status', 0x8fd6e6, 0.08, 1.2, 0.55, ['indicator', 'status']),
  radio: profile('output', 0xe0a45c, 0.18, 1.5, 0.8, ['dial', 'needle', 'indicator']),
  television: profile('screen', 0x9bc8ff, 0.72, 2.5, 1.8, ['screen', 'picture', 'crt']),
  humidifier: profile('mist', 0x8bd7e3, 0.32, 2.1, 1.1, ['mist', 'cloud', 'light']),
  toaster: profile('heat', 0xff784a, 0.36, 1.6, 1.35, ['slot', 'heater', 'toast']),
  refrigerator: profile('interior', 0xe2efff, 0.58, 2.1, 1.5, ['interior', 'light', 'door']),
  washer: profile('screen', 0x91c9e8, 0.35, 2, 1.15, ['window', 'water', 'indicator']),
  microwave: profile('interior', 0xe7a45e, 0.38, 1.8, 1.25, ['interior', 'cavity', 'panel']),
  'coffee-maker': profile('heat', 0xe39a57, 0.3, 1.8, 1.2, ['carafe', 'warming', 'steam']),
  kettle: profile('mist', 0xffc989, 0.22, 1.5, 0.95, ['indicator', 'steam', 'base']),
  'rice-cooker': profile('heat', 0xd86c55, 0.24, 1.6, 1.05, ['heat', 'steam', 'indicator']),
  phone: profile('screen', 0xa8d4ff, 0.65, 1.4, 1.75, ['screen', 'display', 'avatar']),
  'robot-vacuum': profile('status', 0x7fd7df, 0.2, 1.35, 0.85, ['ring', 'sensor', 'indicator']),
  'bubble-machine': profile('reflective', 0xa7d9ff, 0.14, 1.8, 0.7, ['bubble', 'film', 'indicator']),
  'gumball-machine': profile('output', 0xffbc79, 0.18, 1.6, 0.75, ['output', 'prize', 'indicator']),
  'popcorn-machine': profile('heat', 0xf0a056, 0.45, 2.1, 1.45, ['chamber', 'heat', 'lamp']),
  'alarm-clock': profile('status', 0x82c7d4, 0.08, 1.1, 0.5, ['face', 'indicator', 'dial']),
  'smart-bin': profile('interior', 0xcda174, 0.16, 1.5, 0.75, ['sensor', 'interior', 'lid']),
  'record-player': profile('output', 0xd7a36f, 0.2, 1.7, 0.85, ['stylus', 'indicator', 'record']),
  'stand-mixer': profile('status', 0x82d4d6, 0.09, 1.4, 0.55, ['indicator', 'status']),
  printer: profile('output', 0x8bd5be, 0.14, 1.6, 0.7, ['status', 'paper', 'slot']),
  'induction-cooktop': profile('heat', 0xf0774f, 0.34, 1.9, 1.25, ['heat', 'ring', 'cookware']),
  blender: profile('reflective', 0x87c7d8, 0.1, 1.45, 0.58, ['indicator', 'liquid', 'jar']),
  dehumidifier: profile('status', 0x7dc8d5, 0.12, 1.6, 0.65, ['indicator', 'water', 'window']),
  'portable-speaker': profile('status', 0x80d5dc, 0.14, 1.4, 0.68, ['ring', 'indicator', 'speaker']),
  'hair-dryer': profile('heat', 0xf0a16c, 0.22, 1.5, 0.92, ['nozzle', 'heat', 'indicator']),
  'desktop-computer': profile('screen', 0xa2ccff, 0.7, 2.3, 1.7, ['screen', 'monitor', 'status']),
  'game-controller': profile('status', 0x80d8e8, 0.18, 1.4, 0.8, ['ring', 'indicator', 'button']),
} satisfies Record<ApplianceKind, ApplianceSensoryProfile>;
