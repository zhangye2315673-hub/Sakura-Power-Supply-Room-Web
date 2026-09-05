export type CompletionMode = 'campaign' | 'random' | 'skill' | 'rush';

export type CompletionContinuationAction =
  | 'next-campaign-level'
  | 'new-random'
  | 'new-exploration'
  | 'new-double-ended'
  | 'new-skill'
  | 'new-rush';

export type CompletionContinuation = Readonly<{
  action: CompletionContinuationAction;
  labelKey: 'continue.next' | 'continue.random' | 'complete.retry';
}>;

export function resolveCompletionContinuation(context: Readonly<{
  mode: CompletionMode;
  exploration?: boolean;
  challengeKind?: 'standard' | 'double-ended' | null;
  levelId?: number | null;
  campaignLevelCount?: number;
}>): CompletionContinuation {
  if (context.mode === 'campaign') {
    const levelId = context.levelId ?? 1;
    const levelCount = Math.max(1, context.campaignLevelCount ?? levelId);
    return levelId < levelCount
      ? { action: 'next-campaign-level', labelKey: 'continue.next' }
      : { action: 'new-random', labelKey: 'continue.random' };
  }
  if (context.mode === 'skill') return { action: 'new-skill', labelKey: 'complete.retry' };
  if (context.mode === 'rush') return { action: 'new-rush', labelKey: 'complete.retry' };
  if (context.exploration) return { action: 'new-exploration', labelKey: 'complete.retry' };
  if (context.challengeKind === 'double-ended') {
    return { action: 'new-double-ended', labelKey: 'complete.retry' };
  }
  return { action: 'new-random', labelKey: 'complete.retry' };
}
