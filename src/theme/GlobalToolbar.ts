import { Moon, Sun, Volume2, VolumeX, createElement, type IconNode } from 'lucide';
import type { AudioManager } from '../audio/AudioManager';
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
  private readonly audioButton = document.createElement('button');
  private readonly unsubscribeTheme: () => void;
  private readonly unsubscribeAudio: () => void;
  private themeLocked = false;

  constructor(
    private readonly theme: ThemeController,
    private readonly audio: AudioManager,
    languageButton: HTMLButtonElement,
  ) {
    this.element.id = 'global-toolbar';
    this.element.setAttribute('aria-label', '全局设置');
    this.themeButton.id = 'theme-button';
    this.audioButton.id = 'audio-button';
    this.themeButton.type = 'button';
    this.audioButton.type = 'button';
    this.themeButton.addEventListener('click', this.onThemeClick);
    this.audioButton.addEventListener('click', this.onAudioClick);
    languageButton.classList.add('global-language-button');
    this.element.append(this.themeButton, this.audioButton, languageButton);
    document.querySelector('#app')?.append(this.element);
    this.unsubscribeTheme = theme.subscribe((snapshot) => this.renderTheme(snapshot));
    this.unsubscribeAudio = audio.subscribe((muted) => this.renderAudio(muted));
  }

  dispose(): void {
    this.unsubscribeTheme();
    this.unsubscribeAudio();
    this.themeButton.removeEventListener('click', this.onThemeClick);
    this.audioButton.removeEventListener('click', this.onAudioClick);
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
  private readonly onAudioClick = () => this.audio.setMuted(!this.audio.muted, true);

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
