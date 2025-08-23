import { SoundManager } from "./SoundManager.js";
import { ScaleManager } from "./ScaleManager.js";

const MAX_PITCH_SHIFT = 6;
const MIN_PITCH_SHIFT = -8;

const ACTIVE_NOTE_CLASS = "active-note";
const NO_AUDIO_AVAILABLE_CLASS = "no-audio-available";

const soundManager = new SoundManager();
soundManager.initialise();
const scaleManager = new ScaleManager();

const noteButtons = document.querySelectorAll(".note-btn");
const pitchButtons = document.querySelectorAll(".pitch-btn");
const body = document.querySelector("body");

let activeNoteButton = null;

function freqOfButton(button) {
  let note = button.id.replace("note-", "");
  let octave = 0;
  if (note.startsWith("low-")) {
    note = note.replace("low-", "");
    octave = -1;
  } else if (note.startsWith("high-")) {
    note = note.replace("high-", "");
    octave = 1;
  }
  note = note.replace("-", "_");
  return scaleManager.getFreq(note, octave);
}

async function setNotesAudioAvailableStatusAsync() {
  await soundManager.audioManifestLoaded();
  noteButtons.forEach((button) => {
    const freq = freqOfButton(button);
    if (soundManager.haveAudioForFreq(freq)) {
      button.classList.remove(NO_AUDIO_AVAILABLE_CLASS);
    } else {
      button.classList.add(NO_AUDIO_AVAILABLE_CLASS);
    }
  });
}

function loadAudioAvailableNotes() {
  const enBut = getAudioAvailableButtons();
  const freqs = enBut.map((b) => freqOfButton(b));
  soundManager.loadSound(freqs);
}

function getAudioAvailableButtons() {
  const audioAvailableButtons = [];
  noteButtons.forEach((button) => {
    if (!button.classList.contains(NO_AUDIO_AVAILABLE_CLASS)) {
      audioAvailableButtons.push(button);
    }
  });
  return audioAvailableButtons;
}

function activateNoteButton(button) {
  button.classList.add(ACTIVE_NOTE_CLASS);
  activeNoteButton = button;
}

async function turnOffSound() {
  soundManager.stop();
  if (activeNoteButton) {
    activeNoteButton.classList.remove(ACTIVE_NOTE_CLASS);
    activeNoteButton = null;
  }
}

// Help with glitchy vertical height calculation on first load
function forceReflow() {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 100);
}
if (document.readyState === "complete") {
  forceReflow();
} else {
  window.addEventListener("load", () => {
    forceReflow();
  });
}

addEventListener("DOMContentLoaded", () => {
  setNotesAudioAvailableStatusAsync().then(() => loadAudioAvailableNotes());
});

noteButtons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.stopPropagation();

    if (
      button.classList.contains(ACTIVE_NOTE_CLASS) ||
      button.classList.contains(NO_AUDIO_AVAILABLE_CLASS)
    ) {
      // deactivate
      turnOffSound();
    } else {
      // activate
      if (activeNoteButton) {
        activeNoteButton.classList.remove(ACTIVE_NOTE_CLASS);
      }
      button.classList.add(ACTIVE_NOTE_CLASS);
      activeNoteButton = button;
      const freq = freqOfButton(button);
      soundManager.playFrequency(freq);
    }
  });
});

body.addEventListener("click", async (event) => {
  turnOffSound();
});

const pitchDownBtn = document.querySelector("#pitch-down");
const pitchUpBtn = document.querySelector("#pitch-up");
const pitchShiftP = document.querySelector("#pitch-shift");
pitchShiftP.textContent = scaleManager.getSemitonesShift();

pitchButtons.forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.stopPropagation();

    const semitonesChange = button.id === "pitch-up" ? 1 : -1;
    scaleManager.changeSemitonesShift(semitonesChange);
    setNotesAudioAvailableStatusAsync().then(() => loadAudioAvailableNotes());
    if (activeNoteButton !== null) {
      const freq = freqOfButton(activeNoteButton);
      if (soundManager.haveAudioForFreq(freq)) {
        soundManager.playFrequency(freq);
      } else {
        activeNoteButton.classList.add(NO_AUDIO_AVAILABLE_CLASS);
        turnOffSound();
      }
    }

    // update pitch buttons UI
    const newPitchShift = scaleManager.getSemitonesShift();
    pitchShiftP.textContent = newPitchShift;
    if (semitonesChange === 1) {
      pitchDownBtn.disabled = false;
      if (newPitchShift === MAX_PITCH_SHIFT) {
        pitchUpBtn.disabled = true;
      }
    } else {
      pitchUpBtn.disabled = false;
      if (newPitchShift === MIN_PITCH_SHIFT) {
        pitchDownBtn.disabled = true;
      }
    }
  });
});
