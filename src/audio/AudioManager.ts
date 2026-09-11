import { MusicPlayer, type MusicProfile } from './MusicPlayer';

export type AudioBusName = 'master' | 'ambient' | 'interaction';
export type InteractionSound =
  | 'confirm'
  | 'cable-success'
  | 'cable-grab'
  | 'socket-near'
  | 'blocked'
  | 'mode-start'
  | 'complete'
  | 'failed'
  | 'button'
  | 'rush-tick'
  | 'rush-warning';

const STORAGE_KEY = 'sakura.audioMuted';
const PENTATONIC = [0, 2, 4, 7, 9];
const INTERACTION_COOLDOWN = 0.08;
const MAX_INTERACTION_VOICES = 8;
const INTERACTION_FREQUENCIES: Record<InteractionSound, readonly number[]> = {
  confirm: [392, 523],
  'cable-success': [440, 660, 880],
  'cable-grab': [740, 1040],
  'socket-near': [523],
  blocked: [290],
  'mode-start': [262, 330, 440],
  complete: [330, 440, 550, 660],
  failed: [220, 185, 147],
  button: [1450, 2300],
  'rush-tick': [660],
  'rush-warning': [220, 277, 220],
};

function seededValue(seed: number): number {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 0xffffffff;
}

export class AudioManager {
  private context: AudioContext | null = null;
  private buses: Partial<Record<AudioBusName, GainNode>> = {};
  private readonly listeners = new Set<(muted: boolean) => void>();
  private readonly interactionVoices = new Map<OscillatorNode, GainNode>();
  private readonly lastInteractionAt = new Map<InteractionSound, number>();
  private ambientTarget = -1;
  private droppedInteractions = 0;
  private readonly activeNodes = new Set<AudioNode>();
  private wind: AudioBufferSourceNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly music = new MusicPlayer();
  private nextChimeAt = 0;
  private nextInsectAt = 0;
  private mutedValue = false;
  private unlockedValue = false;
  private hidden = document.hidden;
  private suspendTimer = 0;

