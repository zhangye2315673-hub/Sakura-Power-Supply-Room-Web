import './styles.css';
import { ThemeController } from './theme/ThemeController';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');

if (!canvas) {
  throw new Error('Missing #game-canvas element.');
}

const query = new URLSearchParams(window.location.search);
const showcaseMode = query.get('showcase');
const recordingMode = query.get('record') === '1' || query.get('recording') === '1';
if (recordingMode) document.documentElement.classList.add('recording-mode');
let experience: { start: () => void; dispose: () => void } | null = null;
let showcaseTheme: ThemeController | null = null;

if (showcaseMode === 'plugs' || showcaseMode === 'appliances') {
  showcaseTheme = new ThemeController({ internalEntry: true });
}

requestAnimationFrame(() => {
  document.documentElement.classList.add('app-ready');
  requestAnimationFrame(() => void boot());
});

async function boot(): Promise<void> {
  if (showcaseMode === 'plugs' || showcaseMode === 'appliances') {
    document.documentElement.classList.remove('opening-active');
    const startScreen = document.querySelector<HTMLElement>('#start-screen');
    if (startScreen) startScreen.hidden = true;
    const { Showcase } = await import('./showcase/Showcase');
    experience = new Showcase(canvas!, showcaseMode, showcaseTheme ?? undefined);
  } else {
    const { Game } = await import('./game/Game');
    experience = new Game(canvas!);
  }
  experience.start();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    experience?.dispose();
    showcaseTheme?.dispose();
  });
}
