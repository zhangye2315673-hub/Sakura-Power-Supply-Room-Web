import { t } from './Locale';

type DoubleEndedModeUiOptions = {
  onStart: () => void;
  onHome: () => void;
};

export class DoubleEndedModeUi {
  private readonly panel = this.getElement('#double-ended-briefing-panel');
  private readonly eyebrow = this.getElement('#double-ended-briefing-eyebrow');
  private readonly title = this.getElement('#double-ended-briefing-title');
  private readonly rule = this.getElement('#double-ended-briefing-rule');
  private readonly hint = this.getElement('#double-ended-briefing-hint');
  private readonly startButton = this.getButton('#double-ended-start-button');
  private readonly homeButton = this.getButton('#double-ended-home-button');
  private briefing = false;

  constructor(private readonly options: DoubleEndedModeUiOptions) {
    this.startButton.addEventListener('click', options.onStart);
    this.homeButton.addEventListener('click', options.onHome);
  }

  get briefingVisible(): boolean {
    return this.briefing;
  }

  showBriefing(): void {
    this.briefing = true;
    document.documentElement.classList.add('double-ended-active', 'double-ended-briefing');
    this.panel.classList.add('visible');
    this.panel.setAttribute('aria-hidden', 'false');
    this.refreshLocale();
  }

  showPlaying(): void {
    this.briefing = false;
    document.documentElement.classList.add('double-ended-active');
    document.documentElement.classList.remove('double-ended-briefing');
    this.panel.classList.remove('visible');
    this.panel.setAttribute('aria-hidden', 'true');
  }

  hide(): void {
    this.briefing = false;
    document.documentElement.classList.remove('double-ended-active', 'double-ended-briefing');
    this.panel.classList.remove('visible');
    this.panel.setAttribute('aria-hidden', 'true');
  }

  refreshLocale(): void {
    this.eyebrow.textContent = t('doubleEnded.briefing.eyebrow');
    this.title.textContent = t('doubleEnded.briefing.title');
    this.rule.textContent = t('doubleEnded.briefing.rule');
    this.hint.textContent = t('doubleEnded.briefing.hint');
    this.startButton.textContent = t('doubleEnded.briefing.start');
    this.homeButton.textContent = t('actions.home');
  }

  dispose(): void {
    this.startButton.removeEventListener('click', this.options.onStart);
    this.homeButton.removeEventListener('click', this.options.onHome);
    this.hide();
  }

  private getElement(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing double-ended UI element: ${selector}`);
    return element;
  }

  private getButton(selector: string): HTMLButtonElement {
    const element = document.querySelector<HTMLButtonElement>(selector);
    if (!element) throw new Error(`Missing double-ended UI button: ${selector}`);
    return element;
  }
}
