import { t } from './Locale';

export class PuzzleLoadingOverlay {
  private static readonly MINIMUM_VISIBLE_MS = 900;
  private static readonly CONTACT_HOLD_MS = 420;
  private readonly element = this.getElement<HTMLElement>('#puzzle-loader');
  private readonly label = this.getElement<HTMLElement>('#puzzle-loader-label');
  private readonly percent = this.getElement<HTMLElement>('#puzzle-loader-percent');
  private readonly progressBar = this.getElement<HTMLElement>('.plug-loader');
  private frame = 0;
  private completionTimer = 0;
  private startedAt = 0;

  get active(): boolean {
    return this.element.classList.contains('visible');
  }

  show(message: string): void {
    this.cancelTimers();
    this.startedAt = performance.now();
    this.label.textContent = message;
    this.element.classList.remove('plugged');
    this.element.classList.add('visible');
    this.element.setAttribute('aria-hidden', 'false');
    this.setProgress(0.04);
    this.frame = requestAnimationFrame(this.updateProgress);
  }

  setLabel(message: string): void {
    this.label.textContent = message;
  }

  complete(onCovered: () => void | Promise<void>, onFinished?: () => void): void {
    if (!this.active) {
      onCovered();
      onFinished?.();
      return;
    }
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.setProgress(1);
    this.label.textContent = t('loader.connected');
    this.element.classList.add('plugged');
    const visibleFor = Math.max(0, performance.now() - this.startedAt);
    const remainingMinimum = Math.max(0, PuzzleLoadingOverlay.MINIMUM_VISIBLE_MS - visibleFor);
    this.completionTimer = window.setTimeout(() => {
      void Promise.resolve(onCovered()).finally(() => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          this.hide();
          onFinished?.();
        }));
      });
    }, Math.max(PuzzleLoadingOverlay.CONTACT_HOLD_MS, remainingMinimum));
  }

  fail(): void {
    this.hide();
  }

  hide(): void {
    this.cancelTimers();
    this.element.classList.remove('visible');
    this.element.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => this.element.classList.remove('plugged'), 260);
  }

  dispose(): void {
    this.cancelTimers();
  }

  private readonly updateProgress = (now: number) => {
    const elapsed = Math.max(0, now - this.startedAt);
    const progress = Math.min(0.92, 0.04 + 0.88 * (1 - Math.exp(-elapsed / 3600)));
    this.setProgress(progress);
    this.frame = requestAnimationFrame(this.updateProgress);
  };

  private setProgress(progress: number): void {
    const clamped = Math.max(0, Math.min(1, progress));
    this.element.style.setProperty('--loader-progress', clamped.toFixed(4));
    this.percent.textContent = `${Math.round(clamped * 100)}%`;
    this.progressBar.setAttribute('aria-valuenow', String(Math.round(clamped * 100)));
  }

  private cancelTimers(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    if (this.completionTimer) window.clearTimeout(this.completionTimer);
    this.frame = 0;
    this.completionTimer = 0;
  }

  private getElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing HUD element: ${selector}`);
    return element;
  }
}
