import { APPLIANCE_CATALOG, type ApplianceKind } from '../systems/ApplianceCatalog';
import { APPLIANCE_SKILL_REGISTRY, type ApplianceSkillDefinition, type GachaCardTier } from './SkillChallengeEngine';

type IconKey =
  | 'hint' | 'steam' | 'wind' | 'shield' | 'freeze' | 'heat-branch' | 'spin' | 'bubble'
  | 'glitch' | 'route' | 'swap' | 'thaw' | 'coffee' | 'sweep' | 'thick' | 'shuffle'
  | 'copy' | 'record' | 'fast-forward' | 'popcorn' | 'normalize' | 'continue' | 'timer'
  | 'blue-screen' | 'reveal' | 'bass' | 'recycle' | 'double-plug';

type SkillCardVisual = Readonly<{
  icon: IconKey;
  palette: readonly [string, string, string];
}>;

export type SkillCardPreviewDefinition = Readonly<{
  skillId: string;
  appliance: ApplianceKind;
  applianceLabel: string;
  label: string;
  description: string;
  polarity: ApplianceSkillDefinition['polarity'];
}>;

const SKILL_CARD_VISUALS: Readonly<Record<string, SkillCardVisual>> = {
  'lamp-hint': { icon: 'hint', palette: ['#ffd86f', '#ff9fb5', '#fff7dc'] },
  'bathroom-steam': { icon: 'steam', palette: ['#91b8d8', '#c9b3db', '#f5f1ef'] },
  'clear-steam': { icon: 'wind', palette: ['#77dcd5', '#96bfff', '#fff7dc'] },
  dehumidify: { icon: 'shield', palette: ['#65d4d2', '#7ca8ff', '#e8fff9'] },
  'freeze-plugs': { icon: 'freeze', palette: ['#87c9ff', '#a9e9ef', '#f4ffff'] },
  'hair-dryer-branch': { icon: 'heat-branch', palette: ['#ff8f67', '#86cfff', '#fff0ba'] },
  'spin-remove': { icon: 'spin', palette: ['#74ddd3', '#ff9fbd', '#fff0c9'] },
  'bubble-shield': { icon: 'bubble', palette: ['#77ddd8', '#f8a5cf', '#fff08c'] },
  'glitch-reconstruct': { icon: 'glitch', palette: ['#f47ca9', '#68d4d0', '#fff073'] },
  'route-broadcast': { icon: 'route', palette: ['#f49ab8', '#6ed7d0', '#fff1a8'] },
  'swap-ends': { icon: 'swap', palette: ['#f7a064', '#75d1d0', '#ffe3a0'] },
  'steam-thaw': { icon: 'thaw', palette: ['#ff9f72', '#7fd9e0', '#fff2bc'] },
  'coffee-lock': { icon: 'coffee', palette: ['#9a5c3d', '#d98a55', '#ffe3b8'] },
  'snapshot-sweep': { icon: 'sweep', palette: ['#6fd8d1', '#ef8fb5', '#fff3be'] },
  'rice-thick-cable': { icon: 'thick', palette: ['#fff0b1', '#d8a96b', '#fffaf0'] },
  'color-shuffle': { icon: 'shuffle', palette: ['#f88bac', '#73d6cf', '#ffd96d'] },
  'printer-copy': { icon: 'copy', palette: ['#8ac4ff', '#f39ab8', '#fff3cf'] },
  'soothing-record': { icon: 'record', palette: ['#f58dab', '#83d9d2', '#fff0a6'] },
  'time-fast-forward': { icon: 'fast-forward', palette: ['#ffb36b', '#8eb7ff', '#fff0b5'] },
  'popcorn-meal': { icon: 'popcorn', palette: ['#ffd76b', '#f48da9', '#fff5d7'] },
  'normalize-statuses': { icon: 'normalize', palette: ['#d995d5', '#76d4cc', '#fff1aa'] },
  'continue-game': { icon: 'continue', palette: ['#8ab6ff', '#f08fb9', '#fff1b4'] },
  'timed-meal': { icon: 'timer', palette: ['#ff866f', '#ffd36d', '#fff0c5'] },
  'blue-screen': { icon: 'blue-screen', palette: ['#5d82da', '#8eb8ff', '#e5f2ff'] },
  'induction-reveal': { icon: 'reveal', palette: ['#71d9d0', '#ffd570', '#eefcff'] },
  'bass-spacing': { icon: 'bass', palette: ['#81b9ff', '#6ed8d0', '#fff09e'] },
  'recycle-cable': { icon: 'recycle', palette: ['#70d4b6', '#ffd56c', '#eafff7'] },
  'fake-double-plug': { icon: 'double-plug', palette: ['#af7ad9', '#f39cbf', '#f6ebff'] },
};

