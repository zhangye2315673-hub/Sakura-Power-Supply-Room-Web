import type { GachaCard, SkillChallengeState, SkillStatusId, StatusInstance } from './SkillChallengeEngine';
import {
  GACHA_TIER_LABELS,
  getApplianceCardLabel,
  getSkillCardStyle,
  renderSkillCardSymbol,
} from './SkillCardPresentation';
import './SkillCardPresentation.css';

type SkillChallengeUiOptions = {
  onCardSelected: (index: number) => void;
};

const GACHA_CARD_REVEAL_MS = 4200;

const STATUS_LABELS: Record<SkillStatusId, { name: string; description: string }> = {
  'dry-shield': { name: '干燥护罩', description: '抵挡下一次新增的负面状态。' },
  'iridescent-bubble': { name: '虹膜泡泡', description: '抵挡一次受阻点击。' },
  'soothing-record': { name: '安心旋律', description: '抵挡一次受阻点击。' },
  continue: { name: '继续游戏', description: '生命归零时复活并恢复生命。' },
  'induction-reveal': { name: '感应显线', description: '持续标记全部真实出口。' },
  'bass-spacing': { name: '节拍扩距', description: '线与线外轮廓之间的净空约为原来的 2 倍，不改变可抽判定。' },
  'bathroom-steam': { name: '浴室蒸汽', description: '蒸汽遮挡画面，正确抽线后逐回合消退。' },
  'frozen-plug': { name: '急冻封头', description: '部分真实出口暂时无法抽取。' },
  'coffee-lock': { name: '咖啡封技', description: '咖啡遮蔽线色；家电照常连接和播放动画，但技能暂时被封锁。' },
  'rice-thick-cable': { name: '米饭粗线', description: '线缆暂时视觉膨胀，不改变碰撞。' },
  'overheated-plug': { name: '限时取餐', description: '必须在接下来两次成功拔线内拔出被加热标记的线，否则失去一格生命。' },
  'fake-double-plug': { name: '双头伪装', description: '普通尾端生成永久假插头。' },
};

export class SkillChallengeUi {
  private readonly root = this.getElement<HTMLElement>('#skill-challenge-ui');
  private readonly statusRack = this.getElement<HTMLElement>('#skill-status-rack');
  private readonly buffSlot = this.getElement<HTMLElement>('#skill-buff-slot');
  private readonly debuffSlot = this.getElement<HTMLElement>('#skill-debuff-slot');
  private readonly printer = this.getElement<HTMLElement>('#skill-printer-pending');
  private readonly cue = this.getElement<HTMLElement>('#skill-cue');
  private readonly cueTitle = this.getElement<HTMLElement>('#skill-cue-title');
  private readonly cuePhase = this.getElement<HTMLElement>('#skill-cue-phase');
  private readonly cueSource = this.getElement<HTMLElement>('#skill-cue-source');
  private readonly cueDetail = this.getElement<HTMLElement>('#skill-cue-detail');
  private readonly screenEffect = this.getElement<HTMLElement>('#skill-screen-effect');
  private readonly cardPanel = this.getElement<HTMLElement>('#skill-card-panel');
  private readonly cardList = this.getElement<HTMLElement>('#skill-card-list');
  private readonly recyclePrompt = this.getElement<HTMLElement>('#skill-recycle-prompt');
  private cueTimer = 0;
  private cuePointerInside = false;
  private cueFocusInside = false;
  private cardLocked = false;
  private cardRevealTimer = 0;
  private buffDeletionTimer = 0;
  private buffDeletionElements: HTMLElement[] = [];

  constructor(private readonly options: SkillChallengeUiOptions) {
    this.cue.addEventListener('pointerenter', this.onCuePointerEnter);
    this.cue.addEventListener('pointerleave', this.onCuePointerLeave);
    this.cue.addEventListener('focusin', this.onCueFocusIn);
    this.cue.addEventListener('focusout', this.onCueFocusOut);
  }

