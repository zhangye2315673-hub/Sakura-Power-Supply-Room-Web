import { applyStaticTranslations, t, type TranslationKey } from './Locale';

type StartScreenOptions = {
  onStart: () => void;
  onRandom: () => void;
  onExplore: () => void;
  onRush: () => void;
  onDoubleEnded: () => void;
  onSkill: () => void;
  onProgress?: (progress: number) => void;
};

export class StartScreen {
  private readonly element = this.getElement<HTMLElement>('#start-screen');
  private readonly startButton = this.getElement<HTMLButtonElement>('#start-game-button');
  private readonly challengeButton = this.getElement<HTMLButtonElement>('#challenge-mode-button');
  private readonly challengeMenu = this.getElement<HTMLElement>('#challenge-mode-menu');
  private readonly randomButton = this.getElement<HTMLButtonElement>('#start-random-button');
  private readonly exploreButton = this.getElement<HTMLButtonElement>('#start-explore-button');
  private readonly rushButton = this.getElement<HTMLButtonElement>('#start-rush-button');
  private readonly doubleEndedButton = this.getElement<HTMLButtonElement>('#start-double-ended-button');
  private readonly skillButton = this.getElement<HTMLButtonElement>('#start-skill-button');
  private readonly status = this.getElement<HTMLElement>('#start-loading-status');
  private readonly percent = this.getElement<HTMLElement>('#start-loading-percent');
  private readonly progressBar = this.getElement<HTMLElement>('.start-progress');
  private readonly objectState = this.getElement<HTMLElement>('#start-object-state');
  private readonly onStart: () => void;
  private readonly onRandom: () => void;
  private readonly onExplore: () => void;
  private readonly onRush: () => void;
  private readonly onDoubleEnded: () => void;
  private readonly onSkill: () => void;
  private readonly onProgress?: (progress: number) => void;
  private animationFrame = 0;
  private lastFrameAt = 0;
  private displayedProgress = 0.03;
  private progressFloor = 0.03;
  private progressCeiling = 0.12;
  private ready = false;
  private startRequested = false;
  private leaving = false;
  private exitTimer = 0;
  private statusKey: TranslationKey = 'start.loading.initial';
  private statusParams: Record<string, string | number> = {};
  private statusError: string | null = null;

  constructor(options: StartScreenOptions) {
    this.onStart = options.onStart;
    this.onRandom = options.onRandom;
    this.onExplore = options.onExplore;
    this.onRush = options.onRush;
    this.onDoubleEnded = options.onDoubleEnded;
    this.onSkill = options.onSkill;
    this.onProgress = options.onProgress;
    this.startButton.addEventListener('click', this.handleStart);
    this.challengeButton.addEventListener('click', this.toggleChallengeMenu);
    this.randomButton.addEventListener('click', this.handleRandom);
    this.exploreButton.addEventListener('click', this.handleExplore);
    this.rushButton.addEventListener('click', this.handleRush);
    this.doubleEndedButton.addEventListener('click', this.handleDoubleEnded);
    this.skillButton.addEventListener('click', this.handleSkill);
    document.addEventListener('pointerdown', this.handleOutsidePointer);
    document.addEventListener('keydown', this.handleKeyDown);
    document.documentElement.classList.add('opening-active');
    this.refreshLocale();
    this.writeProgress();
    this.animationFrame = requestAnimationFrame(this.updateProgress);
  }

  get active(): boolean {
    return !this.element.hidden && !this.element.classList.contains('finished');
  }

  get progress(): number {
    return this.displayedProgress;
  }

  setStage(messageKey: TranslationKey, floor: number, ceiling: number, params: Record<string, string | number> = {}): void {
    if (this.ready) return;
    this.statusKey = messageKey;
    this.statusParams = params;
    this.statusError = null;
    this.status.textContent = t(messageKey, params);
    this.progressFloor = Math.max(this.progressFloor, Math.min(0.98, floor));
    this.progressCeiling = Math.max(this.progressFloor, Math.min(0.98, ceiling));
    this.displayedProgress = Math.max(this.displayedProgress, this.progressFloor);
    this.writeProgress();
  }

