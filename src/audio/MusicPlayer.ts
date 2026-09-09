export type MusicProfile = 'main' | 'gameplay';

export function selectMusicProfile(opening: boolean): MusicProfile {
  return opening ? 'main' : 'gameplay';
}

const tracks: Record<MusicProfile, string> = {
  main: 'audio/japanese-candidates/amenoprelude.mp3',
  gameplay: 'audio/music/reverie.mp3',
};

export class MusicPlayer {
  private profile: MusicProfile | null = null;
  private enabled = false;
  private timer: number | null = null;
  private lastTick = 0;
  private readonly players = new Map<MusicProfile, HTMLAudioElement>();
  private error: string | null = null;

  setProfile(profile: MusicProfile | null): void {
    if (this.profile === profile) return;
    this.profile = profile;
    this.sync();
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.sync();
  }

  get diagnostics() {
    return {
      profile: this.profile, enabled: this.enabled, error: this.error,
      playing: [...this.players.entries()].filter(([, player]) => !player.paused)
        .map(([profile, player]) => ({ profile, volume: player.volume, currentTime: player.currentTime })),
    };
  }

  dispose(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.players.forEach(player => {
      player.pause();
      player.removeAttribute('src');
      player.load();
    });
    this.players.clear();
  }

  private sync(): void {
    if (!this.enabled) {
      this.players.forEach(player => { player.pause(); player.volume = 0; });
      if (this.timer !== null) window.clearInterval(this.timer);
      this.timer = null;
      return;
    }
    if (this.profile) {
      let player = this.players.get(this.profile);
      if (!player) {
        player = new Audio(`${import.meta.env.BASE_URL}${tracks[this.profile]}`);
        player.loop = true;
        player.volume = 0;
        this.players.set(this.profile, player);
      }
      if (player.paused) {
        this.error = null;
        void player.play().catch(error => { this.error = String(error); });
      }
    }
    if (this.timer === null) {
      this.lastTick = performance.now();
      this.timer = window.setInterval(() => this.tick(), 50);
    }
  }

  private tick(): void {
    const now = performance.now();
    const step = Math.min(0.1, (now - this.lastTick) / 1000) * 0.16 / 1.2;
    this.lastTick = now;
    let fading = false;
    this.players.forEach((player, profile) => {
      const target = profile === this.profile ? 0.16 : 0;
      player.volume += Math.sign(target - player.volume) * Math.min(step, Math.abs(target - player.volume));
      if (Math.abs(target - player.volume) > 0.00001) fading = true;
      if (target === 0 && player.volume < 0.00001) {
        player.pause();
        player.currentTime = 0;
      }
    });
    if (!fading && this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
