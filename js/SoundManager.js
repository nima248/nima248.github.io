import { SoundSource } from "./SoundSource.js";
import * as math from "./math.js";
import * as util from "./util.js";
import { DEBUG } from "./config.js";

const audioDir = "/assets/audio/";

const N_VOICES = 4;
const NOTE_CHANGE_SPREAD_MS = 350;
const TOTAL_RESTART_TIME_MS = 9000; // should be approx length of audios

export class SoundManager {
  /* Manages Voice objects by directing them which audio
   *  files to play.
   */
  constructor() {
    this.soundSources = new Map();
    this.audioManifest = null;
    this._audioManifestLoadedPromise = new Promise((resolve) => {
      this._audioManifestLoadedPromiseResolve = resolve;
    });
    this._lastNote = null;
    this._playTimeoutIds = new Set();
    this._playingSources = [];
    this._restartTimeoutId = null;
    this._nextRestart = 0;
  }

  initialise() {
    this.audioFormat = util.getSupportedAudioFormat();
    if (this.audioFormat) {
      console.info(`Audio format: ${this.audioFormat}`);
    } else {
      throw "No supported audio format!";
    }
    this.startFetchAudioManifest().then(() =>
      this._audioManifestLoadedPromiseResolve(),
    );
    this._refreshNoteChangeSpread();
    this._calculatePanValues();
  }

  startFetchAudioManifest() {
    return fetch(audioDir + "audio-files.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .then((json) => {
        this.audioManifest = json;
      })
      .catch((e) => {
        console.error(`audio manifest initialisation error: ${e}`);
      });
  }

  audioManifestLoaded() {
    return this._audioManifestLoadedPromise;
  }

  /* To be called on startup, and when.
   * Loads a single voice for each
   */
  loadSound(frequencies) {
    const notes = frequencies.map((f) => util.calculateWestNote(f));
    notes.forEach((n) => {
      this._getSources(n.name, 1); // create a new source if none are present
    });
  }

  /* Return the list of SoundSource objects
   * which have an audio file for the given note name.
   * For nCreate > 0, that many new SoundSources
   * are created if they do not already exist.
   * The maximum number of SoundSources for each
   * note is the number of different audio files
   * available for that note.
   */
  _getSources(noteName, nCreate = 0) {
    if (!this.soundSources.has(noteName)) {
      this.soundSources.set(noteName, []);
    }
    if (nCreate > 0) {
      const currNSources = this.soundSources.get(noteName).length;
      const nUrls = this.urlsOfNote(noteName).length;
      nCreate = Math.min(nCreate, nUrls);
      for (let i = currNSources; i < nCreate; i++) {
        const url = this.urlsOfNote(noteName)[i];
        this.soundSources
          .get(noteName)
          .push(new SoundSource(url, 0.8 / N_VOICES ** (3 / 5)));
      }
    }
    return this.soundSources.get(noteName);
  }

  playFrequency(frequency) {
    const newNote = util.calculateWestNote(frequency);
    if (!this._haveAudioForNote(newNote)) {
      console.warn(`Note ${newNote.name} has no matching audio file`);
      return;
    }
    if (this._lastNote) {
      if (DEBUG) console.debug(`Stopping _lastNote ${this._lastNote.name}`);
      this.stop(true);
    }
    this._lastNote = newNote;
    if (DEBUG) console.debug(`Scheduling newNote ${newNote.name}`);
    const sources = this._getSources(newNote.name, N_VOICES);
    sources.forEach((source) => {
      source.setSemitonesOffset(newNote.semitonesOffset);
    });
    const startSourceI = math.randomInt(sources.length);
    for (let i = 0; i < N_VOICES; i++) {
      const thisSourceI = (startSourceI + i) % sources.length;
      const id = setTimeout(() => {
        const pan = this._panValues[i];
        sources[thisSourceI].play(pan);
        this._playingSources.push(sources[thisSourceI]);
      }, this._noteChangeSpreadMs[i]);
      this._playTimeoutIds.add(id);
    }
    this._nextRestartIndex = 0;
    this._scheduleNextRestart();
  }

  stop(fast = false) {
    /* Cancel all pending activities */
    this._playTimeoutIds.forEach((id) => {
      clearTimeout(id);
    });
    this._playTimeoutIds.clear();
    clearTimeout(this._restartTimeoutId);
    this._restartTimeoutId = null;
    this._playingSources = [];
    const sourceIdPairs = [];
    if (this._lastNote) {
      this._getSources(this._lastNote.name).forEach((source) => {
        source.cancelScheduledPlays();
        source.getPlayingIds().forEach((id) => {
          sourceIdPairs.push([source, id]);
        });
      });
    }
    /* Schedule the stop actions */
    this._refreshNoteChangeSpread();
    for (const [i, pair] of sourceIdPairs.entries()) {
      setTimeout(() => {
        const source = pair[0];
        const id = pair[1];
        source.stopId(id, fast);
      }, this._noteChangeSpreadMs[i]);
    }
  }

  _scheduleNextRestart() {
    let restartMs = TOTAL_RESTART_TIME_MS / N_VOICES;
    restartMs -= math.randomInt(restartMs * 0.25);
    this._restartTimeoutId = setTimeout(() => {
      if (this._nextRestartIndex > this._playingSources.length - 1) {
        this._nextRestartIndex = 0;
      }
      this._playingSources[this._nextRestartIndex].restartOldest();
      this._nextRestartIndex += 1;
      this._scheduleNextRestart();
    }, restartMs);
  }

  haveAudioForFreq(frequency) {
    const note = util.calculateWestNote(frequency);
    return this._haveAudioForNote(note);
  }

  _haveAudioForNote(note) {
    console.log(this.audioFormat);
    console.log(this.audioManifest[this.audioFormat]);
    return Object.keys(this.audioManifest[this.audioFormat]).includes(
      note.name,
    );
  }

  urlsOfNote(noteName) {
    const files = this.audioManifest[this.audioFormat][noteName];
    return files.map((f) => `${audioDir}${this.audioFormat}/${f}`);
  }

  _refreshNoteChangeSpread() {
    this._noteChangeSpreadMs = [0];
    if (N_VOICES > 1) {
      const inc = NOTE_CHANGE_SPREAD_MS / (N_VOICES - 1);
      const random = Math.floor(inc * 0.3);
      let last = 0;
      for (let i = 1; i < N_VOICES; i++) {
        last += inc + math.randomInt(random) - random / 2;
        this._noteChangeSpreadMs.push(last);
      }
    }
  }

  _calculatePanValues(nVoices = N_VOICES) {
    const pans = [];
    let maxPan = 0;
    if (nVoices === 1) {
      pans.push(0);
    } else {
      maxPan = Math.min((nVoices - 1) * 0.2, 1.0);
      const interval = (2 / (nVoices - 1)) * maxPan;
      const nLevels = Math.floor(nVoices / 2); // Excludes center level
      let level;
      if (nVoices % 2 === 1) {
        // Odd - one voice dead center
        pans.push(0);
        level = interval;
      } else {
        // Even - all voices panned
        level = interval / 2;
      }
      for (let i = 0; i < nLevels; i++) {
        pans.push(level, -level);
        level += interval;
      }
    }
    this._panValues = pans;
    if (DEBUG)
      console.debug(
        `Pans ${nVoices} (${maxPan.toFixed(2)}): ${pans.map((p) => p.toFixed(2))}`,
      );
  }
}