  setExactProgress(messageKey: TranslationKey, progress: number, params: Record<string, string | number> = {}): void {
    if (this.ready) return;
    this.statusKey = messageKey;
    this.statusParams = params;
    this.statusError = null;
    this.status.textContent = t(messageKey, params);
    const clamped = Math.max(this.displayedProgress, Math.min(0.98, progress));
    this.progressFloor = clamped;
    this.progressCeiling = Math.max(this.progressCeiling, clamped);
    this.displayedProgress = clamped;
    this.writeProgress();
  }

  markReady(): void {
    if (this.ready) return;
    this.ready = true;
    this.displayedProgress = 1;
    this.progressFloor = 1;
    this.progressCeiling = 1;
    this.statusKey = 'start.ready';
    this.statusParams = {};
    this.statusError = null;
    this.status.textContent = t(this.statusKey);
    this.objectState.textContent = 'READY';
    this.startButton.disabled = false;
    this.challengeButton.disabled = false;
    this.randomButton.disabled = false;
    this.exploreButton.disabled = false;
    this.rushButton.disabled = false;
    this.doubleEndedButton.disabled = false;
    this.skillButton.disabled = false;
    this.startButton.textContent = t('start.enter');
    this.startButton.classList.add('ready');
    this.element.classList.add('ready');
    this.writeProgress();
    if (this.startRequested) this.beginStart();
  }

  showError(message: string): void {
    this.statusError = message;
    this.status.textContent = message;
    this.startButton.disabled = false;
    this.startButton.textContent = t('start.reload');
    this.startButton.classList.add('error');
  }

  beginExit(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.startButton.disabled = true;
    this.challengeButton.disabled = true;
    this.randomButton.disabled = true;
    this.exploreButton.disabled = true;
    this.rushButton.disabled = true;
    this.doubleEndedButton.disabled = true;
    this.skillButton.disabled = true;
    this.closeChallengeMenu();
    this.startButton.textContent = t('start.connecting');
    this.element.classList.add('connecting');
  }

  finishExit(): void {
    this.element.classList.add('finished');
    this.element.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('opening-active');
    window.clearTimeout(this.exitTimer);
    this.exitTimer = window.setTimeout(() => {
      this.element.hidden = true;
    }, 760);
  }

  showAgain(): void {
    window.clearTimeout(this.exitTimer);
    this.exitTimer = 0;
    this.leaving = false;
    this.startRequested = false;
    this.element.hidden = false;
    this.element.classList.remove('finished', 'connecting', 'start-requested');
    this.element.setAttribute('aria-hidden', 'false');
    this.startButton.classList.remove('error');
    this.startButton.disabled = !this.ready;
    this.challengeButton.disabled = !this.ready;
    this.randomButton.disabled = !this.ready;
    this.exploreButton.disabled = !this.ready;
    this.rushButton.disabled = !this.ready;
    this.doubleEndedButton.disabled = !this.ready;
    this.skillButton.disabled = !this.ready;
    this.closeChallengeMenu();
    document.documentElement.classList.add('opening-active');
    this.refreshLocale();
  }

  refreshLocale(): void {
    applyStaticTranslations();
    this.status.textContent = this.statusError ?? t(this.statusKey, this.statusParams);
    if (this.statusError) this.startButton.textContent = t('start.reload');
    else if (this.leaving) this.startButton.textContent = t('start.connecting');
    else if (this.ready) this.startButton.textContent = t('start.enter');
    else if (this.startRequested) this.startButton.textContent = t('start.preparing');
    else this.startButton.textContent = t('start.waiting');
  }