  constructor() {
    try {
      this.mutedValue = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      this.mutedValue = false;
    }
    window.addEventListener('pointerdown', this.onFirstInteraction, { capture: true, once: true });
    window.addEventListener('touchstart', this.onFirstInteraction, { capture: true, once: true });
    window.addEventListener('keydown', this.onFirstInteraction, { capture: true, once: true });
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  get muted(): boolean {
    return this.mutedValue;
  }

  get unlocked(): boolean {
    return this.unlockedValue;
  }

  subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.mutedValue);
    return () => this.listeners.delete(listener);
  }

  async unlock(): Promise<void> {
    if (!this.context) this.createContext();
    if (!this.context) return;
    if (this.context.state !== 'running') await this.context.resume();
    this.unlockedValue = this.context.state === 'running';
    this.applyMuteState(0.04);
    if (this.unlockedValue && !this.wind) this.startAmbient();
    this.music.setEnabled(this.unlockedValue && !this.mutedValue && !this.hidden);
  }

  setMusicProfile(profile: MusicProfile | null): void {
    this.music.setProfile(profile);
  }

  setMuted(muted: boolean, persist = false): void {
    this.mutedValue = muted;
    if (muted) this.stopInteractions();
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, String(muted));
      } catch {
        // Storage is optional. The current session still updates immediately.
      }
    }
    this.applyMuteState(0.08);
    this.music.setEnabled(this.unlockedValue && !muted && !this.hidden);
    this.listeners.forEach((listener) => listener(muted));
  }

  update(themeProgress: number): void {
    if (!this.context || !this.unlockedValue || this.mutedValue || this.hidden) return;
    const target = Math.max(0, Math.min(1, themeProgress)) * 0.115;
    if (this.buses.ambient && Math.abs(target - this.ambientTarget) > 0.0001) {
      this.buses.ambient.gain.setTargetAtTime(target, this.context.currentTime, 0.18);
      this.ambientTarget = target;
    }
    if (themeProgress > 0.75 && this.context.currentTime >= this.nextChimeAt) {
      this.playAmbientChime();
      this.nextChimeAt = this.context.currentTime + 12 + seededValue(Math.floor(this.context.currentTime * 10)) * 8;
    }
    if (themeProgress > 0.55 && this.context.currentTime >= this.nextInsectAt) {
      this.playInsectChirp();
      this.nextInsectAt = this.context.currentTime + 4.5 + seededValue(Math.floor(this.context.currentTime * 17)) * 4;
    }
  }

  playInteraction(sound: InteractionSound): void {
    if (!this.context || !this.unlockedValue || this.mutedValue || this.hidden) return;
    const now = this.context.currentTime;
    const frequencies = INTERACTION_FREQUENCIES[sound];
    if (now - (this.lastInteractionAt.get(sound) ?? -Infinity) < INTERACTION_COOLDOWN) {
      this.droppedInteractions += 1;
      return;
    }
    if (sound === 'complete' || sound === 'failed' || sound === 'mode-start') {
      this.stopInteractions();
    } else if (this.interactionVoices.size + frequencies.length > MAX_INTERACTION_VOICES) {
      this.droppedInteractions += 1;
      return;
    }
    this.lastInteractionAt.set(sound, now);
    const gainScale = sound === 'blocked' ? 0.1
      : sound === 'failed' || sound === 'rush-warning' ? 0.09
      : sound === 'rush-tick' ? 0.04 : 0.085;
    const duration = sound === 'blocked' ? 0.18
      : sound === 'cable-success' ? 0.28
      : sound === 'cable-grab' ? 0.2
      : sound === 'button' ? 0.14 : 0.13;
    frequencies.forEach((frequency, index) => {
      this.scheduleTone(
        this.buses.interaction!, frequency, now + index * 0.09,
        duration, gainScale, sound === 'blocked' ? 'triangle' : 'sine',
      );
    });
  }

  private stopInteractions(): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.interactionVoices.forEach((gain, source) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.0001, now, 0.006);
      source.stop(now + 0.03);
    });
    this.interactionVoices.clear();
  }

  getDiagnostics() {
    const busValue = (name: AudioBusName) => this.buses[name]?.gain.value ?? 0;
    return {
      unlocked: this.unlockedValue,
      muted: this.mutedValue,
      state: this.context?.state ?? 'unavailable',
      buses: {
        master: busValue('master'),
        ambient: busValue('ambient'),
        interaction: busValue('interaction'),
      },
      activeNodes: this.activeNodes.size,
      applianceAudioEnabled: false,
      activeAppliances: [],
      interactionVoices: this.interactionVoices.size,
      droppedInteractions: this.droppedInteractions,
      music: this.music.diagnostics,
    };
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.onFirstInteraction, true);
    window.removeEventListener('touchstart', this.onFirstInteraction, true);
    window.removeEventListener('keydown', this.onFirstInteraction, true);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.clearTimeout(this.suspendTimer);
    this.stopInteractions();
    this.wind?.stop();
    this.wind = null;
    this.lastInteractionAt.clear();
    this.music.dispose();
    void this.context?.close();
    this.context = null;
    this.activeNodes.clear();
    this.listeners.clear();
  }

  private readonly onFirstInteraction = () => {
    void this.unlock();
  };

  private readonly onVisibilityChange = () => {
    this.hidden = document.hidden;
    if (!this.context) return;
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = 0;
    const master = this.buses.master;
    if (this.hidden) {
      this.stopInteractions();
      this.music.setEnabled(false);
      master?.gain.setTargetAtTime(0, this.context.currentTime, 0.05);
      this.suspendTimer = window.setTimeout(() => {
        this.suspendTimer = 0;
        if (this.hidden) void this.context?.suspend();
      }, 180);
    } else {
      void this.context.resume().then(() => {
        this.unlockedValue = this.context?.state === 'running';
        this.applyMuteState(0.08);
        this.music.setEnabled(this.unlockedValue && !this.mutedValue && !this.hidden);
      });
    }
  };

  private createContext(): void {
    const LegacyWindow = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Context = window.AudioContext ?? LegacyWindow.webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -9;
    limiter.knee.value = 16;
    limiter.ratio.value = 5;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.18;
    limiter.connect(context.destination);
    const master = context.createGain();
    master.gain.value = this.mutedValue ? 0 : 0.82;
    master.connect(limiter);
    const ambient = context.createGain();
    const interaction = context.createGain();
    ambient.gain.value = 0;
    interaction.gain.value = 0.55;
    ambient.connect(master);
    interaction.connect(master);
    this.context = context;
    this.buses = { master, ambient, interaction };
    this.activeNodes.add(limiter);
    Object.values(this.buses).forEach((node) => this.activeNodes.add(node));
    this.noiseBuffer = this.createNoiseBuffer(context);
  }

  private applyMuteState(timeConstant: number): void {
    if (!this.context || !this.buses.master) return;
    this.buses.master.gain.setTargetAtTime(this.mutedValue ? 0 : 0.82, this.context.currentTime, timeConstant);
  }

  private startAmbient(): void {
    if (!this.context || !this.noiseBuffer || !this.buses.ambient) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    gain.gain.value = 0.75;
    source.connect(filter).connect(gain).connect(this.buses.ambient);
    source.start();
    this.trackSource(source, [filter, gain]);
    this.wind = source;
    this.nextChimeAt = this.context.currentTime + 12;
    this.nextInsectAt = this.context.currentTime + 3.5;
  }

  private playAmbientChime(): void {
    if (!this.context || !this.buses.ambient) return;
    const seed = Math.floor(this.context.currentTime * 100);
    const root = 523.25;
    for (let index = 0; index < 3; index += 1) {
      const step = PENTATONIC[Math.floor(seededValue(seed + index * 31) * PENTATONIC.length)];
      this.scheduleTone(this.buses.ambient, root * 2 ** (step / 12), this.context.currentTime + index * 0.22, 0.7, 0.055, 'sine');
    }
  }

  private playInsectChirp(): void {
    if (!this.context || !this.buses.ambient) return;
    const now = this.context.currentTime;
    const base = 3150 + seededValue(Math.floor(now * 100)) * 520;
    for (let index = 0; index < 3; index += 1) {
      this.scheduleTone(this.buses.ambient, base * (1 + index * 0.025), now + index * 0.075, 0.045, 0.018, 'sine');
    }
  }

  private scheduleTone(
    destination: AudioNode,
    frequency: number,
    at: number,
    duration: number,
    level: number,
    type: OscillatorType,
  ): OscillatorNode | null {
    if (!this.context) return null;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = Math.max(28, frequency);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), at + Math.min(0.025, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(destination);
    if (destination === this.buses.interaction) {
      this.interactionVoices.set(oscillator, gain);
      oscillator.addEventListener('ended', () => this.interactionVoices.delete(oscillator), { once: true });
    }
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
    this.trackSource(oscillator, [gain]);
    return oscillator;
  }

  private trackSource(source: AudioScheduledSourceNode, extras: AudioNode[]): void {
    this.activeNodes.add(source);
    extras.forEach((node) => this.activeNodes.add(node));
    source.addEventListener('ended', () => {
      source.disconnect();
      extras.forEach((node) => {
        node.disconnect();
        this.activeNodes.delete(node);
      });
      this.activeNodes.delete(source);
    }, { once: true });
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const length = context.sampleRate * 2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = seededValue(index + 0x5a17) * 2 - 1;
      last = last * 0.86 + white * 0.14;
      channel[index] = last * 0.72 + white * 0.28;
    }
    return buffer;
  }
}
