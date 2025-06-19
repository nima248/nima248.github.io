import { Voice } from "./Voice.js";
import * as math from "./math.js";
import * as util from "./util.js";

const audioDir = "/assets/audio/";

const N_VOICES = 1;

export class VoiceManager {
  /* Manages Voice objects by directing them which audio
   *  files to play.
   */
  constructor(nVoices = N_VOICES) {
    this.voices = new Map();
    this.audioManifest = null;
    this._audioManifestLoaded = new Promise((resolve) => {
      this._audioManifestLoadedResolve = resolve;
    });
  }

  initialise() {
    this.audioFormat = getSupportedAudioFormat();
    if (this.audioFormat) {
      console.info(`Audio format: ${this.audioFormat}`);
    } else {
      throw "No supported audio format!";
    }
    this.startFetchAudioManifest().then(() =>
      this._audioManifestLoadedResolve(),
    );
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
    return this._audioManifestLoaded;
  }

  loadVoices(frequencies) {
    const notes = frequencies.map((f) => calculateWestNote(f));
    notes.forEach((n) => {
      this.getVoices(n.name); // loads a new voice if none are present
    });
  }

  getVoices(noteName) {
    if (!this.voices.has(noteName)) {
      this.voices.set(noteName, []);
    }
    if (this.voices.get(noteName).length < 1) {
      const url = this.urlsOfNote(noteName)[0];
      this.voices.get(noteName).push(new Voice(url));
    }
    return this.voices.get(noteName);
  }

  async playFrequency(frequency) {
    const note = calculateWestNote(frequency);
    if (!this._haveAudioForNote(note)) {
      console.warn(`Note ${note.name} has no matching audio file`);
      return;
    }
    this.stop(true);
    const voice = util.randomChoice(this.getVoices(note.name));
    voice.setSemitonesOffset(note.semitonesOffset);
    voice.play();
  }

  stop(fast = false) {
    for (const voice of Array.from(this.voices.values()).flat()) {
      voice.stop(fast);
    }
  }

  haveAudioForFreq(frequency) {
    const note = calculateWestNote(frequency);
    return this._haveAudioForNote(note);
  }

  _haveAudioForNote(note) {
    return Object.keys(this.audioManifest[this.audioFormat]).includes(
      note.name,
    );
  }

  urlsOfNote(noteName) {
    const files = this.audioManifest[this.audioFormat][noteName];
    return files.map((f) => `${audioDir}${this.audioFormat}/${f}`);
  }
}

const NOTES = [
  "A",
  "Ash",
  "B",
  "C",
  "Csh",
  "D",
  "Dsh",
  "E",
  "F",
  "Fsh",
  "G",
  "Gsh",
];

function calculateWestNote(frequency) {
  // A4 = 440Hz
  const noteNum = 12 * math.baseLog(2, frequency / 440) + 48;
  const noteNumInt = Math.floor(noteNum + 0.5);
  const letterIndex = noteNumInt % 12; // A = 0
  const octave = Math.floor((noteNum + 9.5) / 12);
  const semitonesOffset = noteNum - noteNumInt;
  return {
    name: `${NOTES[letterIndex]}${octave}`,
    semitonesOffset: semitonesOffset, // between -0.5 and 0.5
  };
}

function getSupportedAudioFormat() {
  const audio = document.createElement("audio");

  if (audio.canPlayType('audio/ogg; codecs="vorbis"')) {
    return "ogg";
  } else if (audio.canPlayType("audio/mpeg")) {
    return "mp3";
  } else {
    return null; // No supported format found
  }
}
