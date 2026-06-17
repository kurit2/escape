export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private hitAudios: HTMLAudioElement[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const audioPaths = [
        "/ナイフで突き刺す3.mp3",
        "/ナイフで突き刺す3.mp4",
        "/ナイフで突き刺す3.mp3", // NFD
        "/ナイフで突き刺す3.mp4"  // NFD
      ];
      this.hitAudios = audioPaths.map(path => {
        const audio = new Audio(path);
        audio.preload = "auto";
        return audio;
      });
    }
  }

  private init() {
    // Disabled
  }

  setMuted(m: boolean) {
    this.isMuted = true;
  }

  getMuted() {
    return true;
  }

  playSwoosh() {
    // Disabled
  }

  playCorrect() {
    // Disabled
  }

  playWrong() {
    // Disabled
  }

  unlockAudio() {
    // ユーザーが何かしらのUI操作（「ゲームを始める」など）を行った瞬間にこのメソッドを呼び出して再生制限を解除します
    this.hitAudios.forEach(audio => {
      audio.load();
    });
  }

  playHit() {
    // HTML5 Audioを使って/public/配下の音源ファイルを直接再生します。
    // 日本語の濁点（NFC/NFD）と拡張子（.mp3/.mp4）の揺れに配慮したプリロード済みオーディオリストから再生します。
    let played = false;

    const tryPlay = (index: number) => {
      if (index >= this.hitAudios.length || played) return;
      const audio = this.hitAudios[index];
      audio.volume = 0.9;
      audio.currentTime = 0;
      
      audio.play().then(() => {
        played = true;
      }).catch((err) => {
        console.warn(`Failed to play hit audio target route ${index}, trying next...`, err);
        tryPlay(index + 1);
      });
    };

    tryPlay(0);
  }

  playHeartbeat() {
    // Disabled
  }

  playClear() {
    // Disabled
  }
}

export const sound = new SoundManager();
