import { PuzzleLoadingOverlay } from './PuzzleLoadingOverlay';
import { applyStaticTranslations, shapeLabel, t, type TranslationKey } from './Locale';

export class Hud {
  private readonly remaining = this.getElement('#remaining-value');
  private readonly total = this.getElement('#total-value');
  private readonly progress = this.getElement('#progress-fill');
  private readonly status = this.getElement('#status-line');
  private readonly seedLabel = this.getElement('#seed-label');
  private readonly toast = this.getElement('#toast');
  private readonly completePanel = this.getElement('#complete-panel');
  private readonly gameOverPanel = this.getElement('#game-over-panel');
  private readonly randomLives = this.getElement('#random-lives');
  private readonly lifeIcons = [...this.randomLives.querySelectorAll<HTMLElement>('i')];
  private readonly lifeBurst = this.createLifeBurst();
  private readonly hintIcons = [...document.querySelectorAll<HTMLElement>('#hint-button .hint-icons i')];
  private toastTimer = 0;
  private hintPulseTimer = 0;
  private lifeBurstTimer = 0;
  private renderedMaxLives = this.lifeIcons.length;
  private hintUsesRemaining = 3;
  private statusKey: TranslationKey = 'status.find';
  private statusParams: Record<string, string | number> = {};
  private loadingKey: TranslationKey = 'loading.new';
  private loadingParams: Record<string, string | number> = {};
  private puzzleMeta: {
    seed: number;
    modeKey: TranslationKey;
    modeParams: Record<string, string | number>;
    continueKey: TranslationKey;
  } | null = null;

  readonly resetButton = this.getButton('#reset-button');
  readonly newButton = this.getButton('#new-button');
  readonly continueButton = this.getButton('#continue-button');
  readonly applianceGalleryButton = this.getButton('#appliance-gallery-button');
  readonly homeButton = this.getButton('#home-button');
  readonly languageButton = this.getButton('#language-button');
  readonly retryRandomButton = this.getButton('#retry-random-button');
  readonly gameOverNewButton = this.getButton('#game-over-new-button');
  readonly hintButton = this.getButton('#hint-button');
  private readonly loadingOverlay = new PuzzleLoadingOverlay();

  beginPuzzleLoad(
    messageKey: TranslationKey = 'loading.new',
    immersive = false,
    params: Record<string, string | number> = {},
  ): void {
    this.loadingKey = messageKey;
    this.loadingParams = params;
    this.completePanel.classList.remove('visible');
    this.completePanel.setAttribute('aria-hidden', 'true');
    this.hideGameOver();
    this.setStatus(messageKey, params);
    this.continueButton.disabled = true;
    this.resetButton.disabled = true;
    this.newButton.disabled = true;
    this.homeButton.disabled = true;
    this.setHintEnabled(false);
    document.querySelector('#app')?.setAttribute('aria-busy', 'true');
    if (immersive) this.loadingOverlay.show(t(messageKey, params));
    else this.loadingOverlay.hide();
  }

  completePuzzleLoad(onCovered: () => void | Promise<void>): void {
    this.loadingOverlay.complete(onCovered, () => this.finishPuzzleLoad());
  }

  finishPuzzleLoad(): void {
    this.continueButton.disabled = false;
    this.resetButton.disabled = false;
    this.newButton.disabled = false;
    this.homeButton.disabled = false;
    document.querySelector('#app')?.setAttribute('aria-busy', 'false');
  }

  setPuzzle(
    seed: number,
    remaining: number,
    total: number,
    modeKey: TranslationKey = 'mode.random',
    continueKey: TranslationKey = 'continue.next',
    modeParams: Record<string, string | number> = {},
  ): void {
    this.puzzleMeta = { seed, modeKey, modeParams, continueKey };
    this.writePuzzleMeta();
    this.updateProgress(remaining, total);
    this.setStatus('status.find');
    this.completePanel.classList.remove('visible');
    this.completePanel.setAttribute('aria-hidden', 'true');
    this.hideGameOver();
    if (!this.loadingOverlay.active) this.finishPuzzleLoad();
  }

  updateProgress(remaining: number, total: number): void {
    this.remaining.textContent = String(remaining);
    this.total.textContent = String(total);
    const removed = total === 0 ? 0 : (total - remaining) / total;
    this.progress.style.width = `${Math.round(removed * 100)}%`;
  }

  showBlocked(): void {
    this.setStatus('status.blocked');
    this.flash(t('flash.blocked'), true);
  }

  showRemoved(remaining: number): void {
    this.setStatus(remaining > 0 ? 'status.opened' : 'status.solved');
  }

  showConnected(remaining: number, applianceLabel: string): void {
    this.setStatus(remaining > 0 ? 'status.connected' : 'status.powered');
    this.flash(t('flash.connected', { name: applianceLabel }));
  }

  showComplete(): void {
    this.completePanel.classList.add('visible');
    this.completePanel.setAttribute('aria-hidden', 'false');
  }