  setVisible(visible: boolean): void {
    this.root.classList.toggle('visible', visible);
    this.root.setAttribute('aria-hidden', String(!visible));
    this.statusRack.classList.toggle('visible', visible);
    this.statusRack.setAttribute('aria-hidden', String(!visible));
    if (!visible) this.resetTransient();
  }

  render(state: Readonly<SkillChallengeState>): void {
    this.renderSlot(this.buffSlot, state.buff, 'BUFF');
    this.renderSlot(this.debuffSlot, state.debuff, 'DEBUFF');
    this.printer.classList.toggle('visible', state.printerCopyReady);
    this.printer.setAttribute('aria-hidden', String(!state.printerCopyReady));
    const effect = state.debuff?.id ?? state.buff?.id ?? 'none';
    this.screenEffect.dataset.effect = effect;
    this.screenEffect.classList.remove('active');
  }

  showComputerBuffDeleted(): void {
    this.clearBuffDeletion();
    if (!this.buffSlot.classList.contains('occupied')) return;
    const rect = this.buffSlot.getBoundingClientRect();
    const ghost = this.buffSlot.cloneNode(true) as HTMLElement;
    ghost.id = '';
    ghost.classList.add('skill-status-delete-ghost');
    ghost.querySelector('.skill-status-tooltip')?.remove();
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.append(ghost);
    this.buffDeletionElements.push(ghost);

    for (let index = 0; index < 8; index += 1) {
      const pixel = document.createElement('i');
      pixel.className = 'skill-status-delete-pixel';
      pixel.style.left = `${rect.left + rect.width * 0.5}px`;
      pixel.style.top = `${rect.top + rect.height * 0.5}px`;
      pixel.style.setProperty('--delete-pixel-index', String(index));
      document.body.append(pixel);
      this.buffDeletionElements.push(pixel);
    }

    const label = document.createElement('strong');
    label.className = 'skill-status-delete-label';
    label.textContent = 'BUFF DELETED';
    label.style.left = `${rect.left + rect.width * 0.5}px`;
    label.style.top = `${rect.bottom + 7}px`;
    document.body.append(label);
    this.buffDeletionElements.push(label);
    document.documentElement.classList.add('desktop-buff-deleting');
    this.buffDeletionTimer = window.setTimeout(() => this.clearBuffDeletion(), 1_150);
  }

  showCue(label: string, phase: 'cue' | 'commit' | 'settle' = 'cue', detail = '', source = '家电连接完成'): void {
    window.clearTimeout(this.cueTimer);
    this.cuePointerInside = this.cue.matches(':hover');
    this.cueFocusInside = this.cue.contains(document.activeElement);
    this.cueTitle.textContent = label;
    this.cueSource.textContent = source;
    this.cueDetail.textContent = detail;
    this.cuePhase.textContent = this.phaseLabel(phase);
    this.cue.dataset.phase = phase;
    this.cue.classList.add('visible');
    this.cue.style.pointerEvents = 'auto';
    this.cue.setAttribute('aria-hidden', 'false');
    this.scheduleCueHide(5000);
  }

  setCuePhase(phase: 'commit' | 'settle', label?: string): void {
    if (!this.cue.classList.contains('visible')) return;
    this.cue.dataset.phase = phase;
    this.cuePhase.textContent = label ?? this.phaseLabel(phase);
  }

