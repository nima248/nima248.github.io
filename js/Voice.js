const FADEIN = 100;
const FADEOUT_FAST = 200; // Changing to new note
const FADEOUT_SLOW = 1600; // Ending playback
const START_DELAY = 50;

export class Voice {
  /* Wraps a Howler object for audio playback
   * of a single audio file
   */
  constructor(audioUrl, fullVolume = 1.0) {
    this._loadedPResolve = null;
    this._loadedP = new Promise((resolve) => {
      this._loadedPResolve = resolve;
    });
    this._fadePromise = null;
    this._fadePromiseResolve = null;
    this.howl = new Howl({
      src: [audioUrl],
      volume: 0,
      onload: () => {
        this._loadedPResolve();
      },
    });
    this.fullVolume = fullVolume;
    this.playing = false;
  }

  ready() {
    return this._loadedP;
  }

  setSemitonesOffset(semitonesOffset) {
    const rate = 2 ** (semitonesOffset / 12);
    this.howl.rate(rate);
  }

  async play() {
    await this.ready();
    if (!this.playing) {
      this.playing = true;
      this.howl.play();
    }
    this.howl.off("fade"); // cancel any fade triggers
    this.fadein();
  }

  stop(fast = false) {
    if (!this.playing) {
      return;
    }
    const fadeoutTime = fast ? FADEOUT_FAST : FADEOUT_SLOW;
    this.fadeoutAndStop(fadeoutTime);
  }

  fadein() {
    const currentVolume = this.howl.volume();
    if (currentVolume === this.fullVolume) {
      return;
    }
    const fadeinTime = FADEIN * (1 - currentVolume / this.fullVolume);
    this.howl.fade(currentVolume, this.fullVolume, fadeinTime);
  }

  fadeoutAndStop(time) {
    const currentVolume = this.howl.volume();
    if (currentVolume === 0) {
      this.howl.stop();
    }
    const fadeoutTime = time * (currentVolume / this.fullVolume);
    this.howl.off("fade");
    this.howl.fade(currentVolume, 0, fadeoutTime);
    this.howl.once("fade", () => {
      this.howl.stop();
      this.playing = false;
    });
  }
}
