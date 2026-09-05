type SchedulerWithYield = {
  yield?: () => Promise<void>;
};

/** Yield without waiting for the renderer's next animation frame. */
export function yieldToMainThread(): Promise<void> {
  const scheduler = (globalThis as typeof globalThis & {
    scheduler?: SchedulerWithYield;
  }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

/** Keep long scene-build loops cooperative without paying one RAF per item. */
export class CooperativeYieldBudget {
  private startedAt = performance.now();
  private itemCount = 0;

  constructor(
    private readonly budgetMs = 8,
    private readonly maxItems = 4,
  ) {}

  async afterItem(): Promise<void> {
    this.itemCount += 1;
    if (this.itemCount < this.maxItems && performance.now() - this.startedAt < this.budgetMs) return;
    await yieldToMainThread();
    this.startedAt = performance.now();
    this.itemCount = 0;
  }
}
