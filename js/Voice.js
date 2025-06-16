import { toneModulePromise } from "./ToneJsLoader.js";

const FADEIN = 0.1;
const FADEOUT_FAST = 0.1; // Changing to new note
const FADEOUT_SLOW = 1.6; // Ending playback

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
      await Tone.start();
      console.debug();
    }
    this.player = new Tone.Player();
    this.player.fadeIn = FADEIN;
    this.fadeOut = FADEOUT_FAST;
    this.player.toDestination();
    this.volumeDb = volumeDb;
    this.startTime = null;
    this.run = false;
    this._stopPromise = null;
    this._fullyStopped = true;
    this.initialised = true;
  }

  setFadeoutSlow() {
    this.fadeOut = FADEOUT_SLOW;
  }

  setFadeoutFast() {
    this.fadeOut = FADEOUT_FAST;
  }

  async playFile(url, pitchOffset) {
    if (!this.initialised) {
      console.error("this.player was not initialised yet!");
    }
    this.stop()
      .then(() => this.player.load(url))
      .then(() => this.start())
      .then(() => (this.run = true));
  }

  start() {
    this.setVolume(this.volumeDb);
    this.run = true;
    this.player.start();
    this.startTime = Tone.now();
  }

  async stop() {
    if (this.player.state === "stopped") {
      return true;
    }
    if (this._stopPromise) {
      return this._stopPromise;
    }
    this.run = false;
    //this.player.stop();
    this.player.volume.cancelScheduledValues(Tone.now());
    this.player.volume.linearRampTo(-Infinity, this.fadeOut);
    this._stopPromise = new Promise((resolve) => {
      setTimeout(() => {
        this.player.stop();
        resolve(true);
      }, this.fadeOut * 1000);
    });
    this._stopPromise.finally(() => {
      this._stopPromise = null;
    });

    return this._stopPromise;
  }

  // TODO fix
  // Optionally change volume before restart
  restart(newVolume = null) {
    this.stop();
    if (newVolume) {
      this.setVolume(db);
    }
    // Ensure we're still running after the timeout
    if (this.run) {
      this.start();
    }
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
