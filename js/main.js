import { SoundManager } from "./SoundManager.js";
import { ScaleManager } from "./ScaleManager.js";

const MAX_PITCH_SHIFT = 6;
const MIN_PITCH_SHIFT = -8;

const ACTIVE_NOTE_CLASS = "active-note";

const soundManager = new SoundManager();
soundManager.initialise();
const scaleManager = new ScaleManager();

const noteButtons = document.querySelectorAll(".note-btn");
const pitchButtons = document.querySelectorAll(".pitch-btn");

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

async function setNotesEnabledStatusAsync() {
  await soundManager.audioManifestLoaded();
  noteButtons.forEach((button) => {
    const freq = freqOfButton(button);
    if (soundManager.haveAudioForFreq(freq)) {
      button.disabled = false;
    } else {
      button.disabled = true;
    }
  });
}

function loadEnabledNotes() {
  const enBut = getEnabledButtons();
  const freqs = enBut.map((b) => freqOfButton(b));
  soundManager.loadSound(freqs);
}

function getEnabledButtons() {
  const enabledButtons = [];
  noteButtons.forEach((button) => {
    if (!button.disabled) {
      enabledButtons.push(button);
    }
  });
  return enabledButtons;
}

function activateNoteButton(button) {
  button.classList.add(ACTIVE_NOTE_CLASS);
  activeNoteButton = button;
}

function deactivateNoteButton(button) {
  button.classList.remove(ACTIVE_NOTE_CLASS);
  activeNoteButton = null;
}

addEventListener("DOMContentLoaded", () => {
  setNotesEnabledStatusAsync().then(() => loadEnabledNotes());
});

noteButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (button.classList.contains(ACTIVE_NOTE_CLASS)) {
      // deactivate
      button.classList.remove(ACTIVE_NOTE_CLASS);
      activeNoteButton = null;
      soundManager.stop();
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

const pitchDownBtn = document.querySelector("#pitch-down");
const pitchUpBtn = document.querySelector("#pitch-up");
const pitchShiftP = document.querySelector("#pitch-shift");
pitchShiftP.textContent = scaleManager.getSemitonesShift();

pitchButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    //
    const semitonesChange = button.id === "pitch-up" ? 1 : -1;
    scaleManager.changeSemitonesShift(semitonesChange);
    setNotesEnabledStatusAsync().then(() => loadEnabledNotes());
    if (activeNoteButton !== null) {
      const freq = freqOfButton(activeNoteButton);
      if (soundManager.haveAudioForFreq(freq)) {
        soundManager.playFrequency(freq);
      } else {
        soundManager.stop();
        activeNoteButton.disabled = true;
        deactivateNoteButton(activeNoteButton);
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
