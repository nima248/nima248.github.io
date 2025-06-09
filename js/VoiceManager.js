import { Voice } from "./Voice.js";
import { getTone } from "./ToneJsLoader.js";

let Tone; // dynamically imported on user interaction

const bufferCache = new Map();

export class VoiceManager {
  /* Manages Voice objects by directing them which audio
   *  files to load and play.
   */
  constructor(nVoices = 2) {
    this.voices = [];
    this.nVoices = nVoices;
    this.audioFiles = null;
    this.readJson();
  }

  async readJson() {
    fetch("/assets/audio/audio-files.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .then((json) => {
        this.audioFiles = json;
      })
      .catch((e) => {
        console.log(`json import error: ${e}`);
      });
  }

  async playFrequency(frequency) {
    const note = calculateWestNote(frequency);
    console.log(`Freq ${frequency} is ${note.name} ${note.offset.toFixed(2)}`);
  }

  async loadBuffer(url) {
    if (!Tone) {
      Tone = await ToneJsLoader.getTone();
    }
    if (bufferCache.has(url)) {
      return bufferCache.get(url);
    }
    const buffer = await new Tone.ToneAudioBuffer(url).load();
    bufferCache.set(url, buffer);
    return buffer;
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
  const noteNum = 12 * log2(frequency / 440) + 48;
  const noteNumInt = Math.floor(noteNum + 0.5);
  const letterIndex = noteNumInt % 12; // A = 0
  const octave = Math.floor((noteNum + 9.5) / 12);
  const semitonesOffset = noteNum - noteNumInt;
  return {
    name: `${NOTES[letterIndex]}${octave}`,
    offset: semitonesOffset, // between -0.5 and 0.5
  };
}

function log2(number) {
  return Math.log(number) / Math.log(2);
}

/* Handle dynamic importing of ToneJS on user interaction.
 * Required because ToneJS tries to start an audio context
 * on import, and this triggers a warning in the browser
 * if no user interaction has happened yet.
 */
const noteBtnSelector = ".note-btn";

async function importToneJs() {
  console.log("Importing Tone.js...");
  Tone = await getTone();
  console.log("Tone.js imported");
  await Tone.start();
  console.log("Audio context intialised");
  document.querySelectorAll(noteBtnSelector).forEach((btn) => {
    btn.removeEventListener("click", importToneJs);
  });
}

document.querySelectorAll(noteBtnSelector).forEach((btn) => {
  btn.addEventListener("click", importToneJs);
});
