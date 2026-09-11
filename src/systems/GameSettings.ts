import { Settings2, X, createElement } from 'lucide';
import { getLocale } from './Locale';

export class GameSettings {
  private readonly trigger = document.createElement('button');
  private readonly dialog = document.createElement('dialog');
  private readonly restoredElements: Array<{ element: HTMLElement; marker: Text }> = [];


  constructor(toolbar: HTMLElement) {
    this.trigger.id = 'settings-button';
    this.trigger.type = 'button';
    this.trigger.setAttribute('aria-haspopup', 'dialog');
    this.trigger.setAttribute('aria-controls', 'settings-dialog');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.append(createElement(Settings2, { width: 20, height: 20, 'aria-hidden': 'true' }));
    this.dialog.id = 'settings-dialog';
    this.dialog.setAttribute('aria-labelledby', 'settings-title');
    this.dialog.innerHTML = `
      <div class="settings-sheet">
        <header class="settings-heading">
          <div><span>PLUG SPIRITS</span><h2 id="settings-title"></h2></div>
          <button id="settings-close-button" type="button" autofocus></button>
        </header>
        <section id="settings-preferences" aria-labelledby="settings-preferences-title">
          <h3 id="settings-preferences-title"></h3>
        </section>
        <section id="settings-gameplay" aria-labelledby="settings-gameplay-title">
          <h3 id="settings-gameplay-title"></h3>
        </section>
        <section id="settings-help" aria-labelledby="settings-help-title">
          <h3 id="settings-help-title"></h3>
        </section>
        <p id="settings-rush-notice"></p>
        <button id="settings-done-button" type="button"></button>
      </div>`;
    this.dialog.querySelector('#settings-close-button')!.append(
      createElement(X, { width: 20, height: 20, 'aria-hidden': 'true' }),
    );
    this.move(toolbar, this.dialog.querySelector('#settings-preferences')!);
    for (const [selector, key] of [
      ['#season-picker', 'season'], ['#theme-button', 'theme'],
      ['#audio-button', 'audio'], ['#language-button', 'language'],
    ]) {
      const control = toolbar.querySelector<HTMLElement>(selector)!;
      const wrapper = document.createElement('div');
      wrapper.className = 'settings-preference';
      const label = document.createElement('span');
      label.dataset.settingsLabel = key;
      if (key === 'season') {
        control.classList.add('settings-preference');
        control.prepend(label);
      } else {
        control.before(wrapper);
        wrapper.append(label, control);
      }
    }
    const actions = document.querySelector<HTMLElement>('#game-actions')!;
    this.move(actions, this.dialog.querySelector('#settings-gameplay')!);
    const gallery = actions.querySelector<HTMLElement>('#appliance-gallery-button');
    if (gallery) this.move(gallery, this.dialog.querySelector('#settings-preferences')!);
    this.move(document.querySelector<HTMLElement>('#hint-button')!, actions);
    const helpSection = this.dialog.querySelector('#settings-help')!;
    this.move(document.querySelector<HTMLElement>('#help-strip')!, helpSection);
    const guide = document.createElement('div');
    guide.id = 'settings-how-to-guide';
    guide.className = 'settings-how-to-guide';
    helpSection.append(guide);
    this.trigger.addEventListener('click', this.open);
    this.dialog.addEventListener('click', this.onClick, true);
    this.dialog.addEventListener('close', this.onClose);
    this.dialog.addEventListener('keydown', this.onKeyDown);
    document.querySelector('#app')!.append(this.trigger, this.dialog);
    this.refreshLocale();
  }

  refreshLocale(): void {
    const english = getLocale() === 'en';
    const copy = english ? {
      title: 'Settings', preferences: 'SOUND & APPEARANCE', gameplay: 'THIS GAME', help: 'HOW TO PLAY',
      season: 'Season', theme: 'Day / night', audio: 'Sound', language: 'Language',
      done: 'Back to game', close: 'Close settings', rush: 'The RUSH timer keeps running while settings are open.',
    } : {
      title: '设置', preferences: '声音与画面', gameplay: '游戏操作', help: '操作说明',
      season: '季节', theme: '昼夜', audio: '声音', language: '语言',
      done: '返回游戏', close: '关闭设置', rush: '限时挑战的倒计时在设置打开时继续运行。',
    };
    this.trigger.title = copy.title;
    this.trigger.setAttribute('aria-label', copy.title);
    for (const [id, text] of [
      ['settings-title', copy.title], ['settings-preferences-title', copy.preferences],
      ['settings-gameplay-title', copy.gameplay], ['settings-help-title', copy.help],
      ['settings-done-button', copy.done], ['settings-rush-notice', copy.rush],
    ]) this.dialog.querySelector(`#${id}`)!.textContent = text;
    this.dialog.querySelector('#settings-close-button')!.setAttribute('aria-label', copy.close);
    this.dialog.querySelectorAll<HTMLElement>('[data-settings-label]').forEach(label => {
      label.textContent = copy[label.dataset.settingsLabel as 'season' | 'theme' | 'audio' | 'language'];
    });
    this.dialog.querySelector('#reset-view-button')!.textContent = english ? 'Reset view' : '重置视角';
    const guide = this.dialog.querySelector<HTMLElement>('#settings-how-to-guide');
    if (guide) guide.innerHTML = english
      ? '<p><b>Rotate</b> Drag empty space to inspect the bundle.</p><p><b>Find the outside</b> Start with a plug whose exit is clear.</p><p><b>Blocked?</b> Change the angle and check the side or back.</p><p><b>Stars</b> Fewer mistakes earn a better rating.</p>'
      : '<p><b>旋转</b> 拖动空白处观察线束。</p><p><b>找外层</b> 先找出口畅通的插头。</p><p><b>被挡住</b> 换个角度检查侧面或背面。</p><p><b>星级</b> 错误越少，评价越高。</p>';
  }

  dispose(): void {
    this.trigger.removeEventListener('click', this.open);
    this.dialog.removeEventListener('click', this.onClick, true);
    this.dialog.removeEventListener('close', this.onClose);
    this.dialog.removeEventListener('keydown', this.onKeyDown);
    this.dialog.close();
    for (const { element, marker } of this.restoredElements.reverse()) marker.replaceWith(element);
    this.trigger.remove();
    this.dialog.remove();
  }

  private move(element: HTMLElement, destination: Element): void {
    const marker = document.createTextNode('');
    element.before(marker);
    this.restoredElements.push({ element, marker });
    destination.append(element);
  }

  private readonly open = () => {
    if (this.dialog.open) return;
    this.refreshLocale();
    this.dialog.showModal();
    this.trigger.setAttribute('aria-expanded', 'true');
  };

  private readonly onClose = () => {
    this.trigger.setAttribute('aria-expanded', 'false');
    this.dialog.querySelector('#season-menu')?.classList.remove('visible');
    this.dialog.querySelector('#season-menu')?.setAttribute('aria-hidden', 'true');
    this.dialog.querySelector('#season-button')?.setAttribute('aria-expanded', 'false');
    if (document.activeElement === document.body || this.dialog.contains(document.activeElement)) {
      this.trigger.focus({ preventScroll: true });
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const buttons = [...this.dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
      .filter(button => button.getClientRects().length > 0 && getComputedStyle(button).visibility !== 'hidden');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  private readonly onClick = (event: MouseEvent) => {
    if (event.target === this.dialog) {
      this.dialog.close();
      return;
    }
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button || button.disabled) return;
    if (button.closest('#game-actions') || ['settings-close-button', 'settings-done-button', 'appliance-gallery-button'].includes(button.id)) {
      this.dialog.close();
    }
  };
}
