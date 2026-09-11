import type { ApplianceKind } from '../systems/ApplianceCatalog';

/** Presentation follows the existing spatial difficulty curve; rules and saves stay compatible. */
export const CAMPAIGN_CHAPTERS = [
  { id: 1, stage: 'learn', appliances: ['lamp', 'fan', 'radio', 'toaster', 'kettle'] },
  { id: 2, stage: 'learn', appliances: ['toaster', 'kettle', 'coffee-maker', 'rice-cooker', 'microwave', 'refrigerator', 'blender', 'induction-cooktop'] },
  { id: 3, stage: 'observe', appliances: ['lamp', 'desktop-computer', 'printer', 'phone', 'radio', 'fan', 'alarm-clock', 'portable-speaker'] },
  { id: 4, stage: 'observe', appliances: ['washer', 'hair-dryer', 'robot-vacuum', 'smart-bin', 'fan', 'dehumidifier', 'humidifier', 'lamp'] },
  { id: 5, stage: 'plan', appliances: ['record-player', 'radio', 'portable-speaker', 'television', 'lamp', 'phone', 'game-controller', 'fan'] },
  { id: 6, stage: 'plan', appliances: ['popcorn-machine', 'gumball-machine', 'bubble-machine', 'game-controller', 'television', 'portable-speaker', 'phone', 'lamp'] },
  { id: 7, stage: 'master', appliances: ['stand-mixer', 'blender', 'induction-cooktop', 'rice-cooker', 'refrigerator', 'coffee-maker', 'microwave', 'kettle'] },
  { id: 8, stage: 'master', appliances: ['lamp', 'refrigerator', 'washer', 'desktop-computer', 'television', 'fan', 'radio', 'kettle'] },
] as const satisfies readonly { id: number; stage: string; appliances: readonly ApplianceKind[] }[];

export function campaignChapter(id: number) {
  const chapter = CAMPAIGN_CHAPTERS.find(chapter => chapter.id === id);
  if (!chapter) throw new Error(`Unknown campaign chapter: ${id}`);
  return chapter;
}
