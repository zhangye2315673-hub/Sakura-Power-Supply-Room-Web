import type { RushChallenge } from '../puzzle/rushChallenges';
import { getLocale, t, type TranslationKey } from './Locale';

type RushResult = 'success' | 'failure';

export type RushVisualPressure = {
  pressure: number;
  finalPressure: number;
  baseScale: number;
  tickScale: number;
  edgePressure: number;
};

export function capRushTimerScaleToTopQuarter(
  requestedScale: number,
  viewportHeight: number,
  timerTop: number,
  timerHeight: number,
): number {
  const safeTimerHeight = Math.max(1, timerHeight);
  const availableHeight = Math.max(safeTimerHeight, viewportHeight * 0.25 - timerTop);
  return Math.min(2, Math.max(1, requestedScale), availableHeight / safeTimerHeight);
}

export function mapRushTimerContentScale(requestedScale: number): number {
  return Math.min(2, Math.max(1, requestedScale));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function measureRushVisualPressure(
  remainingSeconds: number,
  timeLimitSeconds: number,
): RushVisualPressure {
  const safeTimeLimit = Math.max(1, timeLimitSeconds);
  const safeRemaining = Math.max(0, remainingSeconds);
  const pressure = clamp01(1 - safeRemaining / safeTimeLimit);
  const finalWindowSeconds = Math.min(12, Math.max(8, safeTimeLimit * 0.22));
  const finalPressure = clamp01(1 - safeRemaining / finalWindowSeconds);
  const baseScale = Math.min(2, 1 + Math.pow(finalPressure, 1.35));
  const tickScale = Math.min(
    2,
    baseScale + 0.018 + Math.pow(pressure, 1.65) * 0.122 + finalPressure * 0.08,
  );
  const edgePressure = clamp01(
    Math.pow(pressure, 2.1) * 0.3 + Math.pow(finalPressure, 1.05) * 0.82,
  );

  return { pressure, finalPressure, baseScale, tickScale, edgePressure };
}

type RushModeUiOptions = {
  onStart: () => void;
  onNext: () => void;
  onRetry: () => void;
  onHome: () => void;
};

export class RushModeUi {
  private readonly timer = this.getElement('#rush-timer');
  private readonly timerValue = this.getElement('#rush-timer-value');
  private readonly timerState = this.getElement('#rush-timer-state');
  private readonly edgeAlert = this.getElement('#rush-edge-alert');
  private readonly briefingPanel = this.getElement('#rush-briefing-panel');
  private readonly briefingTitle = this.getElement('#rush-briefing-title');
  private readonly briefingTime = this.getElement('#rush-briefing-time');
  private readonly briefingGoal = this.getElement('#rush-briefing-goal');
  private readonly briefingDifficulty = this.getElement('#rush-briefing-difficulty');
  private readonly startButton = this.getButton('#rush-start-button');
  private readonly briefingHomeButton = this.getButton('#rush-briefing-home-button');
  private readonly resultPanel = this.getElement('#rush-result-panel');
  private readonly resultEyebrow = this.getElement('#rush-result-eyebrow');
  private readonly resultTitle = this.getElement('#rush-result-title');
  private readonly resultDescription = this.getElement('#rush-result-description');
  private readonly nextButton = this.getButton('#rush-next-button');
  private readonly retryButton = this.getButton('#rush-retry-button');
  private readonly resultHomeButton = this.getButton('#rush-result-home-button');
  private challenge: RushChallenge | null = null;
  private result: RushResult | null = null;
  private lastDisplayedSeconds: number | null = null;
  private timerScaleCap = 2;

  constructor(private readonly options: RushModeUiOptions) {
    this.startButton.addEventListener('click', options.onStart);
    this.nextButton.addEventListener('click', options.onNext);
    this.retryButton.addEventListener('click', options.onRetry);
    this.briefingHomeButton.addEventListener('click', options.onHome);
    this.resultHomeButton.addEventListener('click', options.onHome);
  }

  showBriefing(challenge: RushChallenge): void {
    this.challenge = challenge;
    this.result = null;
    document.documentElement.classList.add('rush-active');
    document.documentElement.classList.remove('rush-running');
    this.resultPanel.classList.remove('visible');
    this.resultPanel.setAttribute('aria-hidden', 'true');
    this.briefingPanel.classList.add('visible');
    this.briefingPanel.setAttribute('aria-hidden', 'false');
    this.timer.classList.add('visible', 'waiting');
    this.timer.classList.remove('tick', 'warning', 'urgent', 'critical');
    this.timer.setAttribute('aria-hidden', 'false');
    this.edgeAlert.classList.remove('visible', 'tick');
    this.lastDisplayedSeconds = null;
    this.setTimer(challenge.timeLimitSeconds);
    this.refreshLocale();
  }

  showRunning(): void {
    this.briefingPanel.classList.remove('visible');
    this.briefingPanel.setAttribute('aria-hidden', 'true');
    this.timer.classList.remove('waiting');
    this.timerState.textContent = t('rush.timer.running');
    document.documentElement.classList.add('rush-running');
    this.edgeAlert.classList.add('visible');
  }

  setTimer(remainingSeconds: number): void {
    const seconds = Math.max(0, Math.ceil(remainingSeconds));
    const minutes = Math.floor(seconds / 60);
    this.timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    const timeLimit = Math.max(1, this.challenge?.timeLimitSeconds ?? seconds);
    const visual = measureRushVisualPressure(remainingSeconds, timeLimit);
    if (this.lastDisplayedSeconds === null || seconds !== this.lastDisplayedSeconds) {
      this.timerScaleCap = capRushTimerScaleToTopQuarter(
        2,
        window.innerHeight,
        this.timer.offsetTop,
        this.timer.offsetHeight,
      );
    }
    const baseScale = mapRushTimerContentScale(Math.min(visual.baseScale, this.timerScaleCap));
    const tickScale = mapRushTimerContentScale(Math.min(visual.tickScale, this.timerScaleCap));
    this.timer.style.setProperty('--rush-pressure', visual.pressure.toFixed(4));
    this.timer.style.setProperty('--rush-final-pressure', visual.finalPressure.toFixed(4));
    this.timer.style.setProperty('--rush-final-opacity', (visual.finalPressure * 0.9).toFixed(4));
    this.timer.style.setProperty('--rush-base-scale', baseScale.toFixed(4));
    this.timer.style.setProperty('--rush-tick-scale', tickScale.toFixed(4));
    this.edgeAlert.style.setProperty('--rush-edge-pressure', visual.edgePressure.toFixed(4));
    this.edgeAlert.style.setProperty('--rush-edge-opacity', (visual.edgePressure * 0.82).toFixed(4));
    this.timer.classList.toggle('warning', remainingSeconds > 10 && visual.pressure >= 0.68);
    this.timer.classList.toggle('urgent', remainingSeconds > 0 && remainingSeconds <= 10);
    this.timer.classList.toggle('critical', remainingSeconds > 0 && remainingSeconds <= 5);
    if (
      !this.timer.classList.contains('waiting')
      && this.lastDisplayedSeconds !== null
      && seconds !== this.lastDisplayedSeconds
    ) {
      this.timer.classList.remove('tick');
      this.edgeAlert.classList.remove('tick');
      void this.timer.offsetWidth;
      this.timer.classList.add('tick');
      this.edgeAlert.classList.add('tick');
    }
    this.lastDisplayedSeconds = seconds;
  }

  showResult(result: RushResult): void {
    this.result = result;
    this.briefingPanel.classList.remove('visible');
    this.briefingPanel.setAttribute('aria-hidden', 'true');
    this.timer.classList.remove('visible', 'waiting', 'tick', 'warning', 'urgent', 'critical');
    this.timer.setAttribute('aria-hidden', 'true');
    this.edgeAlert.classList.remove('visible', 'tick');
    document.documentElement.classList.remove('rush-running');
    this.lastDisplayedSeconds = null;
    this.resultPanel.classList.add('visible');
    this.resultPanel.setAttribute('aria-hidden', 'false');
    this.nextButton.hidden = result !== 'success';
    this.retryButton.hidden = result !== 'failure';
    this.refreshLocale();
  }

  hide(): void {
    this.challenge = null;
    this.result = null;
    document.documentElement.classList.remove('rush-active', 'rush-running');
    this.timer.classList.remove('visible', 'waiting', 'tick', 'warning', 'urgent', 'critical');
    this.timer.setAttribute('aria-hidden', 'true');
    this.timer.style.removeProperty('--rush-pressure');
    this.timer.style.removeProperty('--rush-final-pressure');
    this.timer.style.removeProperty('--rush-final-opacity');
    this.timer.style.removeProperty('--rush-base-scale');
    this.timer.style.removeProperty('--rush-tick-scale');
    this.edgeAlert.classList.remove('visible', 'tick');
    this.edgeAlert.style.removeProperty('--rush-edge-pressure');
    this.edgeAlert.style.removeProperty('--rush-edge-opacity');
    this.lastDisplayedSeconds = null;
    this.timerScaleCap = 2;
    this.briefingPanel.classList.remove('visible');
    this.briefingPanel.setAttribute('aria-hidden', 'true');
    this.resultPanel.classList.remove('visible');
    this.resultPanel.setAttribute('aria-hidden', 'true');
  }

  refreshLocale(): void {
    if (this.challenge) {
      const locale = getLocale();
      this.briefingTitle.textContent = this.challenge.title[locale];
      this.briefingTime.textContent = t('rush.briefing.time', { seconds: this.challenge.timeLimitSeconds });
      this.briefingGoal.textContent = this.challenge.objective[locale];
      this.briefingDifficulty.textContent = t(
        `rush.difficulty.${this.challenge.level.difficulty}` as TranslationKey,
      );
    }
    this.timerState.textContent = this.timer.classList.contains('waiting')
      ? t('rush.timer.ready')
      : t('rush.timer.running');
    this.startButton.textContent = t('rush.briefing.start');
    this.briefingHomeButton.textContent = t('actions.home');
    this.nextButton.textContent = t('complete.retry');
    this.retryButton.textContent = t('rush.result.retry');
    this.resultHomeButton.textContent = t('actions.home');
    if (!this.result) return;
    const success = this.result === 'success';
    this.resultEyebrow.textContent = success ? 'RUSH CLEARED' : 'TIME OVER';
    this.resultTitle.textContent = t(success ? 'rush.result.success' : 'rush.result.failure');
    this.resultDescription.textContent = t(
      success ? 'rush.result.successDescription' : 'rush.result.failureDescription',
    );
    this.resultPanel.setAttribute(
      'aria-label',
      getLocale() === 'zh' ? `RUSH ${success ? '挑战成功' : '挑战失败'}` : `RUSH ${success ? 'success' : 'failure'}`,
    );
  }

  dispose(): void {
    this.startButton.removeEventListener('click', this.options.onStart);
    this.nextButton.removeEventListener('click', this.options.onNext);
    this.retryButton.removeEventListener('click', this.options.onRetry);
    this.briefingHomeButton.removeEventListener('click', this.options.onHome);
    this.resultHomeButton.removeEventListener('click', this.options.onHome);
    this.hide();
  }

  private getElement(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing RUSH UI element: ${selector}`);
    return element;
  }

  private getButton(selector: string): HTMLButtonElement {
    const element = document.querySelector<HTMLButtonElement>(selector);
    if (!element) throw new Error(`Missing RUSH UI button: ${selector}`);
    return element;
  }
}