  setRandomLives(visible: boolean, lives: number, maxLives = 3): void {
    this.randomLives.classList.toggle('visible', visible);
    this.randomLives.setAttribute('aria-hidden', String(!visible));
    const container = this.randomLives.querySelector<HTMLElement>('div');
    const previousMaxLives = this.renderedMaxLives;
    const addedIcons: HTMLElement[] = [];
    while (container && this.lifeIcons.length < maxLives) {
      const icon = document.createElement('i');
      icon.textContent = '♥';
      container.append(icon);
      this.lifeIcons.push(icon);
      addedIcons.push(icon);
    }
    while (container && this.lifeIcons.length > maxLives) {
      this.lifeIcons.pop()?.remove();
    }
    this.lifeIcons.forEach((icon, index) => {
      const active = index < lives;
      icon.classList.toggle('lost', !active);
      icon.setAttribute('aria-hidden', String(!active));
    });
    this.renderedMaxLives = maxLives;
    if (visible && maxLives > previousMaxLives) {
      window.clearTimeout(this.lifeBurstTimer);
      this.randomLives.classList.remove('popcorn-burst');
      this.lifeBurst.classList.remove('active');
      addedIcons.forEach((icon) => icon.classList.remove('life-added'));
      void this.randomLives.offsetWidth;
      this.randomLives.classList.add('popcorn-burst');
      this.lifeBurst.classList.add('active');
      addedIcons.forEach((icon) => icon.classList.add('life-added'));
      this.lifeBurstTimer = window.setTimeout(() => {
        this.randomLives.classList.remove('popcorn-burst');
        this.lifeBurst.classList.remove('active');
        addedIcons.forEach((icon) => icon.classList.remove('life-added'));
      }, 900);
    }
  }

  showLifeLost(lives: number): void {
    this.setStatus(lives > 0 ? 'status.blocked' : 'status.gameOver');
    this.flash(t('flash.lifeLost'), true);
  }

  setHintEnabled(enabled: boolean): void {
    this.hintButton.disabled = !enabled;
    this.hintButton.setAttribute('aria-disabled', String(!enabled));
  }

  setHintUses(remaining: number): void {
    this.hintUsesRemaining = Math.max(0, Math.min(this.hintIcons.length, remaining));
    this.hintIcons.forEach((icon, index) => {
      icon.classList.toggle('used', index >= this.hintUsesRemaining);
    });
    const label = t('hint.remaining', { count: this.hintUsesRemaining });
    this.hintButton.setAttribute('aria-label', label);
    this.hintButton.setAttribute('title', label);
  }

  showHintUsed(remaining: number): void {
    window.clearTimeout(this.hintPulseTimer);
    this.hintButton.classList.remove('revealing');
    void this.hintButton.offsetWidth;
    this.hintButton.classList.add('revealing');
    this.hintPulseTimer = window.setTimeout(
      () => this.hintButton.classList.remove('revealing'),
      620,
    );
    this.flash(t('flash.hint', { count: remaining }));
  }

  showHintUnavailable(): void {
    this.flash(t('flash.hintUnavailable'), true);
  }

  showGameOver(): void {
    this.setStatus('status.gameOver');
    this.gameOverPanel.classList.add('visible');
    this.gameOverPanel.setAttribute('aria-hidden', 'false');
  }

  hideGameOver(): void {
    this.gameOverPanel.classList.remove('visible');
    this.gameOverPanel.setAttribute('aria-hidden', 'true');
  }

  hidePanels(): void {
    this.completePanel.classList.remove('visible');
    this.completePanel.setAttribute('aria-hidden', 'true');
    this.hideGameOver();
  }

  refreshLocale(): void {
    applyStaticTranslations();
    this.setHintUses(this.hintUsesRemaining);
    this.status.textContent = t(this.statusKey, this.statusParams);
    this.writePuzzleMeta();
    if (this.loadingOverlay.active) this.loadingOverlay.setLabel(t(this.loadingKey, this.loadingParams));
  }

  showLoadError(message: string): void {
    this.loadingOverlay.fail();
    this.finishPuzzleLoad();
    this.flash(message, true);
  }

  dispose(): void {
    window.clearTimeout(this.hintPulseTimer);
    window.clearTimeout(this.lifeBurstTimer);
    this.loadingOverlay.dispose();
  }

  flash(message: string, error = false): void {
    window.clearTimeout(this.toastTimer);
    this.toast.textContent = message;
    this.toast.classList.toggle('error', error);
    this.toast.classList.add('visible');
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('visible'), 1250);
  }

  private setStatus(key: TranslationKey, params: Record<string, string | number> = {}): void {
    this.statusKey = key;
    this.statusParams = params;
    this.status.textContent = t(key, params);
  }

  private writePuzzleMeta(): void {
    if (!this.puzzleMeta) return;
    const { seed, modeKey, modeParams, continueKey } = this.puzzleMeta;
    const resolvedParams = { ...modeParams };
    if (typeof resolvedParams.shapeId === 'string') resolvedParams.shape = shapeLabel(resolvedParams.shapeId);
    this.seedLabel.textContent = `${t(modeKey, resolvedParams)} · SEED ${seed.toString(16).toUpperCase().padStart(8, '0')}`;
    this.continueButton.textContent = t(continueKey);
  }

  private getElement(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing UI element: ${selector}`);
    return element;
  }

  private createLifeBurst(): HTMLElement {
    const burst = document.createElement('span');
    burst.className = 'life-popcorn-burst';
    burst.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 7; index += 1) burst.append(document.createElement('b'));
    this.randomLives.append(burst);
    return burst;
  }

  private getButton(selector: string): HTMLButtonElement {
    const element = document.querySelector<HTMLButtonElement>(selector);
    if (!element) throw new Error(`Missing UI button: ${selector}`);
    return element;
  }
}