const ICON_ART: Record<Exclude<IconKey, 'bubble'>, string> = {
  hint: '<circle class="skill-icon-fill skill-icon-primary" cx="80" cy="78" r="34"/><circle class="skill-icon-fill skill-icon-highlight" cx="80" cy="78" r="14"/><path class="skill-icon-line skill-icon-thin" d="M80 26v14M80 116v16M28 78h14M118 78h14"/><path class="skill-icon-fill skill-icon-secondary" d="m80 17 7 13 15 3-11 10 2 15-13-7-13 7 2-15-11-10 15-3Z"/>',
  steam: '<path class="skill-icon-line" d="M43 118c-19-23 18-29 1-53-10-15 1-27 12-34M79 122c-18-25 20-31 2-58-9-14 0-27 12-37M113 115c-15-20 17-28 3-49-8-12-1-22 8-30"/>',
  wind: '<path class="skill-icon-line" d="M25 55h69c25 0 25-31 3-31-12 0-18 7-19 15M31 82h90c26 0 25 32 1 32-13 0-20-8-20-17M23 108h51"/><circle class="skill-icon-fill skill-icon-primary" cx="29" cy="82" r="8"/>',
  shield: '<path class="skill-icon-fill skill-icon-primary" d="M80 20c20 15 37 16 49 19v35c0 35-21 54-49 67-28-13-49-32-49-67V39c12-3 29-4 49-19Z"/><path class="skill-icon-fill skill-icon-secondary" d="M80 51c15 19 20 27 20 37a20 20 0 0 1-40 0c0-10 5-18 20-37Z"/>',
  freeze: '<path class="skill-icon-line" d="M80 18v124M27 49l106 62M27 111l106-62M64 31l16 14 16-14M64 129l16-14 16 14M31 69l21-6-5-21M129 91l-21 6 5 21M31 91l21 6-5 21M129 69l-21-6 5-21"/><circle class="skill-icon-fill skill-icon-primary" cx="80" cy="80" r="14"/>',
  'heat-branch': '<path class="skill-icon-fill skill-icon-primary" d="M52 132c-19-15-18-35-4-49 8-8 11-17 8-32 24 14 38 35 34 53-4 21-21 35-38 28Z"/><path class="skill-icon-fill skill-icon-secondary" d="M101 31v58M76 45l50 30M76 75l50-30"/><path class="skill-icon-line skill-icon-thin" d="m100 30 1 14 11-8M101 89l-1-14-11 8"/>',
  spin: '<path class="skill-icon-line" d="M36 68c7-25 31-40 56-35 12 2 21 8 28 16"/><path class="skill-icon-fill skill-icon-secondary" d="m116 34 18 20-27 4Z"/><path class="skill-icon-line" d="M124 93c-8 24-32 38-57 33-11-2-20-7-27-15"/><path class="skill-icon-fill skill-icon-primary" d="m43 126-18-20 27-4Z"/><circle class="skill-icon-fill skill-icon-primary" cx="60" cy="78" r="12"/><circle class="skill-icon-fill skill-icon-secondary" cx="101" cy="83" r="12"/>',
  glitch: '<path class="skill-icon-line skill-icon-heavy" d="M28 119 52 92l23 12 22-42 35-19"/><path class="skill-icon-fill skill-icon-primary" d="M18 107h25v27H18zM63 91h26v27H63zM116 28h27v28h-27z"/><path class="skill-icon-fill skill-icon-secondary" d="m92 42 20 7-14 16Z"/>',
  route: '<path class="skill-icon-line" d="M29 116c18-33 39-7 55-34 14-24 30-14 47-40"/><circle class="skill-icon-fill skill-icon-primary" cx="29" cy="116" r="12"/><circle class="skill-icon-fill skill-icon-secondary" cx="83" cy="83" r="12"/><circle class="skill-icon-fill skill-icon-highlight" cx="131" cy="42" r="12"/><path class="skill-icon-line skill-icon-thin" d="M18 88c12-10 26-10 38 0M9 72c18-17 41-17 59 0"/><path class="skill-icon-fill skill-icon-secondary" d="m123 25 27 9-21 19Z"/>',
  swap: '<path class="skill-icon-line" d="M29 55h76l-15-15M105 55 90 70M131 105H55l15 15M55 105l15-15"/><path class="skill-icon-fill skill-icon-primary" d="M19 43h17v24H19z"/><path class="skill-icon-fill skill-icon-secondary" d="M124 93h17v24h-17z"/>',
  thaw: '<circle class="skill-icon-fill skill-icon-secondary" cx="79" cy="96" r="34"/><path class="skill-icon-line skill-icon-thin" d="m64 78 14 15-8 11 18 15M46 48c-13-17 13-22 2-39M78 48c-13-17 13-22 2-39M110 48c-13-17 13-22 2-39"/>',
  coffee: '<path class="skill-icon-fill skill-icon-primary" d="M35 100c-12-24 7-49 31-46 7-23 39-26 51-7 24-5 39 18 28 38 13 24-11 47-34 36-15 20-45 14-51-8-12 7-27 1-25-13Z"/><circle class="skill-icon-fill skill-icon-primary" cx="31" cy="54" r="10"/><circle class="skill-icon-fill skill-icon-primary" cx="121" cy="25" r="8"/><circle class="skill-icon-fill skill-icon-primary" cx="141" cy="116" r="11"/><path class="skill-icon-fill skill-icon-secondary" d="M57 73h47v46H57z"/><path class="skill-icon-line skill-icon-thin" d="M67 73V60c0-18 27-18 27 0v13"/><circle class="skill-icon-fill skill-icon-highlight" cx="80" cy="94" r="6"/>',
  sweep: '<path class="skill-icon-line skill-icon-thin" d="M24 52V29h25M136 52V29h-25M24 108v23h25M136 108v23h-25"/><path class="skill-icon-line skill-icon-heavy" d="M31 92c26 25 61 28 92 8"/><path class="skill-icon-fill skill-icon-primary" d="m113 83 32 11-24 24Z"/><circle class="skill-icon-fill skill-icon-secondary" cx="48" cy="68" r="10"/><circle class="skill-icon-fill skill-icon-highlight" cx="75" cy="77" r="8"/><circle class="skill-icon-fill skill-icon-secondary" cx="99" cy="71" r="6"/>',
  thick: '<path class="skill-icon-line skill-icon-heavy" d="M31 102c7-42 38-62 71-41 20 13 18 39 35 48"/><path class="skill-icon-fill skill-icon-primary" d="M17 88h29v35H17z"/><path class="skill-icon-fill skill-icon-secondary" d="M122 94h23v31h-23z"/><path class="skill-icon-line skill-icon-thin" d="M24 77v11M38 77v11M129 83v11M140 83v11"/>',
  shuffle: '<path class="skill-icon-line" d="M45 43h70l-8 82H53Z"/><path class="skill-icon-line skill-icon-thin" d="M58 78c18-17 47-8 47 12 0 18-24 27-38 15-12-10-5-27 8-28 10-1 16 10 10 17"/><circle class="skill-icon-fill skill-icon-primary" cx="51" cy="27" r="12"/><circle class="skill-icon-fill skill-icon-secondary" cx="82" cy="23" r="12"/><circle class="skill-icon-fill skill-icon-highlight" cx="113" cy="28" r="12"/>',
  copy: '<path class="skill-icon-fill skill-icon-secondary" d="M39 28h66v80H39z"/><path class="skill-icon-fill skill-icon-primary" d="M57 50h66v80H57z"/><path class="skill-icon-line skill-icon-thin" d="M72 75h34M72 92h34M72 109h22"/><path class="skill-icon-line" d="m31 120 18 14 18-14"/>',
  record: '<circle class="skill-icon-fill skill-icon-primary" cx="75" cy="79" r="52"/><circle class="skill-icon-fill skill-icon-highlight" cx="75" cy="79" r="18"/><circle class="skill-icon-fill skill-icon-secondary" cx="75" cy="79" r="7"/><path class="skill-icon-fill skill-icon-secondary" d="M119 43c17-18 42 7 13 33-29-26-4-51 13-33Z"/>',
  'fast-forward': '<circle class="skill-icon-fill skill-icon-primary" cx="72" cy="82" r="52"/><path class="skill-icon-line skill-icon-thin" d="M72 49v35l23 16"/><path class="skill-icon-fill skill-icon-secondary" d="m105 55 24 25-24 25zM128 55l24 25-24 25z"/>',
  popcorn: '<path class="skill-icon-fill skill-icon-primary" d="M48 68h65l-8 67H56Z"/><path class="skill-icon-line skill-icon-thin" d="M64 72l7 59M96 72l-6 59"/><circle class="skill-icon-fill skill-icon-highlight" cx="52" cy="57" r="20"/><circle class="skill-icon-fill skill-icon-secondary" cx="79" cy="47" r="23"/><circle class="skill-icon-fill skill-icon-highlight" cx="105" cy="57" r="20"/><path class="skill-icon-line skill-icon-thin" d="M128 24v31M113 39h30"/>',
  normalize: '<path class="skill-icon-fill skill-icon-primary" d="M22 35h27v23H22zM22 69h43v23H22zM22 103h61v23H22z"/><path class="skill-icon-line skill-icon-thin" d="M86 46h20M86 80h20M86 114h20"/><path class="skill-icon-fill skill-icon-secondary" d="m98 32 24 14-24 14Zm0 34 24 14-24 14Zm0 34 24 14-24 14Z"/><path class="skill-icon-fill skill-icon-highlight" d="M124 35h20v22h-20zM124 69h20v22h-20zM124 103h20v22h-20z"/>',
  continue: '<path class="skill-icon-fill skill-icon-primary" d="M80 132C23 96 25 51 52 43c18-6 28 7 28 7s10-13 28-7c27 8 29 53-28 89Z"/><path class="skill-icon-line" d="M80 104V60M61 79l19-19 19 19"/>',
  timer: '<circle class="skill-icon-fill skill-icon-primary" cx="80" cy="82" r="51"/><path class="skill-icon-line skill-icon-thin" d="M80 82V52M80 82l25 17M62 18h36"/><path class="skill-icon-fill skill-icon-secondary" d="M33 105h20v26H33z"/>',
  'blue-screen': '<path class="skill-icon-fill skill-icon-primary" d="M24 31h112v82H24z"/><path class="skill-icon-line" d="m53 55 54 38M107 55 53 93M57 132h46"/><circle class="skill-icon-fill skill-icon-secondary" cx="41" cy="46" r="6"/>',
  reveal: '<circle class="skill-icon-line" cx="80" cy="80" r="54"/><circle class="skill-icon-line skill-icon-thin" cx="80" cy="80" r="35"/><circle class="skill-icon-fill skill-icon-primary" cx="80" cy="80" r="12"/><circle class="skill-icon-fill skill-icon-secondary" cx="80" cy="26" r="8"/><circle class="skill-icon-fill skill-icon-secondary" cx="127" cy="106" r="8"/><circle class="skill-icon-fill skill-icon-secondary" cx="33" cy="106" r="8"/>',
  bass: '<circle class="skill-icon-fill skill-icon-primary" cx="55" cy="80" r="28"/><circle class="skill-icon-fill skill-icon-highlight" cx="55" cy="80" r="10"/><path class="skill-icon-line" d="M91 54c19 15 19 37 0 52M111 37c34 26 34 60 0 86"/><circle class="skill-icon-fill skill-icon-secondary" cx="143" cy="80" r="9"/>',
  recycle: '<path class="skill-icon-fill skill-icon-primary" d="M48 65h64l-7 66H55Z"/><path class="skill-icon-line skill-icon-thin" d="M42 53h76M64 53l7-18h18l7 18M69 78v34M91 78v34"/><path class="skill-icon-line skill-icon-heavy" d="M20 39c24 3 43 14 55 31"/><path class="skill-icon-fill skill-icon-secondary" d="m68 54 22 20-29 6Z"/><path class="skill-icon-fill skill-icon-highlight" d="M13 25h25v24H13z"/>',
  'double-plug': '<path class="skill-icon-line skill-icon-heavy" d="M40 80c23-25 57-25 80 0"/><path class="skill-icon-fill skill-icon-primary" d="M14 63h32v34H14z"/><path class="skill-icon-fill skill-icon-secondary" d="M114 63h32v34h-32z"/><path class="skill-icon-line skill-icon-thin" d="M20 51v12M38 51v12M122 51v12M140 51v12"/>',
};

