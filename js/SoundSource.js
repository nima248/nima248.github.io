import { Mutex } from "./mutex.js";

const FADEIN = 200;
const FADEOUT_FAST = 200; // Changing to new note
const FADEOUT_SLOW = 1600; // Ending playback
const START_DELAY = 50;

export class SoundSource {
  /* Wraps a Howler object for audio playback
   * of a single audio file
   */
  constructor(audioUrl, fullVolume = 1.0) {
    this._loadedPromiseResolve = null;
    this._loadedPromise = new Promise((resolve) => {
      this._loadedPromiseResolve = resolve;
    });
    this._howl = new Howl({
      src: [audioUrl],
      volume: 0,
      onload: () => {
        this._loadedPromiseResolve();
      },
    });
    this._fullVolume = fullVolume;
    this._playingIds = new Set();
    this._restartMutex = new Mutex();
    this._rate = 1.0;
  }

  setSemitonesOffset(semitonesOffset) {
    this._rate = 2 ** (semitonesOffset / 12);
  }

  /* Add a new playing instance */
  addPlayback() {
    this._allowNewPlays = true;
    this._loadedPromise.then(() => {
      if (!this._allowNewPlays) {
        return;
      }
      const id = this._howl.play();
      this._howl.rate(this._rate, id);
      this._playingIds.add(id);
      this._fadein(id);
    });
  }

  stopAll(fast = false) {
    this._playingIds.forEach((id) => {
      this._fadeoutAndStopId(id, fast);
    });
  }

  stopId(id, fast = false) {
    this._fadeoutAndStopId(id, fast);
  }

  restartOldest() {
    this._restartMutex
      .lock()
      /* Critical section (don't restart the same Id) */
      .then(() => {
        if (this._playingIds.size > 0) {
          return [...this._playingIds][0];
        } else {
          console.warn("Nothing to restart!");
          throw new Error("BreakChain");
        }
      })
      .then((id) => this._fadeoutAndStopId(id, true))
      /* End critical section */
      .then(() => this._restartMutex.unlock())
      .then(() => this.addPlayback())
      .catch((err) => {
        if (err.message !== "BreakChain") throw err;
      });
  }

  cancelAwaitingPlays() {
    this._allowNewPlays = false;
  }

  getPlayingIds() {
    return this._playingIds;
  }

  _fadein(id) {
    const currentVolume = this._howl.volume(id);
    if (currentVolume === this._fullVolume) {
      return;
    }
    const fadeinTime = FADEIN * (1 - currentVolume / this._fullVolume);
    this._howl.fade(currentVolume, this._fullVolume, fadeinTime, id);
  }

  _fadeoutAndStopId(id, fast) {
    const time = fast ? FADEOUT_FAST : FADEOUT_SLOW;
    const currentVolume = this._howl.volume(id);
    if (currentVolume === 0) {
      this._stopId(id);
      return;
    }
    const fadeoutTime = time * (currentVolume / this._fullVolume);
    this._howl.off("fade", null, id);
    this._howl.fade(currentVolume, 0, fadeoutTime, id);
    let stopPromiseResolve;
    const stopPromise = new Promise((resolve) => {
      stopPromiseResolve = resolve;
    });
    this._howl.once(
      "fade",
      () => {
        this._stopId(id);
        stopPromiseResolve();
      },
      id,
    );
    return stopPromise;
  }

  _stopId(id) {
    this._howl.stop(id);
    this._playingIds.delete(id);
    if (!this._howl.playing()) {
    }
  }
}
