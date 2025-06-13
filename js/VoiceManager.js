import { Voice } from "./Voice.js";
import * as math from "./math.js";

const audioDir = "/assets/audio/";

export class VoiceManager {
  /* Manages Voice objects by directing them which audio
   *  files to play.
   */
  constructor(nVoices = 7) {
    this.voices = [];
    this.audioManifest = null;
    this.audioFileBlobs = new Map();
    this.audioFileBlobURLs = new Map();
    this.playingFreq = null;
    this.setNVoices(nVoices);
    this.startFetchAudio();
  }

  setNVoices(nVoices) {
    if (!Number.isInteger(nVoices)) {
      throw `Can't set nVoices to ${nVoices} - must be integer`;
    }
    this.nVoices = nVoices;
    this.voiceVolumeDb = 20 * math.baseLog(10, 1 / Math.sqrt(nVoices));
    if (this.playingFreq) {
      // gracefully restart all voices
      for (voice of this.voices) {
        voice.restartWithNewVolume(this.voiceVolumeDb);
      }
    } else {
      for (voice of this.voices) {
        voice.setVolume(this.voiceVolumeDb);
      }
    }
  }

  startFetchAudio() {
    // Load audio files manifest
    fetch(audioDir + "audio-files.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      // Fetch all audio files
      .then((json) => {
        this.audioManifest = json;
        const allFiles = Object.values(this.audioManifest).flat();
        for (const file of allFiles) {
          this.audioFileBlobs.set(
            file,
            fetch(`${audioDir}${file}`).then((res) => res.blob()),
          );
          this.audioFileBlobURLs.set(
            file,
            this.audioFileBlobs
              .get(file)
              .then((blob) => URL.createObjectURL(blob)),
          );
        }
        Promise.all(this.audioFileBlobURLs.values()).then(() => {
          console.info(`Fetched ${this.audioFileBlobURLs.size} audio files`);
        });
      })
      .catch((e) => {
        console.error(`initialisation error: ${e}`);
      });
  }

  async playFrequency(frequency) {
    const note = calculateWestNote(frequency);
    if (!Object.keys(this.audioManifest).includes(note.name)) {
      console.warn(`Note ${note.name} has no matching audio file`);
      return;
    }
    // Start all voices
    const choices = this.audioManifest[note.name];
    for (let i = 0; i < this.nVoices; i++) {
      const file = choices[math.randomInt(choices.length)];
      const url = await this.audioFileBlobURLs.get(file);
      if (this.voices.length < i + 1) {
        this.voices.push(new Voice());
        console.debug(`Added voice number ${this.voices.length}`);
        await this.voices[i].initialise(this.voiceVolumeDb);
      }
      this.voices[i].playFile(url, note.semitonesOffset);
      // Delay between starting each voice
      if (i < this.nVoices - 1) {
        let delayMs = (200 + math.randomInt(350)) / this.nVoices;
        await new Promise((r) => setTimeout(r, delayMs));
        console.debug(`Delaying ${delayMs} ms`);
      }
    }
  }

  stopAll() {
    console.debug("Stopping all voices");
    this.playingFreq = null;
    for (const voice of this.voices) {
      voice.stop();
    }
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
