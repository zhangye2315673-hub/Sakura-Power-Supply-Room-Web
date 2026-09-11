import { CampaignProgress, campaignTime, type CampaignOutcome } from '../game/CampaignProgress';
import { shapeLabel, t, campaignChapterText } from './Locale';

type Level = { id: number; shape: string; targetCount: number };
export class CampaignUi {
  private readonly goal = document.createElement('details');
  private readonly dialog = document.createElement('dialog');
  private currentId: number | null = null;
  private completion: { id: number; outcome: CampaignOutcome } | null = null;
  private readonly events = new AbortController();
  private readonly homeProgress = document.querySelector<HTMLElement>('#start-campaign-progress')!;
  private readonly hudProgress = document.querySelector<HTMLElement>('#campaign-hud-progress')!;
  private readonly summary = document.querySelector<HTMLElement>('#complete-campaign-summary')!;
  private readonly retry = document.createElement('button');
  private readonly improve = document.createElement('button');

  constructor(private readonly progress: CampaignProgress, private readonly levels: readonly Level[],
    onSelect: (id: number) => void, onRetry: () => void) {
    this.goal.id = 'campaign-goal';
    this.goal.hidden = true;
    this.goal.innerHTML = '<summary></summary><div class="campaign-goal-body"><span></span><p></p></div>';
    document.querySelector('#app')!.append(this.goal);
    this.dialog.id = 'campaign-dialog';
    this.dialog.className = 'complete-card';
    this.dialog.setAttribute('aria-labelledby', 'campaign-dialog-title');
    this.dialog.innerHTML = `<header><h2 id="campaign-dialog-title"></h2><button id="campaign-close" type="button"></button></header>
      <p id="campaign-dialog-progress"></p><div id="campaign-level-list"></div>`;
    document.querySelector('#app')!.append(this.dialog);
    const options = { signal: this.events.signal };
    this.dialog.querySelector('#campaign-close')!.addEventListener('click', () => this.dialog.close(), options);
    this.dialog.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-campaign-level]');
      if (!button || button.disabled) return;
      const id = Number(button.dataset.campaignLevel);
      if (!progress.isUnlocked(id)) return;
      this.dialog.close();
      onSelect(id);
    }, options);
    this.retry.type = this.improve.type = 'button';
    this.retry.id = 'complete-retry-button';
    this.improve.id = 'complete-improve-button';
    this.retry.hidden = this.improve.hidden = true;
    document.querySelector('#complete-panel .complete-actions')!.prepend(this.retry);
    document.querySelector('#complete-panel .complete-actions')!.append(this.improve);
    this.retry.addEventListener('click', onRetry, options);
    this.improve.addEventListener('click', () => onSelect(progress.snapshot().replayLevel), options);
    this.refresh();
  }

  setCurrent(id: number | null): void {
    this.currentId = id;
    this.goal.hidden = true;
    this.goal.open = false;
    this.completion = null;
    this.summary.hidden = this.retry.hidden = this.improve.hidden = true;
    this.refresh();
  }

  revealGoal(): void {
    return;
  }

  collapseGoal(): void { this.goal.open = false; }

  hideGoal(): void { this.goal.hidden = true; }

  show(): void {
    this.refresh();
    if (!this.dialog.open) this.dialog.showModal();
  }

  complete(id: number | null, outcome?: CampaignOutcome): void {
    this.goal.hidden = true;
    this.completion = id && outcome ? { id, outcome } : null;
    this.refresh();
  }

  refresh(): void {
    const snapshot = this.progress.snapshot();
    const count = this.levels.length;
    const params = { done: snapshot.completed.length, count, stars: snapshot.totalStars, total: count * 3 };
    this.homeProgress.hidden = false;
    this.homeProgress.querySelector('#start-campaign-value')!.textContent = `${params.done} / ${count}`;
    this.homeProgress.querySelector('#start-campaign-stars')!.textContent = `★ ${params.stars} / ${params.total}`;
    this.homeProgress.setAttribute('aria-label', t('campaign.counts', params));
    this.hudProgress.hidden = this.currentId === null;
    if (this.currentId !== null) {
      const level = this.levels.find(l => l.id === this.currentId)!;
      const text = campaignChapterText(level.id);
      this.hudProgress.textContent = t('campaign.level', { level: level.id, count, shape: text.name });
      this.goal.querySelector('summary')!.textContent = t('campaign.brief.title', { level: level.id, name: text.name });
      this.goal.querySelector('span')!.textContent = t('campaign.brief.meta', { shape: shapeLabel(level.shape), count: level.targetCount });
      this.goal.querySelector('p')!.textContent = text.goal;
    }
    this.dialog.querySelector('h2')!.textContent = t('campaign.overview');
    this.dialog.querySelector('#campaign-close')!.textContent = t('campaign.close');
    this.dialog.querySelector('#campaign-dialog-progress')!.textContent = t('campaign.counts', params);
    const list = this.dialog.querySelector('#campaign-level-list')!;
    list.replaceChildren(...this.levels.map(level => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.campaignLevel = String(level.id);
      button.disabled = !this.progress.isUnlocked(level.id);
      const done = snapshot.completed.includes(level.id);
      const current = level.id === (this.currentId ?? snapshot.nextLevel);
      button.dataset.state = button.disabled ? 'locked' : done ? 'done' : current ? 'current' : 'unlocked';
      if (current && !button.disabled) button.setAttribute('aria-current', 'step');
      const text = campaignChapterText(level.id);
      const label = document.createElement('strong');
      label.textContent = `${String(level.id).padStart(2, '0')} · ${text.name}`;
      const state = document.createElement('span');
      state.textContent = button.disabled ? t('campaign.locked', { level: level.id - 1 })
        : [done ? t('campaign.done') : t('campaign.unlocked'), current ? t('campaign.current') : ''].filter(Boolean).join(' · ');
      const rating = document.createElement('small');
      const best = snapshot.best[level.id];
      rating.textContent = best ? `${'★'.repeat(best.stars)}${'☆'.repeat(3 - best.stars)} · ${campaignTime(best.timeMs)}`
        : done ? t('campaign.noScore') : '☆☆☆';
      button.append(label, state, rating);
      return button;
    }));
    this.retry.textContent = t('campaign.retry');
    this.improve.textContent = t('campaign.replay');
    this.retry.hidden = this.improve.hidden = this.summary.hidden = !this.completion;
    const home = document.querySelector('#complete-home-button')!;
    const next = document.querySelector<HTMLElement>('#continue-button')!;
    home.textContent = t(this.completion ? 'campaign.back' : 'complete.home');
    document.querySelector('#complete-panel h1')!.textContent = t('complete.title');
    document.querySelector('#complete-panel .complete-actions')!.classList.toggle('campaign-actions', Boolean(this.completion));
    next.hidden = false;
    if (!this.completion) return;
    const { id } = this.completion;
    const final = id === count || snapshot.allComplete;
    const level = this.levels.find(l => l.id === id)!;
    const lines: string[] = [t('campaign.level', { level: id, count, shape: campaignChapterText(level.id).name })];
    if (final) {
      document.querySelector('#complete-panel h1')!.textContent = t(snapshot.allComplete ? 'campaign.complete' : 'campaign.partial');
      lines.push(t('campaign.completeShort'));
    } else {
      const upcoming = campaignChapterText(id + 1);
      lines.push(t('campaign.preview', upcoming));
    }
    this.summary.replaceChildren(...lines.map(text => {
      const line = document.createElement('div');
      line.textContent = text;
      return line;
    }));
    this.improve.hidden = !final || snapshot.totalStars === count * 3;
    next.hidden = id === count;
    if (id < count) next.textContent = t('campaign.next', { level: id + 1 });
  }

  dispose(): void {
    this.events.abort();
    this.dialog.remove();
    this.goal.remove();
    this.retry.remove();
    this.improve.remove();
  }
}
