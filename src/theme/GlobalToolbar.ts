import { Leaf, Moon, Sun, Volume2, VolumeX, createElement, type IconNode } from 'lucide';
import type { AudioManager } from '../audio/AudioManager';
import { SEASON_MODES, SEASON_PROFILES, type SeasonMode } from './SeasonProfiles';
import type { SeasonController, SeasonSnapshot } from './SeasonController';
import type { ThemeController, ThemeSnapshot } from './ThemeController';

function setIcon(button: HTMLButtonElement, icon: IconNode): void {
  button.replaceChildren(createElement(icon, {
    width: 17,
    height: 17,
    'stroke-width': 2.2,
    'aria-hidden': 'true',
  }));
}

export class GlobalToolbar {
  private readonly element = document.createElement('nav');
  private readonly themeButton = document.createElement('button');
  private readonly seasonWrap = document.createElement('div');
  private readonly seasonButton = document.createElement('button');
  private readonly seasonMenu = document.createElement('div');
  private readonly audioButton = document.createElement('button');
  private readonly unsubscribeTheme: () => void;
  private readonly unsubscribeSeason: () => void;
  private readonly unsubscribeAudio: () => void;
  private themeLocked = false;

  constructor(
    private readonly theme: ThemeController,
    private readonly season: SeasonController,
    private readonly audio: AudioManager,
    languageButton: HTMLButtonElement,
  ) {
    this.element.id = 'global-toolbar';
    this.element.setAttribute('aria-label', '全局设置');
    this.themeButton.id = 'theme-button';
    this.seasonWrap.id = 'season-picker';
    this.seasonButton.id = 'season-button';
    this.seasonMenu.id = 'season-menu';
    this.audioButton.id = 'audio-button';
    this.themeButton.type = 'button';
    this.seasonButton.type = 'button';
    this.audioButton.type = 'button';
    this.themeButton.addEventListener('click', this.onThemeClick);
    this.seasonButton.addEventListener('click', this.onSeasonToggle);
    this.seasonButton.addEventListener('keydown', this.onSeasonButtonKeyDown);
    this.audioButton.addEventListener('click', this.onAudioClick);
    document.addEventListener('pointerdown', this.onDocumentPointerDown);
    document.addEventListener('keydown', this.onDocumentKeyDown);
    languageButton.classList.add('global-language-button');
    this.seasonButton.setAttribute('aria-haspopup', 'menu');
    this.seasonButton.setAttribute('aria-controls', 'season-menu');
    this.seasonButton.setAttribute('aria-expanded', 'false');
    this.seasonMenu.setAttribute('role', 'menu');
    this.seasonMenu.setAttribute('aria-hidden', 'true');
    for (const mode of SEASON_MODES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.season = mode;
      button.setAttribute('role', 'menuitemradio');
      button.textContent = `${SEASON_PROFILES[mode].label}季`;
      button.addEventListener('click', () => this.selectSeason(mode));
      this.seasonMenu.append(button);
    }
    this.seasonWrap.append(this.seasonButton, this.seasonMenu);
    this.element.append(this.seasonWrap, this.themeButton, this.audioButton, languageButton);
    document.querySelector('#app')?.append(this.element);
    this.unsubscribeTheme = theme.subscribe((snapshot) => this.renderTheme(snapshot));
    this.unsubscribeSeason = season.subscribe((snapshot) => this.renderSeason(snapshot));
    this.unsubscribeAudio = audio.subscribe((muted) => this.renderAudio(muted));
  }

  dispose(): void {
    this.unsubscribeTheme();
    this.unsubscribeSeason();
    this.unsubscribeAudio();
    this.themeButton.removeEventListener('click', this.onThemeClick);
    this.seasonButton.removeEventListener('click', this.onSeasonToggle);
    this.seasonButton.removeEventListener('keydown', this.onSeasonButtonKeyDown);
    this.audioButton.removeEventListener('click', this.onAudioClick);
    document.removeEventListener('pointerdown', this.onDocumentPointerDown);
    document.removeEventListener('keydown', this.onDocumentKeyDown);
    this.element.remove();
  }

