import * as THREE from 'three';
import type { AppliancePerformanceTarget } from '../systems/AppliancePerformanceSystem';
import type { ApplianceKind } from '../systems/ApplianceCatalog';
import { APPLIANCE_AUDIO_PROFILES } from './ApplianceAudioProfiles';
import { MusicPlayer, type MusicProfile } from './MusicPlayer';

export type AudioBusName = 'master' | 'ambient' | 'appliance' | 'interaction';
export type InteractionSound =
  | 'confirm'
  | 'cable-success'
  | 'cable-grab'
  | 'socket-near'
  | 'blocked'
  | 'appliance-land'
  | 'mode-start'
  | 'complete'
  | 'failed'
  | 'button'
  | 'rush-tick'
  | 'rush-warning';

type AudioSession = {
  target: AppliancePerformanceTarget;
  kind: ApplianceKind;
  gain: GainNode;
  panner: StereoPannerNode;
  sources: AudioScheduledSourceNode[];
  startedAtContextTime: number;
  offset: number;
};

const STORAGE_KEY = 'sakura.audioMuted';
const PENTATONIC = [0, 2, 4, 7, 9];

function seededValue(seed: number): number {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 0xffffffff;
}

function hashKind(kind: ApplianceKind): number {
  let result = 2166136261;
  for (const code of kind) result = Math.imul(result ^ code.charCodeAt(0), 16777619);
  return result >>> 0;
}

export class AudioManager {
  private context: AudioContext | null = null;
  private buses: Partial<Record<AudioBusName, GainNode>> = {};
  private readonly listeners = new Set<(muted: boolean) => void>();
  private readonly sessions = new Map<AppliancePerformanceTarget, AudioSession>();
  private readonly activeNodes = new Set<AudioNode>();
  private wind: AudioSession | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly music = new MusicPlayer();
  private readonly sampleUrls: Partial<Record<InteractionSound, string>> = {
  };
  private nextChimeAt = 0;
  private nextInsectAt = 0;
  private mutedValue = false;
  private unlockedValue = false;
  private hidden = document.hidden;
  private suspendTimer = 0;
  private readonly spatialPosition = new THREE.Vector3();

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

  update(
    themeProgress: number,
    targets: readonly AppliancePerformanceTarget[],
    camera?: THREE.PerspectiveCamera,
  ): void {
    if (!this.context || !this.unlockedValue || this.hidden) return;
    const ambient = this.buses.ambient;
    if (ambient) {
      const activeCount = targets.filter((target) => target.state === 'active').length;
      const duck = activeCount > 0 ? 0.707 : 1;
      ambient.gain.setTargetAtTime(themeProgress * 0.115 * duck, this.context.currentTime, 0.18);
    }

    targets.forEach((target) => {
      const existing = this.sessions.get(target);
      if (target.state === 'active' && !existing) this.startAppliance(target, target.getActiveElapsed());
      else if (target.state !== 'active' && existing) this.stopSession(target, 0.12);
      const session = this.sessions.get(target);
      if (session && camera) this.updateSpatial(session, camera);
    });
    [...this.sessions.keys()].forEach((target) => {
      if (!targets.includes(target)) this.stopSession(target, 0.08);
    });

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
    this.playSample(sound);
    const frequencies: Record<InteractionSound, readonly number[]> = {
      confirm: [392, 523],
      'cable-success': [440, 660, 880],
      'cable-grab': [740, 1040],
      'socket-near': [523],
      blocked: [147, 123],
      'appliance-land': [92],
      'mode-start': [262, 330, 440],
      complete: [330, 440, 550, 660],
      failed: [220, 185, 147],
      button: [1450, 2300],
      'rush-tick': [660],
      'rush-warning': [220, 277, 220],
    };
    const gainScale = sound === 'blocked' || sound === 'failed' || sound === 'rush-warning'
      ? 0.09
      : sound === 'rush-tick'
        ? 0.04
        : 0.065;
    frequencies[sound].forEach((frequency, index) => {
      this.scheduleTone(this.buses.interaction!, frequency, this.context!.currentTime + index * 0.09, sound === 'cable-success' ? 0.28 : sound === 'cable-grab' ? 0.2 : sound === 'button' ? 0.14 : 0.13, gainScale, 'sine');
    });
  }

  private playSample(sound: InteractionSound): void {
    const url = this.sampleUrls[sound];
    if (!url) return;
    const element = new Audio(url);
    element.volume = sound === 'socket-near' ? 0.12 : sound === 'button' ? 0.18 : 0.34;
    element.play().catch(() => undefined);
  }

