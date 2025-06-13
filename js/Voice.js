import { toneModulePromise } from "./ToneJsLoader.js";

let Tone = null; // dynamically imported after user interaction

export class Voice {
  /* Wraps a Tone.Player object for audio playback
   */
  constructor() {
    this.initialised = false;
  }

  async initialise(volumeDb) {
    if (!Tone) {
      await toneModulePromise;
      Tone = window.Tone;
    }
    this.player = new Tone.Player();
    this.player.fadeIn = 0.34;
    this.player.fadeOut = 0.64;
    this.player.toDestination();
    this.setVolume(volumeDb);
    this.startTime = null;
    this.run = false;
    this.audioPlaying = false;
    this.initialised = true;
  }

  async playFile(url, pitchOffset) {
    if (!this.initialised) {
      console.error("this.player was not initialised yet!");
    }

    this.player.load(url).then(() => this.player.start());
  }

  start() {
    this.run = true;
    this.audioPlaying = true;
    this.player.start();
    this.startTime = Tone.now();
  }

  stop() {
    this.run = false;
    this.player.stop();
    setTimeout(() => {
      if (this.state !== "started") {
        this.audioPlaying = false;
      }
    }, this.player.fadeOut * 1000);
  }

  // Optionally change volume before restart
  restart(newVolume = null) {
    this.stop();
    setTimeout(() => {
      if (newVolume) {
        this.setVolume(db);
      }
      // Ensure we're still running after the timeout
      if (this.run) {
        this.start();
      }
    }, this.player.fadeOut * 1000);
  }

  timeRemaining() {
    if (this.state !== "started") {
      return 0;
    }
    const elapsed = Tone.now() - this.startTime;
    return this.player.buffer.duration - elapsed;
  }

  // Change volume when player is stopped
  setVolume(db) {
    this.player.volume.value = db;
  }
}