  setThemeLocked(locked: boolean): void {
    this.themeLocked = locked;
    this.themeButton.disabled = locked;
    this.themeButton.title = locked ? '探索模式固定为夜晚' : this.themeButton.title;
    this.themeButton.setAttribute('aria-disabled', String(locked));
  }

  private readonly onThemeClick = () => {
    if (!this.themeLocked) this.theme.toggle();
  };
  private readonly onSeasonToggle = () => this.setSeasonMenuOpen(!this.seasonMenu.classList.contains('visible'));
  private readonly onAudioClick = () => this.audio.setMuted(!this.audio.muted, true);
  private readonly onSeasonButtonKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    event.stopPropagation();
    this.setSeasonMenuOpen(true, event.key === 'ArrowUp' ? 'last' : 'selected');
  };
  private readonly onDocumentPointerDown = (event: PointerEvent) => {
    if (!(event.target instanceof Node) || this.seasonWrap.contains(event.target)) return;
    this.setSeasonMenuOpen(false);
  };
  private readonly onDocumentKeyDown = (event: KeyboardEvent) => {
    if (!this.seasonMenu.classList.contains('visible')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.setSeasonMenuOpen(false);
      this.seasonButton.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...this.seasonMenu.querySelectorAll<HTMLButtonElement>('button[data-season]')];
    if (buttons.length === 0) return;
    event.preventDefault();
    const activeIndex = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
  };

  private selectSeason(mode: SeasonMode): void {
    this.season.setMode(mode, true);
    this.setSeasonMenuOpen(false);
    this.seasonButton.focus();
  }

  private setSeasonMenuOpen(open: boolean, focus: 'selected' | 'last' | null = null): void {
    this.seasonMenu.classList.toggle('visible', open);
    this.seasonButton.setAttribute('aria-expanded', String(open));
    this.seasonMenu.setAttribute('aria-hidden', String(!open));
    if (!open || !focus) return;
    const target = focus === 'last'
      ? this.seasonMenu.querySelector<HTMLButtonElement>('button[data-season]:last-child')
      : this.seasonMenu.querySelector<HTMLButtonElement>('button.active')
        ?? this.seasonMenu.querySelector<HTMLButtonElement>('button[data-season]');
    target?.focus();
  }

  private renderSeason(snapshot: SeasonSnapshot): void {
    setIcon(this.seasonButton, Leaf);
    const target = SEASON_PROFILES[snapshot.targetMode];
    const label = `选择季节，当前${target.label}季`;
    this.seasonButton.title = label;
    this.seasonButton.setAttribute('aria-label', label);
    this.seasonButton.dataset.season = snapshot.targetMode;
    this.seasonButton.dataset.label = target.label;
    this.seasonMenu.querySelectorAll<HTMLButtonElement>('button[data-season]').forEach((button) => {
      const selected = button.dataset.season === snapshot.targetMode;
      button.setAttribute('aria-checked', String(selected));
      button.classList.toggle('active', selected);
    });
  }

  private renderTheme(snapshot: ThemeSnapshot): void {
    const switchToNight = snapshot.targetMode === 'day';
    const label = switchToNight ? '切换到夜晚' : '切换到白天';
    setIcon(this.themeButton, switchToNight ? Moon : Sun);
    this.themeButton.title = label;
    this.themeButton.setAttribute('aria-label', label);
    this.themeButton.setAttribute('aria-pressed', String(snapshot.targetMode === 'night'));
    this.themeButton.dataset.mode = snapshot.targetMode;
    if (this.themeLocked) this.themeButton.title = '探索模式固定为夜晚';
  }

  private renderAudio(muted: boolean): void {
    const label = muted ? '开启声音' : '关闭声音';
    setIcon(this.audioButton, muted ? VolumeX : Volume2);
    this.audioButton.title = label;
    this.audioButton.setAttribute('aria-label', label);
    this.audioButton.setAttribute('aria-pressed', String(!muted));
    this.audioButton.dataset.muted = String(muted);
  }
}