  getDiagnostics(): {
    unlocked: boolean;
    muted: boolean;
    state: AudioContextState | 'unavailable';
    buses: Record<AudioBusName, number>;
    activeNodes: number;
    activeAppliances: ApplianceKind[];
  } {
    const busValue = (name: AudioBusName) => this.buses[name]?.gain.value ?? 0;
    return {
      unlocked: this.unlockedValue,
      muted: this.mutedValue,
      state: this.context?.state ?? 'unavailable',
      buses: {
        master: busValue('master'),
        ambient: busValue('ambient'),
        appliance: busValue('appliance'),
        interaction: busValue('interaction'),
      },
      activeNodes: this.activeNodes.size,
      activeAppliances: [...this.sessions.values()].map((session) => session.kind),
    };
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.onFirstInteraction, true);
    window.removeEventListener('touchstart', this.onFirstInteraction, true);
    window.removeEventListener('keydown', this.onFirstInteraction, true);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.clearTimeout(this.suspendTimer);
    [...this.sessions.keys()].forEach((target) => this.stopSession(target, 0));
    if (this.wind) this.stopAudioSession(this.wind, 0);
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
        [...this.sessions.keys()].forEach((target) => this.stopSession(target, 0));
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
    const appliance = context.createGain();
    const interaction = context.createGain();
    ambient.gain.value = 0;
    appliance.gain.value = 0.22;
    interaction.gain.value = 0.26;
    ambient.connect(master);
    appliance.connect(master);
    interaction.connect(master);
    this.context = context;
    this.buses = { master, ambient, appliance, interaction };
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
    const panner = this.context.createStereoPanner();
    source.buffer = this.noiseBuffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    gain.gain.value = 0.75;
    source.connect(filter).connect(gain).connect(panner).connect(this.buses.ambient);
    source.start();
    this.trackSource(source, [filter, gain, panner]);
    this.wind = {
      target: null as unknown as AppliancePerformanceTarget,
      kind: 'fan',
      gain,
      panner,
      sources: [source],
      startedAtContextTime: this.context.currentTime,
      offset: 0,
    };
    this.nextChimeAt = this.context.currentTime + 12;
    this.nextInsectAt = this.context.currentTime + 3.5;
  }

  private startAppliance(target: AppliancePerformanceTarget, offset: number): void {
    if (!this.context || !this.buses.appliance || this.mutedValue) return;
    const profile = APPLIANCE_AUDIO_PROFILES[target.kind];
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    gain.gain.value = 0;
    gain.connect(panner).connect(this.buses.appliance);
    const session: AudioSession = {
      target,
      kind: target.kind,
      gain,
      panner,
      sources: [],
      startedAtContextTime: this.context.currentTime,
      offset,
    };
    this.activeNodes.add(gain);
    this.activeNodes.add(panner);
    this.sessions.set(target, session);
    const seed = hashKind(target.kind);
    const variation = (seededValue(seed) - 0.5) * profile.pitchVariation;
    const base = profile.baseFrequency * (1 + variation);
    gain.gain.setValueAtTime(0, this.context.currentTime);

    this.addRunVoice(session, base, profile);
    this.addStageTones(session, base, seed, profile);
  }

  private addRunVoice(
    session: AudioSession,
    base: number,
    profile: (typeof APPLIANCE_AUDIO_PROFILES)[ApplianceKind],
  ): void {
    if (!this.context) return;
    const runStage = profile.stages[1];
    const runEnd = runStage.at + runStage.duration;
    if (runEnd <= session.offset) return;
    const startAt = this.context.currentTime + Math.max(0, runStage.at - session.offset);
    const duration = Math.max(0.12, runEnd - Math.max(session.offset, runStage.at));
    const character = profile.character;
    const oscillator = this.context.createOscillator();
    oscillator.type = character === 'screen' ? 'sine' : character === 'musical' ? 'triangle' : 'sawtooth';
    oscillator.frequency.setValueAtTime(base, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(
      base * (character === 'motor' || character === 'air' ? 1.45 : 1.04),
      startAt + Math.min(0.9, duration),
    );
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = character === 'heat' || character === 'water' ? 1450 : 980;
    const voiceGain = this.context.createGain();
    voiceGain.gain.value = character === 'screen' ? 0.2 : 0.34;
    oscillator.connect(filter).connect(voiceGain).connect(session.gain);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
    session.sources.push(oscillator);
    this.trackSource(oscillator, [filter, voiceGain]);

    if (profile.noiseAmount <= 0 || !this.noiseBuffer) return;
    const noise = this.context.createBufferSource();
    const noiseFilter = this.context.createBiquadFilter();
    const noiseGain = this.context.createGain();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    noiseFilter.type = character === 'air' || character === 'water' ? 'bandpass' : 'lowpass';
    noiseFilter.frequency.value = character === 'air' ? 1250 : character === 'water' ? 1750 : 850;
    noiseFilter.Q.value = character === 'water' ? 0.8 : 0.35;
    noiseGain.gain.value = profile.noiseAmount;
    noise.connect(noiseFilter).connect(noiseGain).connect(session.gain);
    noise.start(startAt);
    noise.stop(startAt + duration);
    session.sources.push(noise);
    this.trackSource(noise, [noiseFilter, noiseGain]);
  }

  private addStageTones(
    session: AudioSession,
    base: number,
    seed: number,
    profile: (typeof APPLIANCE_AUDIO_PROFILES)[ApplianceKind],
  ): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const schedule = (at: number, frequency: number, duration: number, gain: number, type: OscillatorType) => {
      if (at + duration <= session.offset) return;
      const localAt = now + Math.max(0, at - session.offset);
      const localDuration = at < session.offset ? Math.max(0.04, duration - (session.offset - at)) : duration;
      const oscillator = this.scheduleTone(session.gain, frequency, localAt, localDuration, gain, type);
      if (oscillator) session.sources.push(oscillator);
    };
    const [startup, , climax, finish] = profile.stages;
    schedule(startup.at, base * 1.7, Math.min(0.12, startup.duration), 0.17, 'square');
    schedule(
      startup.at + Math.min(0.14, startup.duration * 0.34),
      base * 1.12,
      Math.min(0.22, startup.duration * 0.52),
      0.11,
      'triangle',
    );
    const kind = session.kind;
    const musical = profile.character === 'musical'
      || kind === 'phone' || kind === 'portable-speaker';
    if (musical) {
      PENTATONIC.forEach((step, index) => schedule(
        climax.at + index * Math.min(0.1, climax.duration / 6),
        base * 2 ** (step / 12),
        Math.min(0.16, climax.duration * 0.3),
        0.1,
        'sine',
      ));
    } else {
      schedule(
        climax.at,
        base * (1.9 + seededValue(seed + 9) * 0.35),
        Math.min(0.18, climax.duration * 0.3),
        0.19,
        'triangle',
      );
      schedule(
        climax.at + climax.duration * 0.35,
        base * 0.72,
        Math.min(0.24, climax.duration * 0.4),
        0.13,
        'sine',
      );
    }
    schedule(finish.at, base * 1.25, Math.min(0.12, finish.duration * 0.28), 0.12, 'sine');
    schedule(
      finish.at + finish.duration * 0.42,
      base * 0.82,
      Math.min(0.18, finish.duration * 0.42),
      0.09,
      'triangle',
    );
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
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
    this.trackSource(oscillator, [gain]);
    return oscillator;
  }

  private updateSpatial(session: AudioSession, camera: THREE.PerspectiveCamera): void {
    if (!this.context) return;
    const position = session.target.root.getWorldPosition(this.spatialPosition).project(camera);
    session.panner.pan.setTargetAtTime(THREE.MathUtils.clamp(position.x * 0.72, -0.8, 0.8), this.context.currentTime, 0.08);
    const distanceGain = THREE.MathUtils.clamp(1 - Math.abs(position.x) * 0.12 - Math.abs(position.y) * 0.08, 0.72, 1);
    const profile = APPLIANCE_AUDIO_PROFILES[session.kind];
    const activeElapsed = session.target.getActiveElapsed();
    const attack = THREE.MathUtils.smoothstep(activeElapsed, 0, 0.18);
    const release = THREE.MathUtils.smoothstep(profile.duration - activeElapsed, 0, 0.55);
    session.gain.gain.setTargetAtTime(
      profile.runGain * distanceGain * Math.min(attack, release),
      this.context.currentTime,
      0.08,
    );
  }

  private stopSession(target: AppliancePerformanceTarget, fade: number): void {
    const session = this.sessions.get(target);
    if (!session) return;
    this.stopAudioSession(session, fade);
    this.sessions.delete(target);
  }

  private stopAudioSession(session: AudioSession, fade: number): void {
    if (!this.context) return;
    const stopAt = this.context.currentTime + Math.max(0.01, fade);
    session.gain.gain.cancelScheduledValues(this.context.currentTime);
    session.gain.gain.setValueAtTime(Math.max(0.0001, session.gain.gain.value), this.context.currentTime);
    session.gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    session.sources.forEach((source) => {
      try {
        source.stop(stopAt + 0.02);
      } catch {
        // The source may already have completed its authored segment.
      }
    });
    window.setTimeout(() => {
      session.gain.disconnect();
      session.panner.disconnect();
      this.activeNodes.delete(session.gain);
      this.activeNodes.delete(session.panner);
    }, (fade + 0.08) * 1000);
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