  dispose(): void {
    this.startButton.removeEventListener('click', this.handleStart);
    this.challengeButton.removeEventListener('click', this.toggleChallengeMenu);
    this.randomButton.removeEventListener('click', this.handleRandom);
    this.exploreButton.removeEventListener('click', this.handleExplore);
    this.rushButton.removeEventListener('click', this.handleRush);
    this.doubleEndedButton.removeEventListener('click', this.handleDoubleEnded);
    this.skillButton.removeEventListener('click', this.handleSkill);
    document.removeEventListener('pointerdown', this.handleOutsidePointer);
    document.removeEventListener('keydown', this.handleKeyDown);
    cancelAnimationFrame(this.animationFrame);
    window.clearTimeout(this.exitTimer);
    document.documentElement.classList.remove('opening-active');
  }

  private readonly handleStart = () => {
    if (this.leaving) return;
    if (!this.ready) {
      this.startRequested = true;
      this.startButton.disabled = true;
      this.startButton.textContent = t('start.preparing');
      this.element.classList.add('start-requested');
      return;
    }
    this.beginStart();
  };

  private readonly handleRush = () => {
    if (!this.ready || this.leaving) return;
    this.closeChallengeMenu();
    this.onRush();
  };

  private readonly handleRandom = () => {
    if (!this.ready || this.leaving) return;
    this.closeChallengeMenu();
    this.onRandom();
  };

  private readonly handleExplore = () => {
    if (!this.ready || this.leaving) return;
    this.closeChallengeMenu();
    this.onExplore();
  };

  private readonly handleDoubleEnded = () => {
    if (!this.ready || this.leaving) return;
    this.closeChallengeMenu();
    this.onDoubleEnded();
  };

  private readonly handleSkill = () => {
    if (!this.ready || this.leaving) return;
    this.closeChallengeMenu();
    this.onSkill();
  };


  private readonly toggleChallengeMenu = () => {
    if (!this.ready || this.leaving) return;
    const open = this.challengeButton.getAttribute('aria-expanded') === 'true';
    if (open) this.closeChallengeMenu();
    else {
      this.challengeButton.setAttribute('aria-expanded', 'true');
      this.challengeMenu.setAttribute('aria-hidden', 'false');
      this.challengeMenu.classList.add('visible');
      this.randomButton.focus({ preventScroll: true });
    }
  };

  private readonly handleOutsidePointer = (event: PointerEvent) => {
    if (this.challengeButton.getAttribute('aria-expanded') !== 'true') return;
    const target = event.target as Node | null;
    if (target && (this.challengeMenu.contains(target) || this.challengeButton.contains(target))) return;
    this.closeChallengeMenu();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') this.closeChallengeMenu();
  };

  private closeChallengeMenu(): void {
    this.challengeButton.setAttribute('aria-expanded', 'false');
    this.challengeMenu.setAttribute('aria-hidden', 'true');
    this.challengeMenu.classList.remove('visible');
  }

  private beginStart(): void {
    if (this.leaving) return;
    this.onStart();
  }

  private readonly updateProgress = (now: number) => {
    const delta = this.lastFrameAt > 0 ? Math.min(50, now - this.lastFrameAt) : 16;
    this.lastFrameAt = now;
    if (!this.ready && this.displayedProgress < this.progressCeiling) {
      const remaining = this.progressCeiling - this.displayedProgress;
      this.displayedProgress += Math.min(remaining, delta * (0.000018 + remaining * 0.00011));
      this.writeProgress();
    }
    this.animationFrame = requestAnimationFrame(this.updateProgress);
  };

  private writeProgress(): void {
    const clamped = Math.max(0, Math.min(1, this.displayedProgress));
    const rounded = Math.round(clamped * 100);
    this.element.style.setProperty('--start-progress', clamped.toFixed(4));
    this.percent.textContent = `${rounded}%`;
    this.progressBar.setAttribute('aria-valuenow', String(rounded));
    this.onProgress?.(clamped);
  }

  private getElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing start-screen element: ${selector}`);
    return element;
  }
}