  showCards(cards: readonly GachaCard[]): void {
    this.cardLocked = false;
    this.cardList.replaceChildren();
    cards.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      const tierKind = card.tier.endsWith('benefit') ? 'benefit' : 'risk';
      const tierStrength = card.tier.startsWith('strong') ? 'strong' : 'normal';
      const longTitle = card.label.length >= 8 ? ' is-long-title' : '';
      const longCopy = card.description.length >= 30 ? ' is-long-copy' : '';
      const applianceLabel = getApplianceCardLabel(card.appliance);
      button.className = `skill-card skill-card--${tierKind} skill-card--${tierStrength}`;
      button.setAttribute('aria-label', `选择第 ${index + 1} 张扭蛋卡`);
      button.dataset.skillId = card.skillId;
      button.dataset.appliance = card.appliance;
      button.dataset.tier = card.tier;
      button.style.cssText = getSkillCardStyle(card.skillId);
      button.innerHTML = `
        <span class="skill-card-face skill-card-back">
          <span class="skill-card-frame">
            <span class="skill-card-inset skill-card-back-inset">
              <span class="skill-card-random">随机</span>
              <strong class="skill-card-question">?</strong>
            </span>
          </span>
        </span>
        <span class="skill-card-face skill-card-front">
          <span class="skill-card-frame">
            <span class="skill-card-inset skill-card-front-inset">
              <i>${applianceLabel}</i>
              <b class="${longTitle.trim()}" title="${card.label}">${card.label}</b>
              <span class="skill-card-symbol-stage" role="img" aria-label="${card.label}技能符号">${renderSkillCardSymbol(card.skillId)}</span>
              <span class="skill-card-tier">${GACHA_TIER_LABELS[card.tier]}</span>
              <small class="${longCopy.trim()}">${card.description}</small>
            </span>
          </span>
        </span>`;
      button.addEventListener('click', () => {
        if (this.cardLocked) return;
        this.cardLocked = true;
        button.setAttribute('aria-label', `已选择${applianceLabel}：${card.label}`);
        button.classList.add('selected');
        [...this.cardList.querySelectorAll<HTMLButtonElement>('.skill-card')].forEach((candidate) => {
          candidate.disabled = true;
          if (candidate !== button) candidate.classList.add('dismissed');
        });
         window.clearTimeout(this.cardRevealTimer);
         this.cardRevealTimer = window.setTimeout(() => {
           this.cardRevealTimer = 0;
           this.options.onCardSelected(index);
         }, GACHA_CARD_REVEAL_MS);
      }, { once: true });
      this.cardList.append(button);
    });
    this.cardPanel.classList.add('visible');
    this.cardPanel.setAttribute('aria-hidden', 'false');
  }

  hideCards(): void {
    window.clearTimeout(this.cardRevealTimer);
    this.cardRevealTimer = 0;
    this.cardPanel.classList.remove('visible');
    this.cardPanel.setAttribute('aria-hidden', 'true');
    this.cardLocked = false;
  }

  setRecycleSelection(active: boolean): void {
    this.recyclePrompt.classList.toggle('visible', active);
    this.recyclePrompt.setAttribute('aria-hidden', String(!active));
    document.documentElement.classList.toggle('skill-recycle-selecting', active);
  }

  setInputLocked(locked: boolean): void {
    document.documentElement.classList.toggle('skill-input-locked', locked);
  }

  resetTransient(): void {
    window.clearTimeout(this.cueTimer);
    this.cueTimer = 0;
    window.clearTimeout(this.cardRevealTimer);
    this.cardRevealTimer = 0;
    this.cuePointerInside = false;
    this.cueFocusInside = false;
    this.cue.classList.remove('visible');
    this.cue.style.pointerEvents = 'none';
    this.cue.setAttribute('aria-hidden', 'true');
    this.hideCards();
    this.setRecycleSelection(false);
    this.setInputLocked(false);
    this.screenEffect.dataset.effect = 'none';
    this.screenEffect.classList.remove('active');
    this.clearBuffDeletion();
  }

  dispose(): void {
    window.clearTimeout(this.cueTimer);
    window.clearTimeout(this.cardRevealTimer);
    this.clearBuffDeletion();
    this.cue.removeEventListener('pointerenter', this.onCuePointerEnter);
    this.cue.removeEventListener('pointerleave', this.onCuePointerLeave);
    this.cue.removeEventListener('focusin', this.onCueFocusIn);
    this.cue.removeEventListener('focusout', this.onCueFocusOut);
    this.resetTransient();
  }

  private clearBuffDeletion(): void {
    window.clearTimeout(this.buffDeletionTimer);
    this.buffDeletionTimer = 0;
    document.documentElement.classList.remove('desktop-buff-deleting');
    this.buffDeletionElements.forEach((element) => element.remove());
    this.buffDeletionElements = [];
  }

  private readonly onCuePointerEnter = (): void => {
    this.cuePointerInside = true;
    window.clearTimeout(this.cueTimer);
    this.cueTimer = 0;
  };

  private readonly onCuePointerLeave = (): void => {
    this.cuePointerInside = false;
    this.scheduleCueHide(1000);
  };

  private readonly onCueFocusIn = (): void => {
    this.cueFocusInside = true;
    window.clearTimeout(this.cueTimer);
    this.cueTimer = 0;
  };

  private readonly onCueFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget instanceof Node && this.cue.contains(event.relatedTarget)) return;
    this.cueFocusInside = false;
    this.scheduleCueHide(1000);
  };

  private scheduleCueHide(delayMs: number): void {
    window.clearTimeout(this.cueTimer);
    if (this.cuePointerInside || this.cueFocusInside) return;
    this.cueTimer = window.setTimeout(() => {
      if (this.cuePointerInside || this.cueFocusInside) return;
      this.cue.classList.remove('visible');
      this.cue.style.pointerEvents = 'none';
      this.cue.setAttribute('aria-hidden', 'true');
      this.cueTimer = 0;
    }, delayMs);
  }

  private renderSlot(element: HTMLElement, instance: StatusInstance | null, slotLabel: string): void {
    const mark = element.querySelector<HTMLElement>('.skill-status-mark');
    const name = element.querySelector<HTMLElement>('.skill-status-name');
    const count = element.querySelector<HTMLElement>('.skill-status-count');
    const detail = element.querySelector<HTMLElement>('.skill-status-detail');
    element.classList.toggle('occupied', instance !== null);
    element.dataset.status = instance?.id ?? 'empty';
    if (!instance) {
      if (mark) mark.textContent = '';
      if (name) name.textContent = slotLabel;
      if (count) count.textContent = '';
      if (detail) detail.textContent = '';
      element.removeAttribute('tabindex');
      element.removeAttribute('aria-label');
      return;
    }
    const metadata = STATUS_LABELS[instance.id];
    if (mark) mark.textContent = '';
    if (name) name.textContent = metadata.name;
    if (count) count.textContent = this.statusCount(instance);
    if (detail) detail.textContent = `${metadata.description}${this.statusDuration(instance)}`;
    element.tabIndex = 0;
    element.setAttribute('aria-label', `${metadata.name}。${metadata.description}${this.statusDuration(instance)}`);
  }

  private statusDuration(instance: StatusInstance): string {
    if (instance.id === 'fake-double-plug') return ` 当前影响 ${instance.targetCableIds.length} 根线。`;
    if (instance.id === 'continue') return ` 复活时恢复 ${Number(instance.payload.restoreLives ?? 1)} 格生命。`;
    if (instance.turnsRemaining === null) return ' 持续到触发或挑战结束。';
    return ` 剩余 ${instance.turnsRemaining} 回合。`;
  }

  private phaseLabel(phase: 'cue' | 'commit' | 'settle'): string {
    if (phase === 'commit') return '效果生效';
    if (phase === 'settle') return '结算完成';
    return '技能发动';
  }

  private statusCount(instance: StatusInstance): string {
    if (instance.id === 'fake-double-plug') return String(instance.targetCableIds.length);
    if (instance.id === 'soothing-record') return '1';
    if (instance.id === 'continue') return `1/${Number(instance.payload.restoreLives ?? 1)}`;
    return instance.turnsRemaining === null ? '' : String(instance.turnsRemaining);
  }

  private getElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing skill challenge UI element: ${selector}`);
    return element;
  }
}