const FALLBACK_VISUAL: SkillCardVisual = { icon: 'hint', palette: ['#ffd86f', '#ff9fb5', '#fff7dc'] };

const APPLIANCE_LABELS = new Map(APPLIANCE_CATALOG.map((definition) => [definition.id, definition.label] as const));

export const GACHA_TIER_LABELS: Record<GachaCardTier, string> = {
  'normal-benefit': '收益卡',
  'strong-benefit': '强收益',
  'normal-risk': '风险卡',
  'strong-risk': '强风险',
};

export function getSkillCardVisual(skillId: string): SkillCardVisual {
  return SKILL_CARD_VISUALS[skillId] ?? FALLBACK_VISUAL;
}

export function getApplianceCardLabel(appliance: ApplianceKind): string {
  return APPLIANCE_LABELS.get(appliance) ?? appliance;
}

export function getSkillCardStyle(skillId: string): string {
  const [primary, secondary, highlight] = getSkillCardVisual(skillId).palette;
  return `--skill-symbol-primary:${primary};--skill-symbol-secondary:${secondary};--skill-symbol-highlight:${highlight}`;
}

export function renderSkillCardSymbol(skillId: string): string {
  const visual = getSkillCardVisual(skillId);
  if (visual.icon === 'bubble') {
    return '<span class="skill-card-bubble"><span class="skill-card-bubble__glint"></span><span class="skill-card-bubble__orbit"></span></span>';
  }
  return `<svg class="skill-card-symbol-svg skill-card-symbol-svg--${visual.icon}" viewBox="0 0 160 160" aria-hidden="true">${ICON_ART[visual.icon]}</svg>`;
}

export function getSkillCardPreviewDefinitions(): SkillCardPreviewDefinition[] {
  return [...APPLIANCE_SKILL_REGISTRY.values()]
    .filter((definition) => definition.appliance !== 'gumball-machine')
    .map((definition) => ({
      skillId: definition.id,
      appliance: definition.appliance,
      applianceLabel: getApplianceCardLabel(definition.appliance),
      label: definition.label,
      description: definition.description,
      polarity: definition.polarity,
    }));
}
